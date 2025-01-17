package org.example.service;

import org.example.model.Comptabilite;
import org.example.repository.ComptabiliteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ComptabiliteService {
    @Autowired
    private ComptabiliteRepository comptabiliteRepository;

    public Comptabilite creerEntreeComptabilite(Comptabilite comptabilite) {
        return comptabiliteRepository.save(comptabilite);
    }

    public Comptabilite getComptabiliteById(Integer id) {
        return comptabiliteRepository.findById(id).orElse(null);
    }

    public List<Comptabilite> getAllComptabilites() {
        return comptabiliteRepository.findAll();
    }

    public Comptabilite updateComptabilite(Comptabilite comptabilite) {
        return comptabiliteRepository.save(comptabilite);
    }

    public void deleteComptabilite(Integer id) {
        comptabiliteRepository.deleteById(id);
    }
}