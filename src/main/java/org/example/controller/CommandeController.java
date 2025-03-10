package org.example.controller;

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
import org.example.repository.CommandeRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@CrossOrigin(origins = {"http://127.0.0.1:8080", "http://localhost:8080"})
@RestController
@RequestMapping("/BO/commandes")
public class CommandeController {

    @Autowired
    private CommandeService commandeService;

    @Autowired
    private UtilisateurService utilisateurService;

    @Autowired
    private CommandeRepository commandeRepository;

    @Value("${file.upload-dir:uploads/commandes}")
    private String uploadDir;

    private static final Logger log = LoggerFactory.getLogger(CommandeController.class);
    private static final String[] EXTENSIONS_AUTORISEES = {".pdf", ".doc", ".docx"};

    @PostMapping("/nouvelle")
    public ResponseEntity<?> creerCommande(
            @ModelAttribute CommandeDTO commandeDTO,
            @RequestHeader("Authorization") String emailUtilisateur) {

        try {
            // Récupérer l'utilisateur connecté à partir de l'email dans le header
            Utilisateur utilisateurConnecte = utilisateurService.findByEmail(emailUtilisateur);

            // Gestion du fichier
            String nomFichier = null;
            if (commandeDTO.getFichier() != null && !commandeDTO.getFichier().isEmpty()) {
                // Vérifier l'extension du fichier
                if (!isExtensionAutorisee(commandeDTO.getFichier().getOriginalFilename())) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "message", "Type de fichier non autorisé. Seuls les fichiers PDF et Word sont acceptés."
                    ));
                }
                nomFichier = sauvegarderFichierSecurise(commandeDTO.getFichier());
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

            // Enregistrement de la commande
            Commande commandeEnregistree = commandeService.creerCommande(commande);

            // Préparation de la réponse
            Map<String, Object> reponse = new HashMap<>();
            reponse.put("message", "Commande créée avec succès");
            reponse.put("idCommande", commandeEnregistree.getIdCommande());

            return ResponseEntity.ok(reponse);

        } catch (Exception e) {
            Map<String, String> erreur = new HashMap<>();
            erreur.put("message", "Erreur lors de la création de la commande : " + e.getMessage());
            return ResponseEntity.badRequest().body(erreur);
        }
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

    private String sauvegarderFichierSecurise(MultipartFile fichier) throws IOException {
        // Extraire l'extension originale
        String originalFilename = fichier.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Créer un nom de fichier crypté unique avec l'extension originale
        String nomBaseFichier = UUID.randomUUID().toString();
        String nomFichierCrypte = encrypterNomFichier(nomBaseFichier) + extension;

        // Définir le chemin complet
        String repertoireUpload = uploadDir;
        Path cheminRepertoire = Paths.get(repertoireUpload).toAbsolutePath().normalize();

        // Créer le répertoire s'il n'existe pas
        Files.createDirectories(cheminRepertoire);

        // Chemin complet du fichier
        Path cheminCible = cheminRepertoire.resolve(nomFichierCrypte);

        // Copier le fichier
        Files.copy(fichier.getInputStream(), cheminCible, StandardCopyOption.REPLACE_EXISTING);

        return nomFichierCrypte;
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

    @GetMapping
    public ResponseEntity<List<Commande>> getCommandesUtilisateur(
            @RequestHeader("Authorization") String emailUtilisateur) {

        Utilisateur utilisateur = utilisateurService.findByEmail(emailUtilisateur);
        List<Commande> commandes = commandeRepository.findByUtilisateur(utilisateur);

        return ResponseEntity.ok(commandes);
    }

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

            // Vérifier que la commande appartient à l'utilisateur connecté
            if (commande.getUtilisateur().getIdUtilisateur() != utilisateur.getIdUtilisateur()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Vous n'êtes pas autorisé à accéder à cette commande"));
            }

            return ResponseEntity.ok(commande);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur: " + e.getMessage()));
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

            // Vérifier que l'utilisateur est autorisé à modifier cette commande
            if (commande.getUtilisateur().getIdUtilisateur() != utilisateurConnecte.getIdUtilisateur()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Vous n'êtes pas autorisé à modifier cette commande"));
            }

            // Vérifier si la commande est déjà validée
            if ("validé".equals(commande.getEtatCommande()) && !commandeDTO.isDossierComplet()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Cette commande est déjà validée et ne peut pas être modifiée"));
            }

            // Traitement du fichier s'il est fourni
            if (commandeDTO.getFichier() != null && !commandeDTO.getFichier().isEmpty()) {
                // Vérifier l'extension du fichier
                if (!isExtensionAutorisee(commandeDTO.getFichier().getOriginalFilename())) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "message", "Type de fichier non autorisé. Seuls les fichiers PDF et Word sont acceptés."
                    ));
                }
                // Supprimer l'ancien fichier si existant
                if (commande.getFichierJoint() != null && !commande.getFichierJoint().isEmpty()) {
                    try {
                        Path cheminAncienFichier = Paths.get(uploadDir).resolve(commande.getFichierJoint());
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

            // Construire le chemin du fichier
            Path cheminFichier = Paths.get(uploadDir).resolve(commande.getFichierJoint()).normalize();

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
}