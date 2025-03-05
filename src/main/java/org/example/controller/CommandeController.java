package org.example.controller;

import org.example.dto.CommandeDTO;
import org.example.model.Commande;
import org.example.model.Utilisateur;
import org.example.service.CommandeService;
import org.example.service.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = {"http://127.0.0.1:8080", "http://localhost:8080"})
@RestController
@RequestMapping("/BO/commandes")
public class CommandeController {

    @Autowired
    private CommandeService commandeService;

    @Autowired
    private UtilisateurService utilisateurService;

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
}