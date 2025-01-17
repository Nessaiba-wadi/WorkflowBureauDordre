package org.example.controller;

import org.example.model.Comptabilite;
import org.example.service.ComptabiliteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/comptabilite")
public class ComptabiliteController {

    @Autowired
    private ComptabiliteService comptabiliteService;

    @PostMapping
    public Comptabilite creerEntreeComptabilite(@RequestBody Comptabilite comptabilite) {
        return comptabiliteService.creerEntreeComptabilite(comptabilite);
    }

    @GetMapping("/{id}")
    public Comptabilite getComptabiliteById(@PathVariable Integer id) {
        return comptabiliteService.getComptabiliteById(id);
    }

    @GetMapping
    public List<Comptabilite> getAllComptabilites() {
        return comptabiliteService.getAllComptabilites();
    }

    @PutMapping
    public Comptabilite updateComptabilite(@RequestBody Comptabilite comptabilite) {
        return comptabiliteService.updateComptabilite(comptabilite);
    }

    @DeleteMapping("/{id}")
    public void deleteComptabilite(@PathVariable Integer id) {
        comptabiliteService.deleteComptabilite(id);
    }
}