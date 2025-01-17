package org.example.controller;

import org.example.model.BureauOrdre;
import org.example.service.BureauOrdreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bureau-ordre")
public class BureauOrdreController {

    @Autowired
    private BureauOrdreService bureauOrdreService;

    @PostMapping
    public BureauOrdre creerEntreeBureauOrdre(@RequestBody BureauOrdre bureauOrdre) {
        return bureauOrdreService.creerEntreeBureauOrdre(bureauOrdre);
    }

    @GetMapping("/{id}")
    public BureauOrdre getBureauOrdreById(@PathVariable Integer id) {
        return bureauOrdreService.getBureauOrdreById(id);
    }

    @GetMapping
    public List<BureauOrdre> getAllBureauOrdres() {
        return bureauOrdreService.getAllBureauOrdres();
    }

    @PutMapping
    public BureauOrdre updateBureauOrdre(@RequestBody BureauOrdre bureauOrdre) {
        return bureauOrdreService.updateBureauOrdre(bureauOrdre);
    }

    @DeleteMapping("/{id}")
    public void deleteBureauOrdre(@PathVariable Integer id) {
        bureauOrdreService.deleteBureauOrdre(id);
    }
}