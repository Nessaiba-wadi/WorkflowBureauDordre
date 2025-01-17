package org.example.controller;

import org.example.model.Utilisateur;
import org.example.service.UtilisateurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/utilisateurs")
public class UtilisateurController {

    @Autowired
    private UtilisateurService utilisateurService;

    @PostMapping
    public Utilisateur creerUtilisateur(@RequestBody Utilisateur utilisateur) {
        return utilisateurService.creerUtilisateur(utilisateur);
    }

    @GetMapping("/{id}")
    public Utilisateur getUtilisateurById(@PathVariable Integer id) {
        return utilisateurService.getUtilisateurById(id);
    }

    @PostMapping("/authentifier")
    public Utilisateur authentifier(@RequestParam String email, @RequestParam String motDePasse) {
        return utilisateurService.authentifier(email, motDePasse);
    }
}