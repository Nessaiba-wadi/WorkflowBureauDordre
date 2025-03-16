package org.example.controller;
import com.fasterxml.jackson.core.JsonParser;
import jakarta.persistence.EntityManager;
import org.example.repository.CommandeRepository;
import org.example.repository.ReglementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.json.JsonParseException;
import org.springframework.core.io.Resource;

import org.example.model.Commande;
import org.example.model.Comptabilisation;
import org.example.model.Utilisateur;
import org.example.repository.ComptabilisationRepository; // Importez le repository
import org.example.service.ComptabilisationService;
import org.example.service.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;


@CrossOrigin(origins = {"http://127.0.0.1:8080", "http://localhost:8080"})
@RestController
@RequestMapping("/comptabilisations")
public class ComptabilisationController {

    @Autowired
    private ComptabilisationService comptabilisationService;

    @Autowired
    private UtilisateurService utilisateurService;

    @Autowired
    private ComptabilisationRepository comptabilisationRepository;

    @Autowired
    private ReglementRepository reglementRepository;
    @Autowired
    private EntityManager entityManager;
    @Autowired
    private CommandeRepository commandeRepository;
    private static final Logger log = LoggerFactory.getLogger(ComptabilisationController.class);

    @Value("${file.upload-dir}")
    private String uploadDir;

    private boolean isValidFileType(String contentType) {
        return contentType != null && (
                contentType.equals("application/pdf") ||
                        contentType.equals("application/msword") ||
                        contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        );
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> creerComptabilisation(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("comptabilisationData") String comptabilisationJson,
            @RequestParam Integer utilisateurId) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_CONTROL_CHARS, true);
            Comptabilisation comptabilisation = mapper.readValue(comptabilisationJson, Comptabilisation.class);

            // Vérifier l'utilisateur
            Utilisateur utilisateur = utilisateurService.getUtilisateurById(utilisateurId);
            if (!comptabilisationService.isComptable(utilisateur)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Cette opération nécessite des droits de comptable.");
            }

            if (!utilisateur.isStatut()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Votre compte doit être actif pour effectuer cette opération.");
            }

            // Validation
            String validationError = comptabilisationService.validateComptabilisation(comptabilisation);
            if (validationError != null) {
                return ResponseEntity.badRequest().body(validationError);
            }

            // Gestion du fichier après validation
            String newFilename = null;
            if (file != null && !file.isEmpty()) {
                String contentType = file.getContentType();
                if (!isValidFileType(contentType)) {
                    return ResponseEntity.badRequest()
                            .body("Le type de fichier n'est pas supporté. Veuillez fournir un document au format PDF ou Word (.doc, .docx).");
                }

                String originalFilename = file.getOriginalFilename();
                String fileExtension = originalFilename.substring(originalFilename.lastIndexOf('.'));
                newFilename = UUID.randomUUID().toString() + fileExtension;

                Path uploadPath = Paths.get(uploadDir, "Comptable");
                Files.createDirectories(uploadPath);
                Path filePath = uploadPath.resolve(newFilename);
                Files.write(filePath, file.getBytes());
            }

            comptabilisation.setUtilisateur(utilisateur);
            Comptabilisation nouvelleComptabilisation = comptabilisationService.creerComptabilisation(comptabilisation);

            // Enregistrer le fichier joint seulement si la création est réussie
            if (newFilename != null) {
                nouvelleComptabilisation.setFichierJoint(newFilename);
                comptabilisationRepository.save(nouvelleComptabilisation);
            }
           
            return ResponseEntity.ok("La comptabilisation a été créée avec succès.");

        }catch (JsonParseException e) {
            return ResponseEntity.badRequest().body("Erreur de format JSON: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Une erreur technique est survenue lors de la création de la comptabilisation. " +
                            "Veuillez réessayer ultérieurement ou contacter le support technique si le problème persiste.");
        }
    }


    /**
     * Récupérer toutes les comptabilisations avec état validé
     */
    @GetMapping
    public ResponseEntity<?> getAllComptabilisations(
            @RequestHeader(value = "Authorization", required = false) String email) {
        try {
            // Log pour déboguer
            System.out.println("Tentative d'accès aux comptabilisations validées - Email: " +
                    (email != null ? email : "non fourni"));

            // Vérifier l'authentification de l'utilisateur
            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Utilisateur non authentifié: email manquant");
            }

            Utilisateur utilisateur = utilisateurService.findByEmail(email);
            if (utilisateur == null) {
                // Log pour déboguer
                System.out.println("Utilisateur non trouvé pour l'email: " + email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Utilisateur non authentifié: utilisateur non trouvé");
            }

            // Vérifier si l'utilisateur est un comptable
            boolean isComptable = comptabilisationService.isComptable(utilisateur);
            System.out.println("Utilisateur " + email + " est comptable: " + isComptable);


            // Récupérer les comptabilisations validées
            List<Comptabilisation> comptabilisations = comptabilisationService.getComptabilisationsValidees();

            // Log pour déboguer
            System.out.println("Nombre de comptabilisations validées trouvées: " + comptabilisations.size());

            // Transformer les comptabilisations en DTO pour l'affichage frontend
            List<Map<String, Object>> result = comptabilisations.stream().map(c -> {
                Map<String, Object> comptaMap = new HashMap<>();
                comptaMap.put("id", c.getIdComptabilisation());
                comptaMap.put("dateComptabilisation", c.getDateComptabilisation());
                comptaMap.put("dateTransmission", c.getDateTransmission());
                comptaMap.put("personneCollectrice", c.getPersonnesCollectrice());
                comptaMap.put("commentaire", c.getCommentaire());
                comptaMap.put("etat", c.getEtat());
                comptaMap.put("fichierJoint", c.getFichierJoint() != null && !c.getFichierJoint().isEmpty());
                comptaMap.put("numeroBC", c.getCommande() != null ? c.getCommande().getNumeroBC() : null);
                return comptaMap;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            // Log plus détaillé de l'erreur
            System.err.println("Erreur lors de la récupération des comptabilisations: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de la récupération des comptabilisations: " + e.getMessage());
        }
    }

    /**
     * Télécharger un fichier joint à une comptabilisation
     */
    @GetMapping("/fichier/{id}")
    public ResponseEntity<?> getFichierComptabilisation(
            @PathVariable("id") Integer id,
            @RequestHeader("Authorization") String emailUtilisateur) {
        try {
            // Récupérer l'utilisateur et vérifier son autorisation
            Utilisateur utilisateur = utilisateurService.findByEmail(emailUtilisateur);
            if (utilisateur == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Utilisateur non authentifié"));
            }

            // Récupérer la comptabilisation
            Optional<Comptabilisation> comptabilisationOpt = comptabilisationRepository.findById(id);
            if (!comptabilisationOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Comptabilisation non trouvée"));
            }

            Comptabilisation comptabilisation = comptabilisationOpt.get();

            // Vérifier si un fichier existe
            if (comptabilisation.getFichierJoint() == null || comptabilisation.getFichierJoint().isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Aucun fichier joint à cette comptabilisation"));
            }

            // Construire le chemin du fichier en incluant le sous-dossier "Comptable"
            Path cheminFichier = Paths.get(uploadDir).resolve("Comptable").resolve(comptabilisation.getFichierJoint()).normalize();

            // Vérifier si le fichier existe physiquement
            if (!Files.exists(cheminFichier)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Fichier non trouvé sur le serveur"));
            }

            // Déterminer le type de contenu
            String contentType = Files.probeContentType(cheminFichier);
            if (contentType == null) {
                // Déterminer le type en fonction de l'extension
                String nomFichier = comptabilisation.getFichierJoint();
                if (nomFichier.endsWith(".pdf")) {
                    contentType = "application/pdf";
                } else if (nomFichier.endsWith(".doc")) {
                    contentType = "application/msword";
                } else if (nomFichier.endsWith(".docx")) {
                    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                } else {
                    contentType = "application/octet-stream";
                }
            }

            // Préparer la ressource à retourner
            Resource resource = new UrlResource(cheminFichier.toUri());

            // Utiliser un nom de fichier sécurisé pour le téléchargement
            String originalExtension = "";
            if (comptabilisation.getFichierJoint().contains(".")) {
                originalExtension = comptabilisation.getFichierJoint().substring(comptabilisation.getFichierJoint().lastIndexOf("."));
            }
            String securisedFileName = "comptabilisation_" + id + originalExtension;

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + securisedFileName + "\"")
                    .body(resource);

        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération du fichier de comptabilisation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la récupération du fichier: " + e.getMessage()));
        }
    }
    @RestController
    @RequestMapping("/api/comptabilisations")
    public class ComptableFileController {

        @Value("${file.upload-dir}")
        private String uploadDir;

        private static final Logger log = LoggerFactory.getLogger(ComptableFileController.class);

        /**
         * Endpoint pour accéder aux fichiers comptables par leur nom
         */
        @GetMapping("/fichier/{fileName:.+}")
        public ResponseEntity<Resource> serveComptableFile(@PathVariable String fileName) {
            try {
                // Construction du chemin absolu vers le fichier
                Path filePath = Paths.get(uploadDir).resolve("Comptable").resolve(fileName).normalize();
                Resource resource = new UrlResource(filePath.toUri());

                if (resource.exists()) {
                    // Déterminer le type de contenu
                    String contentType = null;
                    try {
                        contentType = Files.probeContentType(filePath);
                    } catch (IOException e) {
                        log.debug("Impossible de déterminer le type de contenu", e);
                    }

                    // Fallback si le type ne peut pas être déterminé
                    if (contentType == null) {
                        contentType = "application/octet-stream";

                        // Essayer de déterminer le type par l'extension
                        if (fileName.endsWith(".pdf")) {
                            contentType = "application/pdf";
                        } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
                            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                        } else if (fileName.endsWith(".csv")) {
                            contentType = "text/csv";
                        }
                    }

                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(contentType))
                            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                            .body(resource);
                } else {
                    return ResponseEntity.notFound().build();
                }
            } catch (MalformedURLException e) {
                log.error("Erreur lors de la récupération du fichier comptable: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

        /**
         * Endpoint pour lister tous les fichiers comptables disponibles
         */
        @GetMapping("/liste")
        public ResponseEntity<List<String>> listComptableFiles() {
            try {
                Path dirPath = Paths.get(uploadDir).resolve("Comptable");
                if (Files.exists(dirPath)) {
                    List<String> fileNames = Files.list(dirPath)
                            .filter(Files::isRegularFile)
                            .map(path -> path.getFileName().toString())
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(fileNames);
                } else {
                    return ResponseEntity.ok(new ArrayList<>());
                }
            } catch (IOException e) {
                log.error("Erreur lors de la lecture du répertoire des fichiers comptables: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
    }

    /**
     * Afficher les commandes qui ont état validé pour les comptabilisées,
     * en excluant celles qui ont une comptabilisation en cours
     */
    @GetMapping("/commandes-validees")
    public ResponseEntity<?> getCommandesValidees(@RequestHeader("Authorization") String emailUtilisateur) {
        try {
            // Vérifier si l'utilisateur est autorisé
            Utilisateur utilisateur = utilisateurService.findByEmail(emailUtilisateur);

            // Utiliser un repository personnalisé ou écrire une requête JPQL/native pour suivre exactement la logique SQL
            // Voici une implémentation avec JPQL
            String jpql = "SELECT c FROM Commande c WHERE c.status = true AND c.etatCommande = 'validé' " +
                    "AND NOT EXISTS (SELECT 1 FROM Comptabilisation comp WHERE comp.commande.idCommande = c.idCommande " +
                    "AND comp.etat = 'en cours')";

            List<Commande> commandesValidees = entityManager.createQuery(jpql, Commande.class).getResultList();

            // Transformer les commandes en DTOs
            List<Map<String, Object>> result = new ArrayList<>();
            for (Commande commande : commandesValidees) {
                Map<String, Object> dto = new HashMap<>();
                dto.put("idCommande", commande.getIdCommande());
                dto.put("dateReception", commande.getDateModification());
                dto.put("raisonSocialeFournisseur", commande.getRaisonSocialeFournisseur());
                dto.put("raisonSocialeGBM", commande.getRaisonSocialeGBM());
                dto.put("numeroBC", commande.getNumeroBC());
                dto.put("directionGBM", commande.getDirectionGBM());
                dto.put("souscripteur", commande.getSouscripteur());
                dto.put("typeDocument", commande.getTypeDocument());
                dto.put("dateRelanceBR", commande.getDateRelanceBR());
                dto.put("typeRelance", commande.getTypeRelance());
                dto.put("fichierJoint", commande.getFichierJoint());

                // Vérifier si une comptabilisation validée existe pour cette commande
                String jpqlCompta = "SELECT comp FROM Comptabilisation comp WHERE comp.commande.idCommande = :commandeId " +
                        "AND comp.etat = 'validé'";
                List<Comptabilisation> comptaValidees = entityManager.createQuery(jpqlCompta, Comptabilisation.class)
                        .setParameter("commandeId", commande.getIdCommande())
                        .getResultList();

                if (!comptaValidees.isEmpty()) {
                    Comptabilisation comptabilisation = comptaValidees.get(0);
                    dto.put("dateTransmission", comptabilisation.getDateTransmission());
                    dto.put("personnesCollectrice", comptabilisation.getPersonnesCollectrice());
                    dto.put("comptabilise", true);
                } else {
                    dto.put("dateTransmission", null);
                    dto.put("personnesCollectrice", null);
                    dto.put("comptabilise", false);
                }

                result.add(dto);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur: " + e.getMessage()));
        }
    }


    /**
     * Récupérer les détails d'une commande avec ses données de comptabilisation
     */
    @GetMapping("/commande/{commandeId}")
    public ResponseEntity<?> getCommandeDetails(
            @PathVariable("commandeId") Integer commandeId,
            @RequestHeader("Authorization") String emailUtilisateur) {

        try {
            // Vérifier si l'utilisateur est authentifié
            Utilisateur utilisateur = utilisateurService.findByEmail(emailUtilisateur);
            if (utilisateur == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Utilisateur non authentifié"));
            }

            // Récupérer la commande
            Optional<Commande> commandeOpt = commandeRepository.findById(commandeId);
            if (!commandeOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Commande non trouvée"));
            }

            Commande commande = commandeOpt.get();

            // Récupérer les données de comptabilisation associées à cette commande
            Optional<Comptabilisation> comptabilisationOpt = comptabilisationRepository.findByCommande(commande);

            // Créer l'objet de réponse
            Map<String, Object> response = new HashMap<>();

            // Informations de la commande (première section de l'interface)
            response.put("numeroBC", commande.getNumeroBC());
            response.put("dateReception", commande.getDateReception());
            response.put("raisonSocialeFournisseur", commande.getRaisonSocialeFournisseur());
            response.put("raisonSocialeGBM", commande.getRaisonSocialeGBM());
            response.put("directionGBM", commande.getDirectionGBM());
            response.put("souscripteur", commande.getSouscripteur());
            response.put("typeDocument", commande.getTypeDocument());
            response.put("commandeId", commande.getIdCommande());
            response.put("status", commande.isStatus());

            // Informations de suivi (deuxième section de l'interface)
            response.put("dateRelanceBR", commande.getDateRelanceBR());
            response.put("typeRelance", commande.getTypeRelance());
            response.put("etatDossier", commande.getEtatCommande());
            response.put("dateTransmission", commande.getDateTransmission());
            response.put("personnesCollectrice", commande.getPersonnesCollectrice());

            // Informations sur le fichier joint de la commande
            response.put("fichierJointBO", commande.getFichierJoint());  // Bureau d'ordre

            // Informations de comptabilisation (si disponibles)
            if (comptabilisationOpt.isPresent()) {
                Comptabilisation comptabilisation = comptabilisationOpt.get();

                response.put("idComptabilisation", comptabilisation.getIdComptabilisation());
                response.put("dateComptabilisation", comptabilisation.getDateComptabilisation());
                response.put("dateTransmission", comptabilisation.getDateTransmission());
                response.put("etat", comptabilisation.getEtat());
                response.put("commentaire", comptabilisation.getCommentaire());
                response.put("personnesCollectriceComptable", comptabilisation.getPersonnesCollectrice());
                response.put("fichierJointComptabilisation", comptabilisation.getFichierJoint());
            } else {
                // Valeurs par défaut si la comptabilisation n'existe pas
                response.put("idComptabilisation", null);
                response.put("dateComptabilisation", null);
                response.put("dateTransmission", null);
                response.put("etat", null);
                response.put("commentaire", null);
                response.put("personnesCollectrice", null);
                response.put("fichierJointComptabilisation", null);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération des détails de la commande: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la récupération des détails: " + e.getMessage()));
        }
    }

    /**
     * Récupérer toutes les commandes avec leurs données de comptabilisation
     */
    @GetMapping("/commandes")
    public ResponseEntity<?> getAllCommandesWithComptabilisation(
            @RequestHeader("Authorization") String emailUtilisateur) {

        try {
            // Vérifier si l'utilisateur est authentifié
            Utilisateur utilisateur = utilisateurService.findByEmail(emailUtilisateur);
            if (utilisateur == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Utilisateur non authentifié"));
            }

            // Récupérer toutes les commandes validées
            List<Commande> commandes = commandeRepository.findByStatusTrue();

            // Créer la liste des résultats
            List<Map<String, Object>> resultList = new ArrayList<>();

            for (Commande commande : commandes) {
                // Récupérer la comptabilisation associée à chaque commande
                Optional<Comptabilisation> comptabilisationOpt = comptabilisationRepository.findByCommande(commande);

                // Si une comptabilisation existe pour cette commande
                if (comptabilisationOpt.isPresent()) {
                    Comptabilisation comptabilisation = comptabilisationOpt.get();

                    Map<String, Object> commandeDetails = new HashMap<>();

                    // Informations de la commande
                    commandeDetails.put("commandeId", commande.getIdCommande());
                    commandeDetails.put("numeroBC", commande.getNumeroBC());
                    commandeDetails.put("raisonSocialeFournisseur", commande.getRaisonSocialeFournisseur());

                    // Informations de comptabilisation
                    commandeDetails.put("dateComptabilisation", comptabilisation.getDateComptabilisation());
                    commandeDetails.put("dateTransmission", comptabilisation.getDateTransmission());
                    commandeDetails.put("personnesCollectrice", comptabilisation.getPersonnesCollectrice());
                    commandeDetails.put("commentaire", comptabilisation.getCommentaire());
                    commandeDetails.put("etat", comptabilisation.getEtat());

                    resultList.add(commandeDetails);
                }
            }

            return ResponseEntity.ok(resultList);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération des commandes avec comptabilisation: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la récupération des données: " + e.getMessage()));
        }
    }

    /**
     * calculs pour le dashboard
     */
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistiquesComptable() {
        try {
            // Récupérer le nombre total de commandes reçues par le BO (avec status=true)
            long commandesRecues = commandeRepository.countByStatusAndEtatCommande(true, "validé");

            // Récupérer le nombre de commandes comptabilisées (avec status=true et état="validé" dans la table comptabilisations)
            long commandesComptabilisees = comptabilisationRepository.countByCommandeStatusAndEtat(true, "validé");

            // Récupérer le nombre de commandes non comptabilisées
            // (commandes avec status=true et état="validé" qui n'ont pas d'entrée dans la table comptabilisations)
            long commandesNonComptabilisees = commandeRepository.countNonComptabilisees(true, "validé");

            // Récupérer le nombre de commandes clôturées
            // (commandes avec status=true qui ont un règlement avec état="validé")
            long commandesCloturees = reglementRepository.countByCommandeStatusAndEtat(true, "validé");

            Map<String, Object> statistiques = new HashMap<>();
            statistiques.put("commandesRecues", commandesRecues);
            statistiques.put("commandesComptabilisees", commandesComptabilisees);
            statistiques.put("commandesNonComptabilisees", commandesNonComptabilisees);
            statistiques.put("commandesCloturees", commandesCloturees);

            return ResponseEntity.ok(statistiques);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des statistiques comptables", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}