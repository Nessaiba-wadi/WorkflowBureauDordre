package org.example.service;

import org.example.model.BureauOrdre;
import org.example.repository.BureauOrdreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BureauOrdreService {
    @Autowired
    private BureauOrdreRepository bureauOrdreRepository;

    public BureauOrdre creerEntreeBureauOrdre(BureauOrdre bureauOrdre) {
        return bureauOrdreRepository.save(bureauOrdre);
    }

    public BureauOrdre getBureauOrdreById(Integer id) {
        return bureauOrdreRepository.findById(id).orElse(null);
    }

    public List<BureauOrdre> getAllBureauOrdres() {
        return bureauOrdreRepository.findAll();
    }

    public BureauOrdre updateBureauOrdre(BureauOrdre bureauOrdre) {
        return bureauOrdreRepository.save(bureauOrdre);
    }

    public void deleteBureauOrdre(Integer id) {
        bureauOrdreRepository.deleteById(id);
    }
}