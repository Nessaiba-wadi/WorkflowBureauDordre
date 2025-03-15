package org.example.controller;
import jakarta.persistence.EntityManager;
import org.example.repository.CommandeRepository;
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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/comptabilisations")
public class ComptabilisationController {

    @Autowired
    private ComptabilisationService comptabilisationService;

    @Autowired
    private UtilisateurService utilisateurService;

    @Autowired // Injectez le repository ici
    private ComptabilisationRepository comptabilisationRepository;


    @Autowired
    private EntityManager entityManager;
    @Autowired
    private CommandeRepository commandeRepository;

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
}