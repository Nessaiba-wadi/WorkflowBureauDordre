package org.example.controller;

import jakarta.transaction.Transactional;
import org.example.model.Commande;
import org.example.model.Utilisateur;
import org.example.service.CommandeService;
import org.example.service.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;


@CrossOrigin(origins = {"http://127.0.0.1:8080", "http://localhost:8080"})
@RestController
@RequestMapping("/BO/commandes")
public class CommandeController {

    @Autowired
    private CommandeService commandeService;

    @Autowired
    private UtilisateurService utilisateurService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final Pattern STRING_PATTERN = Pattern.compile("^[a-zA-Z\\s]+$");

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> creerCommande(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("commandeData") String commandeJson,
            @RequestParam Integer utilisateurId) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            Commande commande = mapper.readValue(commandeJson, Commande.class);

            String validationError = validateCommande(commande);
            if (validationError != null) {
                return ResponseEntity.badRequest().body(validationError);
            }

            Utilisateur utilisateur = utilisateurService.getUtilisateurById(utilisateurId);

            if (commandeService.existsByNumeroBC(commande.getNumeroBC())) {
                return ResponseEntity.badRequest()
                        .body("Une commande avec le numéro BC'" + commande.getNumeroBC() + "' existe déjà.");
            }

            Commande nouvelleCommande = commandeService.creerCommande(commande, utilisateur);

            if (file != null && !file.isEmpty()) {
                String originalFilename = file.getOriginalFilename();
                String fileExtension = originalFilename.substring(originalFilename.lastIndexOf('.'));
                String newFilename = UUID.randomUUID().toString() + fileExtension;

                Path uploadPath = Paths.get(uploadDir, "BO");
                Files.createDirectories(uploadPath);
                Path filePath = uploadPath.resolve(newFilename);
                Files.write(filePath, file.getBytes());

                nouvelleCommande.setFichierJoint(newFilename);
                commandeService.updateCommande(nouvelleCommande);
            }

            return ResponseEntity.ok("Commande créée avec succès.");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Une erreur est survenue lors de la création de la commande: " + e.getMessage());
        }
    }

    private String validateCommande(Commande commande) {
        if (commande.getNumeroBC() == null || commande.getNumeroBC().trim().isEmpty()) {
            return "Le numéro BC est obligatoire.";
        }

        if (!isValidString(commande.getRaisonSocialeFournisseur())) {
            return "La raison sociale du fournisseur ne peut contenir que des lettres et des espaces.";
        }
        if (!isValidString(commande.getRaisonSocialeGBM())) {
            return "La raison sociale de GBM ne peut contenir que des lettres et des espaces.";
        }
        if (!isValidString(commande.getDirectionGBM())) {
            return "La direction de GBM ne peut contenir que des lettres et des espaces.";
        }
        if (!isValidString(commande.getSouscripteur())) {
            return "Le souscripteur ne peut contenir que des lettres et des espaces.";
        }
        if (!isValidString(commande.getPersonnesCollectrice())) {
            return "Le nom de la personne collectrice ne peut contenir que des lettres et des espaces.";
        }
        if (commande.getTypeDocument() == null || commande.getTypeDocument().trim().isEmpty()) {
            return "Le type de document est obligatoire.";
        }

        if (commande.getDateRelanceBR() == null) {
            return "La date de relance du BR est obligatoire.";
        }
        if (commande.getDateTransmission() == null) {
            return "La date de transmission est obligatoire.";
        }
        LocalDate now = LocalDate.now();
        if (commande.getDateRelanceBR().isBefore(now)) {
            return "La date de relance du BR ne peut pas être antérieure à la date du jour.";
        }
        if (commande.getDateTransmission().isBefore(now)) {
            return "La date de transmission ne peut pas être antérieure à la date du jour.";
        }

        if (commande.getTypeRelance() == null) {
            return "Le type de relance est obligatoire (MAIL ou TÉLÉPHONE).";
        }

        return null;
    }

    private boolean isValidString(String str) {
        return str != null && STRING_PATTERN.matcher(str).matches();
    }

    private boolean isValidFileType(String contentType) {
        return contentType != null && (
                contentType.equals("application/pdf") ||
                        contentType.equals("application/msword") ||
                        contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        );
    }



    //Modifier une commande
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<String> updateCommande(
            @PathVariable int id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("commandeData") String commandeJson,
            @RequestParam Integer utilisateurId) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            Commande updatedCommande = mapper.readValue(commandeJson, Commande.class);

            Utilisateur utilisateur = utilisateurService.getUtilisateurById(utilisateurId);
            if (!commandeService.isBureauOrdre(utilisateur)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Accès refusé: Seuls les utilisateurs du Bureau d'ordre peuvent modifier des commandes.");
            }

            Commande existingCommande = commandeService.getCommandeById(id);

            if (file != null && !file.isEmpty()) {
                String contentType = file.getContentType();
                if (!isValidFileType(contentType)) {
                    return ResponseEntity.badRequest()
                            .body("Type de fichier invalide. Seuls les documents PDF et Word sont acceptés.");
                }
                String originalFilename = file.getOriginalFilename();
                String fileExtension = originalFilename.substring(originalFilename.lastIndexOf('.'));
                String newFilename = UUID.randomUUID().toString() + fileExtension;
                Path uploadPath = Paths.get(uploadDir, "BO");
                Files.createDirectories(uploadPath);
                Path filePath = uploadPath.resolve(newFilename);
                Files.write(filePath, file.getBytes());
                existingCommande.setFichierJoint(newFilename);
            }

            if (updatedCommande.getRaisonSocialeFournisseur() != null) {
                existingCommande.setRaisonSocialeFournisseur(updatedCommande.getRaisonSocialeFournisseur());
            }
            if (updatedCommande.getRaisonSocialeGBM() != null) {
                existingCommande.setRaisonSocialeGBM(updatedCommande.getRaisonSocialeGBM());
            }
            if (updatedCommande.getDateRelanceBR() != null) {
                existingCommande.setDateRelanceBR(updatedCommande.getDateRelanceBR());
            }
            if (updatedCommande.getTypeRelance() != null) {
                try {
                    existingCommande.setTypeRelance(updatedCommande.getTypeRelance());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body("Le type de relance doit être 'Mail' ou 'Téléphone'. Veuillez sélectionner une option valide.");
                }
            }
            if (updatedCommande.getDateTransmission() != null) {
                existingCommande.setDateTransmission(updatedCommande.getDateTransmission());
            }
            if (updatedCommande.getPersonnesCollectrice() != null) {
                existingCommande.setPersonnesCollectrice(updatedCommande.getPersonnesCollectrice());
            }
            if (updatedCommande.getDirectionGBM() != null) {
                existingCommande.setDirectionGBM(updatedCommande.getDirectionGBM());
            }
            if (updatedCommande.getSouscripteur() != null) {
                existingCommande.setSouscripteur(updatedCommande.getSouscripteur());
            }
            if (updatedCommande.getTypeDocument() != null) {
                existingCommande.setTypeDocument(updatedCommande.getTypeDocument());
            }
            if (updatedCommande.getNumeroBC() != null) {
                existingCommande.setNumeroBC(updatedCommande.getNumeroBC());
            }

            existingCommande.setDossierComplet(updatedCommande.isDossierComplet());
            if (updatedCommande.isDossierComplet()) {
                existingCommande.setEtatCommande("validé");
            } else {
                existingCommande.setEtatCommande("en cours");
            }

            String validationError = validateCommande(existingCommande);
            if (validationError != null) {
                return ResponseEntity.badRequest().body(validationError);
            }

            existingCommande.setDateModification(LocalDateTime.now());
            commandeService.updateCommande(existingCommande);

            return ResponseEntity.ok("Commande mise à jour avec succès.");
        } catch (Exception e) {
            String errorMessage = e.getMessage();
            if (errorMessage.contains("TypeRelance")) {
                return ResponseEntity.badRequest()
                        .body("Le type de relance doit être 'Mail' ou 'Téléphone'. Veuillez sélectionner une option valide.");
            }
            return ResponseEntity.status(500)
                    .body("Une erreur est survenue lors de la mise à jour de la commande: " + errorMessage);
        }
    }

}