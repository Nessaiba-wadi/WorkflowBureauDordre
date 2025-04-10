package org.example.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.example.dto.CommandeDTO;
import org.example.model.Commande;
import org.example.model.Utilisateur;
import org.example.service.CommandeService;
import org.example.service.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.example.repository.*;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.Principal;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@RestController
@RequestMapping("/BO/commandes")
@CrossOrigin(origins = {"http://127.0.0.1:8080", "http://localhost:8080"})

public class CommandeController {

    @Autowired
    private CommandeService commandeService;

    @Autowired
    private UtilisateurService utilisateurService;

    @Autowired
    private CommandeRepository commandeRepository;

    @Autowired
    private ComptabilisationRepository comptabilisationRepository;

    @Value("${file.upload-dir:uploads/commandes}")
    private String uploadDir;
    @Autowired
    private ReglementRepository reglementRepository;
    private static final Logger log = LoggerFactory.getLogger(CommandeController.class);
    private static final String[] EXTENSIONS_AUTORISEES = {".pdf", ".doc", ".docx"};
    private static final String[] MIME_TYPES_AUTORISES = {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };


    private boolean isExtensionAutorisee(String filename) {
        if (filename == null) return false;
        String ext = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        return ext.equals("pdf") || ext.equals("doc") || ext.equals("docx");
    }

    private boolean isContentTypeAutorise(String contentType) {
        return contentType != null && (
                contentType.equals("application/pdf") ||
                        contentType.equals("application/msword") ||
                        contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        );
    }


    // creer une nouvelle commande
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> creerCommande(
            @RequestParam("utilisateurId") Integer utilisateurId,
            @RequestPart("commandeData") String commandeDataStr,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        try {
            log.info("Début création commande: utilisateurId={}, données={}", utilisateurId, commandeDataStr);

            // Convertir la chaîne JSON en objet CommandeDTO
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule()); // Pour le support de LocalDate
            objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            CommandeDTO commandeDTO = objectMapper.readValue(commandeDataStr, CommandeDTO.class);

            // Récupérer l'utilisateur par ID
            Utilisateur utilisateurConnecte = utilisateurService.getUtilisateurById(utilisateurId);
            if (utilisateurConnecte == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Utilisateur non trouvé avec l'ID: " + utilisateurId
                ));
            }

            // Gestion du fichier
            String nomFichier = null;
            if (file != null && !file.isEmpty()) {
                log.info("Traitement du fichier: nom={}, type={}, taille={}",
                        file.getOriginalFilename(), file.getContentType(), file.getSize());

                // Vérifier l'extension du fichier
                if (!isExtensionAutorisee(file.getOriginalFilename()) ||
                        !isContentTypeAutorise(file.getContentType())) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "message", "Type de fichier non autorisé. Seuls les fichiers PDF et Word sont acceptés."
                    ));
                }
                nomFichier = sauvegarderFichierSecurise(file);
            }

            // Conversion du DTO en entité Commande
            Commande commande = new Commande();
            commande.setRaisonSocialeFournisseur(commandeDTO.getRaisonSocialeFournisseur());
            commande.setNumeroBC(commandeDTO.getNumeroBC());
            commande.setDirectionGBM(commandeDTO.getDirectionGBM());
            commande.setTypeDocument(commandeDTO.getTypeDocument());
            commande.setDateRelanceBR(commandeDTO.getDateRelanceBR());
            commande.setDateTransmission(commandeDTO.getDateTransmission());
            commande.setRaisonSocialeGBM(commandeDTO.getRaisonSocialeGBM());
            commande.setSouscripteur(commandeDTO.getSouscripteur());
            commande.setTypeRelance(commandeDTO.getTypeRelance());
            commande.setPersonnesCollectrice(commandeDTO.getPersonnesCollectrice());
            commande.setDossierComplet(commandeDTO.isDossierComplet());
            commande.setFichierJoint(nomFichier);
            commande.setUtilisateur(utilisateurConnecte);
            commande.setDateModification(LocalDateTime.now());
            commande.setStatus(true);
            commande.setEtatCommande("enregistré"); // Définir un état par défaut

            // Enregistrement de la commande
            Commande commandeEnregistree = commandeService.creerCommande(commande);

            // Préparation de la réponse
            Map<String, Object> reponse = new HashMap<>();
            reponse.put("message", "Commande créée avec succès");
            reponse.put("idCommande", commandeEnregistree.getIdCommande());

            return new ResponseEntity<>(reponse, HttpStatus.CREATED);

        } catch (Exception e) {
            log.error("Erreur lors de la création de la commande", e);
            Map<String, String> erreur = new HashMap<>();
            erreur.put("message", "Erreur lors de la création de la commande: " + e.getMessage());
            erreur.put("details", e.toString());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(erreur);
        }
    }
    private String sauvegarderFichierSecurise(MultipartFile file) throws IOException {
        // Générer un nom de fichier unique pour éviter les collisions
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String newFilename = "commande_" + timestamp + extension;

        // Définir le chemin de sauvegarde
        Path uploadDirPath = Paths.get(uploadDir);
        Files.createDirectories(uploadDirPath);

        // Sauvegarder le fichier
        Path destination = uploadDirPath.resolve(newFilename);
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        log.info("Fichier sauvegardé: {}", destination.toString());

        return newFilename;
    }

    private String encrypterNomFichier(String nomFichier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(nomFichier.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            log.error("Erreur lors du cryptage du nom de fichier", e);
            // Fallback si l'algorithme de hachage n'est pas disponible
            return nomFichier;
        }
    }

    // Modifiez la méthode pour obtenir toutes les commandes avec status=true
    @GetMapping
    public ResponseEntity<?> getAllCommandes(
            @RequestHeader("Authorization") String emailUtilisateur) {
        try {
            // Vérifier si l'utilisateur est authentifié
            Utilisateur utilisateur = utilisateurService.findByEmail(emailUtilisateur);
            if (utilisateur == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Utilisateur non authentifié"));
            }

            // Récupérer toutes les commandes avec status = true (au lieu de celles de l'utilisateur)
            List<Commande> commandes = commandeRepository.findByStatusTrue();

            return ResponseEntity.ok(commandes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Erreur lors de la récupération des commandes: " + e.getMessage()
            ));
        }
    }

    //afficher les commandes
    @GetMapping("/{id}")
    public ResponseEntity<?> getCommandeById(
            @PathVariable("id") Integer id,
            @RequestHeader("Authorization") String emailUtilisateur) {

        try {
            // Vérifier si l'utilisateur est autorisé
            Utilisateur utilisateur = utilisateurService.findByEmail(emailUtilisateur);

            // Récupérer la commande
            Optional<Commande> commandeOpt = commandeRepository.findById(id);

            if (!commandeOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Commande non trouvée"));
            }

            Commande commande = commandeOpt.get();



            // Ne pas tenter d'accéder au fichier si fichierJoint est null
            if (commande.getFichierJoint() != null) {
                // Construire le chemin du fichier
                Path cheminFichier = Paths.get(uploadDir).normalize();

                // Si le chemin stocké inclut "commandes/", on l'utilise directement
                if (commande.getFichierJoint().contains("/") || commande.getFichierJoint().contains("\\")) {
                    cheminFichier = cheminFichier.resolve(commande.getFichierJoint()).normalize();
                } else {
                    // Sinon on ajoute le préfixe "commandes/"
                    cheminFichier = cheminFichier.resolve("commandes").resolve(commande.getFichierJoint()).normalize();
                }
            }

            return ResponseEntity.ok(commande);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur: " + e.getMessage()));
        }
    }


    //placement du fichier
    @RestController
    @RequestMapping("/api/files")
    public class FileController {

        @Value("${file.upload-dir}")
        private String uploadDir;

        private static final Logger log = LoggerFactory.getLogger(FileController.class);

        /**
         * Endpoint pour accéder aux fichiers par leur ID
         */
        @GetMapping("/{fileName:.+}")
        public ResponseEntity<Resource> serveFile(@PathVariable String fileName) {
            try {
                // Construction du chemin absolu vers le fichier
                Path filePath = Paths.get(uploadDir).resolve("commandes").resolve(fileName).normalize();
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
                        } else if (fileName.endsWith(".doc")) {
                            contentType = "application/msword";
                        } else if (fileName.endsWith(".docx")) {
                            contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
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
                log.error("Erreur lors de la récupération du fichier: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
    }

    //Modifier une commande
    @PutMapping("/{id}")
    public ResponseEntity<?> modifierCommande(
            @PathVariable("id") Integer id,
            @ModelAttribute CommandeDTO commandeDTO,
            @RequestHeader("Authorization") String emailUtilisateur) {

        try {
            // Récupérer l'utilisateur connecté
            Utilisateur utilisateurConnecte = utilisateurService.findByEmail(emailUtilisateur);

            // Récupérer la commande existante
            Optional<Commande> commandeOpt = commandeRepository.findById(id);
            if (!commandeOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Commande non trouvée"));
            }

            Commande commande = commandeOpt.get();


            // Vérifier si la commande est déjà validée
            if ("validé".equals(commande.getEtatCommande()) && !commandeDTO.isDossierComplet()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Cette commande est déjà validée et ne peut pas être modifiée"));
            }

            // Traitement du fichier s'il est fourni
            if (commandeDTO.getFichier() != null && !commandeDTO.getFichier().isEmpty()) {
                // Vérifier l'extension du fichier
                if (!isExtensionAutorisee(commandeDTO.getFichier().getOriginalFilename()) ||
                        !isContentTypeAutorise(commandeDTO.getFichier().getContentType())) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "message", "Type de fichier non autorisé. Seuls les fichiers PDF et Word sont acceptés."
                    ));
                }
                // Supprimer l'ancien fichier si existant
                if (commande.getFichierJoint() != null && !commande.getFichierJoint().isEmpty()) {
                    try {
                        // Construire le chemin correct selon le format du nom de fichier
                        Path cheminAncienFichier;
                        if (commande.getFichierJoint().contains("/") || commande.getFichierJoint().contains("\\")) {
                            cheminAncienFichier = Paths.get(uploadDir).resolve(commande.getFichierJoint());
                        } else {
                            cheminAncienFichier = Paths.get(uploadDir).resolve("commandes").resolve(commande.getFichierJoint());
                        }
                        Files.deleteIfExists(cheminAncienFichier);
                    } catch (IOException e) {
                        log.warn("Impossible de supprimer l'ancien fichier: {}", e.getMessage());
                    }
                }

                String nomFichier = sauvegarderFichierSecurise(commandeDTO.getFichier());
                commande.setFichierJoint(nomFichier);
            }

            // Mise à jour des champs modifiables
            commande.setRaisonSocialeFournisseur(commandeDTO.getRaisonSocialeFournisseur());
            commande.setDirectionGBM(commandeDTO.getDirectionGBM());
            commande.setTypeDocument(commandeDTO.getTypeDocument());
            commande.setDateRelanceBR(commandeDTO.getDateRelanceBR());
            commande.setDateTransmission(commandeDTO.getDateTransmission());
            commande.setRaisonSocialeGBM(commandeDTO.getRaisonSocialeGBM());
            commande.setSouscripteur(commandeDTO.getSouscripteur());
            commande.setTypeRelance(commandeDTO.getTypeRelance());
            commande.setPersonnesCollectrice(commandeDTO.getPersonnesCollectrice());
            commande.setDossierComplet(commandeDTO.isDossierComplet());
            commande.setDateModification(LocalDateTime.now());

            // Mise à jour de l'état de la commande si le dossier est maintenant complet
            if (commandeDTO.isDossierComplet() && !"validé".equals(commande.getEtatCommande())) {
                commande.setEtatCommande("validé");
            }

            // Sauvegarder les modifications
            Commande commandeModifiee = commandeService.mettreAJourCommande(commande);

            return ResponseEntity.ok(Map.of(
                    "message", "Commande mise à jour avec succès",
                    "commande", commandeModifiee
            ));

        } catch (Exception e) {
            log.error("Erreur lors de la modification de la commande: ", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Erreur lors de la modification de la commande: " + e.getMessage()
            ));
        }
    }

    // lire le fichier
    @GetMapping("/fichier/{id}")
    public ResponseEntity<?> getFichierCommande(@PathVariable("id") Integer id,
                                                @RequestHeader("Authorization") String emailUtilisateur) {
        try {
            // Récupérer l'utilisateur et vérifier son autorisation
            Utilisateur utilisateur = utilisateurService.findByEmail(emailUtilisateur);

            // Récupérer la commande
            Optional<Commande> commandeOpt = commandeRepository.findById(id);
            if (!commandeOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Commande non trouvée"));
            }

            Commande commande = commandeOpt.get();

            // Vérifier l'accès de l'utilisateur
            if (commande.getUtilisateur().getIdUtilisateur() != utilisateur.getIdUtilisateur()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Vous n'êtes pas autorisé à accéder à ce fichier"));
            }

            // Vérifier si un fichier existe
            if (commande.getFichierJoint() == null || commande.getFichierJoint().isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Aucun fichier joint à cette commande"));
            }

            // Construire le chemin du fichier en incluant le sous-dossier "commandes"
            Path cheminFichier;
            if (commande.getFichierJoint().startsWith("commandes/")) {
                // Si le chemin inclut déjà le sous-dossier
                cheminFichier = Paths.get(uploadDir).resolve(commande.getFichierJoint()).normalize();
            } else {
                // Sinon on ajoute le sous-dossier
                cheminFichier = Paths.get(uploadDir).resolve("commandes").resolve(commande.getFichierJoint()).normalize();
            }

            // Vérifier si le fichier existe physiquement
            if (!Files.exists(cheminFichier)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Fichier non trouvé sur le serveur"));
            }

            // Déterminer le type de contenu
            String contentType = Files.probeContentType(cheminFichier);
            if (contentType == null) {
                // Déterminer le type en fonction de l'extension
                String nomFichier = commande.getFichierJoint();
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
            if (commande.getFichierJoint().contains(".")) {
                originalExtension = commande.getFichierJoint().substring(commande.getFichierJoint().lastIndexOf("."));
            }
            String securisedFileName = "document_" + id + originalExtension;

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + securisedFileName + "\"")
                    .body(resource);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération du fichier: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la récupération du fichier: " + e.getMessage()));
        }
    }

    // calcul de dashboard
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistiquesCommandes() {
        try {
            // Récupérer le nombre total de commandes avec status = true
            long totalCommandes = commandeRepository.countByStatus(true);

            // Récupérer le nombre de commandes en attente (état = "en cours") avec status = true
            long commandesEnAttente = commandeRepository.countByEtatCommandeAndStatus("en cours", true);

            // Récupérer le nombre de commandes validées mais non clôturées avec status = true
            long commandesValidees = commandeRepository.countByEtatCommandeAndStatus("validé" , true);

            // Récupérer le nombre de commandes clôturées avec status = true
            long commandesCloturees = reglementRepository.countByCommandeStatusAndEtat(true, "validé");

            // Récupérer le nombre de commandes comptabilisées (état = "validé" dans la table comptabilisations) avec status = true
            // Utilisation de la méthode correcte qui existe déjà dans votre repo
            long commandesComptabilisees = comptabilisationRepository.countByCommandeStatusAndEtat(true, "validé");

            Map<String, Object> statistiques = new HashMap<>();
            statistiques.put("totalCommandes", totalCommandes);
            statistiques.put("commandesEnAttente", commandesEnAttente);
            statistiques.put("commandesValidees", commandesValidees);
            statistiques.put("commandesCloturees", commandesCloturees);
            statistiques.put("commandesComptabilisees", commandesComptabilisees);

            return ResponseEntity.ok(statistiques);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des statistiques de commandes", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}