package org.example.controller;

import jakarta.transaction.Transactional;
import org.example.model.Commande;
import org.example.model.Utilisateur;
import org.example.service.CommandeService;
import org.example.service.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.UUID;
import java.util.regex.Pattern;

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

            if (file != null && !file.isEmpty()) {
                String contentType = file.getContentType();
                if (!isValidFileType(contentType)) {
                    return ResponseEntity.badRequest().body("Invalid file type. Only PDF and Word documents are allowed.");
                }
            }

            Utilisateur utilisateur = utilisateurService.getUtilisateurById(utilisateurId);

            if (commandeService.existsByNumeroBC(commande.getNumeroBC())) {
                return ResponseEntity.badRequest()
                        .body("A command with the BC number '" + commande.getNumeroBC() + "' already exists.");
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

            return ResponseEntity.ok("Command created successfully.");

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("An error occurred while creating the command: " + e.getMessage());
        }
    }

    private String validateCommande(Commande commande) {
        if (commande.getNumeroBC() == null || commande.getNumeroBC().trim().isEmpty()) {
            return "The BC number is required.";
        }

        if (!isValidString(commande.getRaisonSocialeFournisseur())) {
            return "The supplier's legal name must contain only letters and spaces.";
        }
        if (!isValidString(commande.getRaisonSocialeGBM())) {
            return "GBM's legal name must contain only letters and spaces.";
        }
        if (!isValidString(commande.getDirectionGBM())) {
            return "GBM's direction must contain only letters and spaces.";
        }
        if (!isValidString(commande.getSouscripteur())) {
            return "The subscriber must contain only letters and spaces.";
        }
        if (!isValidString(commande.getPersonnesCollectrice())) {
            return "The collector's name must contain only letters and spaces.";
        }
        if (commande.getTypeDocument() == null || commande.getTypeDocument().trim().isEmpty()) {
            return "The document type is required.";
        }

        if (commande.getDateRelanceBR() == null) {
            return "The BR reminder date is required.";
        }
        if (commande.getDateTransmission() == null) {
            return "The transmission date is required.";
        }
        LocalDate now = LocalDate.now();
        if (commande.getDateRelanceBR().isBefore(now)) {
            return "The BR reminder date cannot be earlier than today.";
        }
        if (commande.getDateTransmission().isBefore(now)) {
            return "The transmission date cannot be earlier than today.";
        }

        if (commande.getTypeRelance() == null) {
            return "The reminder type is required (MAIL or TELEPHONE).";
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
}