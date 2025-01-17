package org.example.service;

import org.example.model.Tresorerie;
import org.example.repository.TresorerieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TresorerieService {
    @Autowired
    private TresorerieRepository tresorerieRepository;

    public Tresorerie creerEntreeTresorerie(Tresorerie tresorerie) {
        return tresorerieRepository.save(tresorerie);
    }

    public Tresorerie getTresorerieById(Integer id) {
        return tresorerieRepository.findById(id).orElse(null);
    }

    public List<Tresorerie> getAllTresoreries() {
        return tresorerieRepository.findAll();
    }

    public Tresorerie updateTresorerie(Tresorerie tresorerie) {
        return tresorerieRepository.save(tresorerie);
    }

    public void deleteTresorerie(Integer id) {
        tresorerieRepository.deleteById(id);
    }
}