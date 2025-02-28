package org.example.controller;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.Resource;
import org.example.model.Commande;
import org.example.model.Utilisateur;
import org.example.service.CommandeService;
import org.example.service.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
@CrossOrigin(origins = {"http://127.0.0.1:8080", "http://localhost:8080"})
@RestController
@RequestMapping("/BO/commandes")
public class CommandeController {
    @Autowired
    private CommandeService commandeService;
    @Autowired
    private UtilisateurService utilisateurService;
    @Autowired
    private ObjectMapper objectMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;
    @PostMapping
    public ResponseEntity<?> createCommande(
            @RequestParam("commande") String commandeJson,
            @RequestParam("utilisateurId") int utilisateurId,
            @RequestParam(value = "fichier", required = false) MultipartFile fichier) {
        try {
            // Convertir le JSON en objet Commande
            Commande commande = objectMapper.readValue(commandeJson, Commande.class);

            // Récupérer l'utilisateur
            Utilisateur utilisateur = utilisateurService.getUtilisateurById(utilisateurId);
            if (utilisateur == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Utilisateur non trouvé"));
            }
            // Créer la commande
            Commande nouveleCommande = commandeService.createCommande(commande, utilisateur, fichier);
            return ResponseEntity.ok(nouveleCommande);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
    @GetMapping("/utilisateur/{id}")
    public ResponseEntity<?> getCommandesByUtilisateur(@PathVariable int id) {
        try {
            Utilisateur utilisateur = utilisateurService.getUtilisateurById(id);
            if (utilisateur == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Utilisateur non trouvé"));
            }
            List<Commande> commandes = commandeService.getCommandesByUtilisateur(utilisateur);
            return ResponseEntity.ok(commandes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }


}