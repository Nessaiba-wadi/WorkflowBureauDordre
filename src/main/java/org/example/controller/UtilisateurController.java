package org.example.controller;

import org.antlr.v4.runtime.Token;
import org.example.model.Utilisateur;
import org.example.service.UtilisateurService;
import org.example.service.UtilisateurService.UtilisateurNonTrouveException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
@RestController
@RequestMapping("/utilisateurs")
public class UtilisateurController {

    @Autowired
    private UtilisateurService utilisateurService;

    @PostMapping
    public ResponseEntity<?> creerUtilisateur(@RequestBody Utilisateur utilisateur) {
        try {
            Utilisateur nouvelUtilisateur = utilisateurService.creerUtilisateur(utilisateur);
            return new ResponseEntity<>(nouvelUtilisateur, HttpStatus.CREATED);
        } catch (UtilisateurService.ChampsRequisManquantsException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (UtilisateurService.NomPrenomInvalideException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (UtilisateurService.FormatEmailInvalideException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (UtilisateurService.EmailDejaUtiliseException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (UtilisateurService.TelephoneDejaUtiliseException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        } catch (UtilisateurService.MotDePasseTropCourtException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }catch (Exception e) {
            return new ResponseEntity<>("Une erreur interne est survenue", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUtilisateurById(@PathVariable Integer id) {
        try {
            Utilisateur utilisateur = utilisateurService.getUtilisateurById(id);

            // Créer une Map pour renvoyer uniquement les champs souhaités
            Map<String, Object> response = new HashMap<>();
            response.put("nom", utilisateur.getNom());
            response.put("prenom", utilisateur.getPrenom());
            response.put("telephone", utilisateur.getTelephone());
            response.put("email", utilisateur.getEmail());
            response.put("role", utilisateur.getRole().getNom()); // Récupérer le nom du rôle

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (UtilisateurNonTrouveException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        }catch (UtilisateurService.UtilisateurInactifException e){
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
        }
    }

    @PostMapping("/authentifier")
    public ResponseEntity<String> authentifier(@RequestParam String email, @RequestParam String motDePasse) {
        try {
            Utilisateur utilisateur = utilisateurService.authentifier(email, motDePasse);
            return new ResponseEntity<>("Authentification réussie pour l'utilisateur : " + utilisateur.getEmail(), HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.UNAUTHORIZED);
        }
    }

    //Modifier un utilisateur
    @PutMapping("/modifier-utilisateur/{id}")
    public ResponseEntity<?> modifierUtilisateur(@PathVariable Integer id, @RequestBody Utilisateur utilisateur) {
        try {
            Utilisateur utilisateurModifie = utilisateurService.modifierUtilisateur(id, utilisateur);
            return new ResponseEntity<>("Utilisateur modifié avec succès", HttpStatus.OK);
        } catch (UtilisateurNonTrouveException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (UtilisateurService.NomPrenomInvalideException | UtilisateurService.FormatEmailInvalideException |
                 UtilisateurService.EmailDejaUtiliseException | UtilisateurService.TelephoneDejaUtiliseException |
                 UtilisateurService.RoleNonTrouveException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Une erreur est survenue lors de la modification", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    //modifier le mot de passe
    @PutMapping("/modifier-mot-de-passe/{id}")
    public ResponseEntity<?> modifierMotDePasse(
            @PathVariable Integer id,
            @RequestBody Map<String, String> passwordData) {
        try {
            String ancienMotDePasse = passwordData.get("ancienMotDePasse");
            String nouveauMotDePasse = passwordData.get("nouveauMotDePasse");

            if (ancienMotDePasse == null || nouveauMotDePasse == null) {
                return new ResponseEntity<>("Les deux mots de passe sont requis", HttpStatus.BAD_REQUEST);
            }

            utilisateurService.modifierMotDePasse(id, ancienMotDePasse, nouveauMotDePasse);
            return new ResponseEntity<>("Mot de passe modifié avec succès", HttpStatus.OK);
        } catch (UtilisateurService.UtilisateurNonTrouveException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (UtilisateurService.MotDePasseIncorrectException |
                 UtilisateurService.MotDePasseTropCourtException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Une erreur est survenue lors de la modification du mot de passe",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}