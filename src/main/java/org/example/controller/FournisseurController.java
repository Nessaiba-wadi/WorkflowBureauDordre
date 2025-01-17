package org.example.controller;

import org.example.model.Fournisseur;
import org.example.service.FournisseurService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fournisseurs")
public class FournisseurController {

    @Autowired
    private FournisseurService fournisseurService;

    @PostMapping
    public Fournisseur creerFournisseur(@RequestBody Fournisseur fournisseur) {
        return fournisseurService.creerFournisseur(fournisseur);
    }

    @GetMapping("/{id}")
    public Fournisseur getFournisseurById(@PathVariable Integer id) {
        return fournisseurService.getFournisseurById(id);
    }

    @GetMapping
    public List<Fournisseur> getAllFournisseurs() {
        return fournisseurService.getAllFournisseurs();
    }

    @PutMapping
    public Fournisseur updateFournisseur(@RequestBody Fournisseur fournisseur) {
        return fournisseurService.updateFournisseur(fournisseur);
    }

    @DeleteMapping("/{id}")
    public void deleteFournisseur(@PathVariable Integer id) {
        fournisseurService.deleteFournisseur(id);
    }
}