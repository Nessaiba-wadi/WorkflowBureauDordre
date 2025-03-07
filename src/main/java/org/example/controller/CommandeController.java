package org.example.controller;

import org.example.dto.CommandeDTO;
import org.example.model.Commande;
import org.example.model.Utilisateur;
import org.example.service.CommandeService;
import org.example.service.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.example.repository.CommandeRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

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
                nomFichier = sauvegarderFichier(commandeDTO.getFichier());
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

    private String sauvegarderFichier(MultipartFile fichier) throws IOException {
        String repertoireUpload = "uploads/commandes";
        Path cheminRepertoire = Paths.get(repertoireUpload).toAbsolutePath().normalize();

        // Créer le répertoire s'il n'existe pas
        Files.createDirectories(cheminRepertoire);

        // Générer un nom de fichier unique
        String nomFichier = UUID.randomUUID().toString();
        Path cheminCible = cheminRepertoire.resolve(nomFichier);

        // Copier le fichier
        Files.copy(fichier.getInputStream(), cheminCible, StandardCopyOption.REPLACE_EXISTING);

        return nomFichier; // Retourne uniquement le nom du fichier
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
    @PutMapping("/{id}/modifier")
    public ResponseEntity<?> modifierCommande(
            @PathVariable("id") Integer id,
            @ModelAttribute CommandeDTO commandeDTO,
            @RequestHeader("Authorization") String emailUtilisateur) {

        try {
            // Vérifier si l'utilisateur est autorisé
            Utilisateur utilisateurConnecte = utilisateurService.findByEmail(emailUtilisateur);
            if (utilisateurConnecte == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Utilisateur non authentifié"));
            }

            // Récupérer la commande existante
            Optional<Commande> commandeOpt = commandeRepository.findById(id);
            if (!commandeOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Commande non trouvée"));
            }

            Commande commande = commandeOpt.get();

            // Vérifier que la commande n'est pas déjà complète (sauf si on la laisse complète)
            if (commande.isDossierComplet() && !commandeDTO.isDossierComplet()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Une commande avec état 'Complet' ne peut pas être modifiée"));
            }

            // Mise à jour des champs de la commande (sans changer le numéro BC)
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

            // Gestion du fichier
            if (commandeDTO.getFichier() != null && !commandeDTO.getFichier().isEmpty()) {
                String nomFichier = sauvegarderFichier(commandeDTO.getFichier());
                commande.setFichierJoint(nomFichier);
            }

            // Enregistrement de la commande mise à jour
            Commande commandeMiseAJour = commandeService.mettreAJourCommande(commande);

            return ResponseEntity.ok(Map.of(
                    "message", "Commande mise à jour avec succès",
                    "idCommande", commandeMiseAJour.getIdCommande()
            ));

        } catch (Exception e) {
            e.printStackTrace(); // Pour déboguer
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Erreur lors de la modification de la commande : " + e.getMessage()
            ));
        }
    }
}