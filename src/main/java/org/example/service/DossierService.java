package org.example.service;

import org.example.model.Dossier;
import org.example.repository.DossierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DossierService {
    @Autowired
    private DossierRepository dossierRepository;

    public Dossier creerDossier(Dossier dossier) {
        return dossierRepository.save(dossier);
    }

    public Dossier getDossierById(Integer id) {
        return dossierRepository.findById(id).orElse(null);
    }

    public List<Dossier> getAllDossiers() {
        return dossierRepository.findAll();
    }

    public Dossier updateDossier(Dossier dossier) {
        return dossierRepository.save(dossier);
    }

    public void deleteDossier(Integer id) {
        dossierRepository.deleteById(id);
    }
}