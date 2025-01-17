package org.example.controller;

import org.example.model.Dossier;
import org.example.service.DossierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dossiers")
public class DossierController {

    @Autowired
    private DossierService dossierService;

    @PostMapping
    public Dossier creerDossier(@RequestBody Dossier dossier) {
        return dossierService.creerDossier(dossier);
    }

    @GetMapping("/{id}")
    public Dossier getDossierById(@PathVariable Integer id) {
        return dossierService.getDossierById(id);
    }

    @GetMapping
    public List<Dossier> getAllDossiers() {
        return dossierService.getAllDossiers();
    }

    @PutMapping
    public Dossier updateDossier(@RequestBody Dossier dossier) {
        return dossierService.updateDossier(dossier);
    }
    @DeleteMapping("/{id}")
    public void deleteDossier(@PathVariable Integer id) {
        dossierService.deleteDossier(id);
    }
}