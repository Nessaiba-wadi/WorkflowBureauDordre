package org.example.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.dto.CommandeDTO;
import org.example.dto.ReglementDTO;
import org.example.model.Commande;
import org.example.model.Comptabilisation;
import org.example.model.Reglement;
import org.example.model.Utilisateur;
import org.example.repository.ComptabilisationRepository;
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
    private ComptabilisationRepository comptabilisationRepository;
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
            @RequestParam("commandeId") Integer commandeId,
            @RequestParam("datePreparation") String datePreparation,
            @RequestParam("modeReglement") String modeReglement,
            @RequestParam("numeroCheque") String numeroCheque,
            @RequestParam("dateTransmission") String dateTransmission,
            @RequestParam("commentaire") String commentaire,
            @RequestParam("etatEnCoursValideEtc") String etatEnCoursValideEtc,
            @RequestParam(value = "fichier", required = false) MultipartFile fichier,
            @RequestHeader("Authorization") String emailUtilisateur) {

        try {
            // Validation des paramètres obligatoires
            if (commandeId == null || datePreparation == null || modeReglement == null || dateTransmission == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Paramètres obligatoires manquants"));
            }

            // Créer manuellement l'objet DTO
            ReglementDTO reglementDTO = new ReglementDTO();
            reglementDTO.setCommandeId(commandeId);
            reglementDTO.setDatePreparation(datePreparation);
            reglementDTO.setModeReglement(modeReglement);
            reglementDTO.setNumeroCheque(numeroCheque);
            reglementDTO.setDateTransmission(dateTransmission);
            reglementDTO.setCommentaire(commentaire);
            reglementDTO.setEtatEnCoursValideEtc(etatEnCoursValideEtc);

            // Vérifier si un règlement existe déjà pour cette commande
            if (reglementService.existsByCommandeId(reglementDTO.getCommandeId())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Un règlement existe déjà pour cette commande."));
            }

            // Récupérer l'utilisateur connecté
            Utilisateur utilisateurConnecte = utilisateurService.findByEmail(emailUtilisateur);
            if (utilisateurConnecte == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Utilisateur non authentifié"));
            }

            // Récupérer la commande à partir de son ID
            Optional<Commande> commandeOpt = commandeService.findById(reglementDTO.getCommandeId());
            if (commandeOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "La commande spécifiée n'existe pas."));
            }
            Commande commande = commandeOpt.get();

            // Gestion du fichier
            String nomFichier = null;
            if (fichier != null && !fichier.isEmpty()) {
                if (!isExtensionAutorisee(fichier.getOriginalFilename()) || !isContentTypeAutorise(fichier.getContentType())) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Type de fichier non autorisé. Seuls les fichiers PDF et Word sont acceptés."));
                }
                nomFichier = sauvegarderFichierSecurise(fichier);
            }

            // Conversion du DTO en entité Reglement
            Reglement reglement = new Reglement();
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
            log.error("Erreur lors de la création du règlement", e);
            return ResponseEntity.badRequest().body(Map.of("message", "Erreur lors de la création du règlement : " + e.getMessage()));
        }
    }
    @GetMapping("/commandes-a-regler")
    public ResponseEntity<?> getCommandesARegler(@RequestHeader("Authorization") String emailUtilisateur) {
        try {
            // Vérifier l'authentification
            Utilisateur utilisateur = utilisateurService.findByEmail(emailUtilisateur);
            if (utilisateur == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "message", "Utilisateur non authentifié"
                ));
            }

            // Récupérer les commandes validées mais non réglées
            List<Commande> commandes = commandeService.findCommandesValideesPourReglement();

            return ResponseEntity.ok(commandes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "message", "Erreur lors de la récupération des commandes : " + e.getMessage()
            ));
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

    /**
     * afficher les commandes comptabilisé
     */
    @GetMapping("/commandes-comptabilisees")
    public ResponseEntity<?> getCommandesComptabilisees() {
        log.info("Récupération des commandes comptabilisées avec état validé");

        try {
            // Récupérer les comptabilisations avec état "validé"
            List<Comptabilisation> comptabilisations = comptabilisationRepository.findByEtat("validé");

            // Transformer les comptabilisations en réponses avec les informations du fichier
            List<Map<String, Object>> result = comptabilisations.stream()
                    .filter(comp -> comp.getCommande() != null && comp.getCommande().isStatus())
                    .map(comp -> {
                        Commande commande = comp.getCommande();
                        CommandeDTO commandeDTO = convertToCommandeDTO(comp);

                        // Créer un map pour la réponse
                        Map<String, Object> response = new HashMap<>();
                        // Ajouter tous les champs du DTO
                        response.put("idCommande", commandeDTO.getIdCommande());
                        response.put("raisonSocialeFournisseur", commandeDTO.getRaisonSocialeFournisseur());
                        response.put("numeroBC", commandeDTO.getNumeroBC());
                        response.put("directionGBM", commandeDTO.getDirectionGBM());
                        response.put("typeDocument", commandeDTO.getTypeDocument());
                        response.put("dateRelanceBR", commandeDTO.getDateRelanceBR());
                        response.put("dateTransmission", commandeDTO.getDateTransmission());
                        response.put("raisonSocialeGBM", commandeDTO.getRaisonSocialeGBM());
                        response.put("souscripteur", commandeDTO.getSouscripteur());
                        response.put("typeRelance", commandeDTO.getTypeRelance());
                        response.put("personnesCollectrice", commandeDTO.getPersonnesCollectrice());
                        response.put("dossierComplet", commandeDTO.isDossierComplet());
                        response.put("status", commandeDTO.isStatus());

                        // Ajouter le nom du fichier joint
                        response.put("fichierJoint", commande.getFichierJoint());

                        return response;
                    })
                    .collect(Collectors.toList());

            if (result.isEmpty()) {
                log.info("Aucune commande comptabilisée trouvée avec l'état validé");
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }

            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des commandes comptabilisées: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private CommandeDTO convertToCommandeDTO(Comptabilisation comptabilisation) {
        Commande commande = comptabilisation.getCommande();
        CommandeDTO commandeDTO = new CommandeDTO();

        commandeDTO.setIdCommande(commande.getIdCommande());
        commandeDTO.setRaisonSocialeFournisseur(commande.getRaisonSocialeFournisseur());
        commandeDTO.setNumeroBC(commande.getNumeroBC());
        commandeDTO.setDirectionGBM(commande.getDirectionGBM());
        commandeDTO.setTypeDocument(commande.getTypeDocument());
        commandeDTO.setDateRelanceBR(commande.getDateRelanceBR());
        commandeDTO.setDateTransmission(commande.getDateTransmission());
        commandeDTO.setRaisonSocialeGBM(commande.getRaisonSocialeGBM());
        commandeDTO.setSouscripteur(commande.getSouscripteur());
        commandeDTO.setTypeRelance(commande.getTypeRelance());
        commandeDTO.setPersonnesCollectrice(commande.getPersonnesCollectrice());
        commandeDTO.setDossierComplet(commande.isDossierComplet());
        commandeDTO.setStatus(commande.isStatus());

        // Ajout du fichier joint (sous forme de chaîne de caractères)
        // Vous ne pouvez pas directement convertir un String en MultipartFile
        // Vous devez donc stocker cette valeur d'une autre manière
        String fichierJoint = commande.getFichierJoint();
        // Créer un attribut dans la réponse JSON pour stocker le nom du fichier
        // ou simplement l'URL du fichier

        return commandeDTO;
    }

    /**
     * Récupère le statut des règlements pour une liste d'IDs de commandes
     * @param commandeIds Liste des IDs de commandes
     * @return Map associant l'ID de la commande à son statut de règlement
     */
    @PostMapping("/statuses")
    public ResponseEntity<Map<Integer, String>> getReglementsStatuses(@RequestBody List<Integer> commandeIds) {
        log.info("Récupération des statuts de règlement pour {} commandes", commandeIds.size());

        try {
            Map<Integer, String> statuses = new HashMap<>();

            // Récupérer tous les règlements pour les commandes demandées
            for (Integer commandeId : commandeIds) {
                // Vous devez implémenter cette méthode dans votre service
                Optional<Reglement> reglement = reglementService.findByCommandeId(commandeId);

                if (reglement.isPresent()) {
                    // Si un règlement existe, stocker son état
                    statuses.put(commandeId, reglement.get().getEtatEnCoursValideEtc());
                } else {
                    // Si pas de règlement, indiquer "non-regle"
                    statuses.put(commandeId, "non-regle");
                }
            }

            return new ResponseEntity<>(statuses, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des statuts de règlement: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Récupère l'ID du règlement associé à une commande
     * ajouter la cerification que l'etat de reglement est validé (pas encore fait)
     */
    @GetMapping("/commande/{commandeId}")
    public ResponseEntity<?> getReglementIdByCommandeId(@PathVariable int commandeId) {
        try {
            Optional<Reglement> reglementOpt = reglementService.findByCommandeId(commandeId);

            if (reglementOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Aucun règlement trouvé pour cette commande"));
            }

            Reglement reglement = reglementOpt.get();

            // Vérifier si l'état du règlement est "validé"
            if (!"validé".equalsIgnoreCase(reglement.getEtatEnCoursValideEtc())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Aucun règlement validé trouvé pour cette commande"));
            }

            return ResponseEntity.ok(reglement.getIdReglement());
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'ID du règlement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la récupération de l'ID du règlement: " + e.getMessage()));
        }
    }
}