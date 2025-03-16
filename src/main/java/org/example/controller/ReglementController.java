package org.example.controller;

import org.example.dto.ReglementDTO;
import org.example.model.Commande;
import org.example.model.Reglement;
import org.example.model.Utilisateur;
import org.example.service.*;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;
import org.example.dto.ReglementDTO;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;


@CrossOrigin(origins = {"http://127.0.0.1:8080", "http://localhost:8080"})
@RestController
@RequestMapping("/api/reglements")
public class ReglementController {

    @Autowired
    private ReglementService reglementService;

    @Autowired
    private UtilisateurService utilisateurService;

    @Autowired
    private CommandeService commandeService;
    @Value("${file.upload-dir:uploads}/tresorerie")
    private String uploadDir;

    private static final Logger log = LoggerFactory.getLogger(ReglementController.class);
    private static final String[] EXTENSIONS_AUTORISEES = {".pdf", ".doc", ".docx"};
    private static final String[] MIME_TYPES_AUTORISES = {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };
    @GetMapping
    public ResponseEntity<List<Reglement>> getAllReglements() {
        List<Reglement> reglements = reglementService.getAllReglements();
        return new ResponseEntity<>(reglements, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reglement> getReglementById(@PathVariable int id) {
        Optional<Reglement> reglement = reglementService.getReglementById(id);
        return reglement.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }



    private boolean isExtensionAutorisee(String nomFichier) {
        if (nomFichier == null || nomFichier.isEmpty()) {
            return false;
        }
        String extension = "";
        int lastIndexOfDot = nomFichier.lastIndexOf(".");
        if (lastIndexOfDot > 0) {
            extension = nomFichier.substring(lastIndexOfDot).toLowerCase();
        }
        for (String ext : EXTENSIONS_AUTORISEES) {
            if (ext.equals(extension)) {
                return true;
            }
        }
        return false;
    }

    private boolean isContentTypeAutorise(String contentType) {
        if (contentType == null || contentType.isEmpty()) {
            return false;
        }
        for (String type : MIME_TYPES_AUTORISES) {
            if (type.equals(contentType)) {
                return true;
            }
        }
        return false;
    }

    /**
     * la création d'un reglement
     */

    @PostMapping("/nouveau")
    public ResponseEntity<?> creerReglement(
            @ModelAttribute ReglementDTO reglementDTO,
            @RequestHeader("Authorization") String emailUtilisateur) {

        try {

            // Vérifier si un règlement existe déjà pour cette commande
            if (reglementService.existsByCommandeId(reglementDTO.getCommandeId())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Un règlement existe déjà pour cette commande."
                ));
            }
            // Récupérer l'utilisateur connecté
            Utilisateur utilisateurConnecte = utilisateurService.findByEmail(emailUtilisateur);

            // Récupérer la commande à partir de son ID
            Optional<Commande> commandeOpt = commandeService.findById(reglementDTO.getCommandeId());
            if (commandeOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "La commande spécifiée n'existe pas."
                ));
            }
            Commande commande = commandeOpt.get();

            // Gestion du fichier
            String nomFichier = null;
            if (reglementDTO.getFichier() != null && !reglementDTO.getFichier().isEmpty()) {
                // Vérifier l'extension du fichier
                if (!isExtensionAutorisee(reglementDTO.getFichier().getOriginalFilename()) ||
                        !isContentTypeAutorise(reglementDTO.getFichier().getContentType())) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "message", "Type de fichier non autorisé. Seuls les fichiers PDF et Word sont acceptés."
                    ));
                }
                nomFichier = sauvegarderFichierSecurise(reglementDTO.getFichier());
            }

            // Conversion du DTO en entité Reglement
            Reglement reglement = new Reglement();
            // Remplir les propriétés du règlement depuis le DTO
            reglement.setDatePreparation(reglementDTO.getDatePreparation());
            reglement.setModeReglement(reglementDTO.getModeReglement());
            reglement.setNumeroCheque(reglementDTO.getNumeroCheque());
            reglement.setDateTransmission(reglementDTO.getDateTransmission());
            reglement.setCommentaire(reglementDTO.getCommentaire());
            reglement.setEtatEnCoursValideEtc(reglementDTO.getEtatEnCoursValideEtc());
            reglement.setFichierJoint(nomFichier);
            reglement.setCommande(commande);
            reglement.setUtilisateur(utilisateurConnecte);

            // Enregistrement du règlement
            Reglement reglementEnregistre = reglementService.saveReglement(reglement);

            // Préparation de la réponse
            Map<String, Object> reponse = new HashMap<>();
            reponse.put("message", "Règlement créé avec succès");
            reponse.put("idReglement", reglementEnregistre.getIdReglement());

            return ResponseEntity.ok(reponse);

        } catch (Exception e) {
            Map<String, String> erreur = new HashMap<>();
            erreur.put("message", "Erreur lors de la création du règlement : " + e.getMessage());
            return ResponseEntity.badRequest().body(erreur);
        }
    }

    private String sauvegarderFichierSecurise(MultipartFile fichier) throws IOException {
        // Extraire l'extension originale
        String originalFilename = fichier.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Créer un nom de fichier unique avec l'extension originale
        String nomFichierUnique = UUID.randomUUID().toString() + extension;

        // Définir le chemin complet
        Path cheminRepertoire = Paths.get(uploadDir).toAbsolutePath().normalize();

        // Créer le répertoire s'il n'existe pas
        Files.createDirectories(cheminRepertoire);

        // Chemin complet du fichier
        Path cheminCible = cheminRepertoire.resolve(nomFichierUnique);

        // Copier le fichier
        Files.copy(fichier.getInputStream(), cheminCible, StandardCopyOption.REPLACE_EXISTING);

        return nomFichierUnique;
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




    @GetMapping("/details/{id}")
    public ResponseEntity<?> afficherDetailReglement(@PathVariable int id) {
        try {
            Optional<Reglement> reglementOpt = reglementService.getReglementById(id);

            if (reglementOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Règlement non trouvé avec l'ID: " + id));
            }

            Reglement reglement = reglementOpt.get();

            // Création d'un DTO pour l'affichage
            Map<String, Object> reglementDetails = new HashMap<>();
            reglementDetails.put("idReglement", reglement.getIdReglement());
            reglementDetails.put("datePreparation", reglement.getDatePreparation());
            reglementDetails.put("modeReglement", reglement.getModeReglement());
            reglementDetails.put("numeroCheque", reglement.getNumeroCheque());
            reglementDetails.put("dateTransmission", reglement.getDateTransmission());
            reglementDetails.put("commentaire", reglement.getCommentaire());
            reglementDetails.put("etatEnCoursValideEtc", reglement.getEtatEnCoursValideEtc());
            reglementDetails.put("fichierJoint", reglement.getFichierJoint());

            // Informations sur la commande associée
            if (reglement.getCommande() != null) {
                Map<String, Object> commandeInfo = new HashMap<>();
                commandeInfo.put("idCommande", reglement.getCommande().getIdCommande());
                // Ajoutez d'autres détails pertinents de la commande
                reglementDetails.put("commande", commandeInfo);
            }

            // Informations sur l'utilisateur associé
            if (reglement.getUtilisateur() != null) {
                Map<String, Object> utilisateurInfo = new HashMap<>();
                utilisateurInfo.put("id", reglement.getUtilisateur().getIdUtilisateur());
                utilisateurInfo.put("email", reglement.getUtilisateur().getEmail());
                // Ajoutez d'autres détails pertinents de l'utilisateur
                reglementDetails.put("utilisateur", utilisateurInfo);
            }

            return ResponseEntity.ok(reglementDetails);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération des détails du règlement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la récupération des détails du règlement: " + e.getMessage()));
        }
    }

    // Méthode pour télécharger le fichier joint du règlement
    @GetMapping("/fichier/{id}")
    public ResponseEntity<?> telechargerFichierReglement(@PathVariable int id) {
        try {
            Optional<Reglement> reglementOpt = reglementService.getReglementById(id);

            if (reglementOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Règlement non trouvé avec l'ID: " + id));
            }

            Reglement reglement = reglementOpt.get();
            String nomFichier = reglement.getFichierJoint();

            if (nomFichier == null || nomFichier.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Aucun fichier joint n'est associé à ce règlement"));
            }

            // Construire le chemin du fichier
            Path cheminFichier = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(nomFichier);

            // Vérifier si le fichier existe
            if (!Files.exists(cheminFichier)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Le fichier demandé n'a pas été trouvé"));
            }

            // Déterminer le type de contenu
            String contentType = determinerContentType(nomFichier);

            // Préparer la réponse avec le fichier
            Resource resource = new UrlResource(cheminFichier.toUri());

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nomFichier + "\"")
                    .body(resource);

        } catch (Exception e) {
            log.error("Erreur lors du téléchargement du fichier de règlement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors du téléchargement du fichier: " + e.getMessage()));
        }
    }

    private String determinerContentType(String nomFichier) {
        if (nomFichier.toLowerCase().endsWith(".pdf")) {
            return "application/pdf";
        } else if (nomFichier.toLowerCase().endsWith(".doc")) {
            return "application/msword";
        } else if (nomFichier.toLowerCase().endsWith(".docx")) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else {
            return "application/octet-stream"; // Type par défaut
        }
    }

    /**
     * calcul dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Nombre de commandes transmises à la trésorerie pour traitement
        long recues = reglementService.getAllReglements().size();
        stats.put("recues", recues);

        // Nombre de commandes en cours de traitement (non clôturées)
        long enCours = reglementService.countReglementsByEtat("en cours");
        stats.put("enCours", enCours);

        // Nombre de commandes traitées et finalisées
        long cloturees = reglementService.countReglementsByEtat("validé");
        stats.put("cloturees", cloturees);

        // 4ème calcul: Moyenne des temps de traitement (en jours) entre réception et validation
        double tempsTraitementMoyen = reglementService.calculerTempsTraitementMoyen();
        stats.put("tempsTraitementMoyen", tempsTraitementMoyen);

        return new ResponseEntity<>(stats, HttpStatus.OK);
    }

    @GetMapping("/dashboard/temps-traitement")
    public ResponseEntity<Double> getTempsTraitementMoyen() {
        double tempsTraitementMoyen = reglementService.calculerTempsTraitementMoyen();
        return new ResponseEntity<>(tempsTraitementMoyen, HttpStatus.OK);
    }
}