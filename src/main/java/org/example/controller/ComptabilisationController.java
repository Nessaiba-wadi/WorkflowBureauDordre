package org.example.controller;

import org.example.model.Commande;
import org.example.model.Comptabilisation;
import org.example.model.Utilisateur;
import org.example.repository.ComptabilisationRepository; // Importez le repository
import org.example.service.ComptabilisationService;
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

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/comptabilisations")
public class ComptabilisationController {

    @Autowired
    private ComptabilisationService comptabilisationService;

    @Autowired
    private UtilisateurService utilisateurService;

    @Autowired // Injectez le repository ici
    private ComptabilisationRepository comptabilisationRepository;

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
}