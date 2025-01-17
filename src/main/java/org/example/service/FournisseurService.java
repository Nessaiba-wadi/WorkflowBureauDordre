package org.example.service;

import org.example.model.Fournisseur;
import org.example.repository.FournisseurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FournisseurService {
    @Autowired
    private FournisseurRepository fournisseurRepository;

    public Fournisseur creerFournisseur(Fournisseur fournisseur) {
        return fournisseurRepository.save(fournisseur);
    }

    public Fournisseur getFournisseurById(Integer id) {
        return fournisseurRepository.findById(id).orElse(null);
    }

    public List<Fournisseur> getAllFournisseurs() {
        return fournisseurRepository.findAll();
    }

    public Fournisseur updateFournisseur(Fournisseur fournisseur) {
        return fournisseurRepository.save(fournisseur);
    }

    public void deleteFournisseur(Integer id) {
        fournisseurRepository.deleteById(id);
    }
}