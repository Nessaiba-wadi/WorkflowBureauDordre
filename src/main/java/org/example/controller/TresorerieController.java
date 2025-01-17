package org.example.controller;

import org.example.model.Tresorerie;
import org.example.service.TresorerieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tresorerie")
public class TresorerieController {

    @Autowired
    private TresorerieService tresorerieService;

    @PostMapping
    public Tresorerie creerEntreeTresorerie(@RequestBody Tresorerie tresorerie) {
        return tresorerieService.creerEntreeTresorerie(tresorerie);
    }

    @GetMapping("/{id}")
    public Tresorerie getTresorerieById(@PathVariable Integer id) {
        return tresorerieService.getTresorerieById(id);
    }

    @GetMapping
    public List<Tresorerie> getAllTresoreries() {
        return tresorerieService.getAllTresoreries();
    }

    @PutMapping
    public Tresorerie updateTresorerie(@RequestBody Tresorerie tresorerie) {
        return tresorerieService.updateTresorerie(tresorerie);
    }

    @DeleteMapping("/{id}")
    public void deleteTresorerie(@PathVariable Integer id) {
        tresorerieService.deleteTresorerie(id);
    }
}