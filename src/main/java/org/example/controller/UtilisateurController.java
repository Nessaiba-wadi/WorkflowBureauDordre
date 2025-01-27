package org.example.controller;

import org.example.model.Utilisateur;
import org.example.service.UtilisateurService;
import org.example.service.UtilisateurService.UtilisateurNonTrouveException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        } catch (UtilisateurService.MotDePasseTropCourtException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (UtilisateurService.RoleNonTrouveException | UtilisateurService.RoleInactifException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>("Une erreur interne est survenue", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Utilisateur> getUtilisateurById(@PathVariable Integer id) {
        try {
            Utilisateur utilisateur = utilisateurService.getUtilisateurById(id);
            return new ResponseEntity<>(utilisateur, HttpStatus.OK);
        } catch (UtilisateurNonTrouveException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
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
}