package org.example.service;

import org.example.model.Utilisateur;
import org.example.repository.UtilisateurRepository;
import org.example.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UtilisateurService {
    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private RoleRepository roleRepository;

    public Utilisateur creerUtilisateur(Utilisateur utilisateur) {
        return utilisateurRepository.save(utilisateur);
    }

    public Utilisateur getUtilisateurById(Integer id) {
        return utilisateurRepository.findById(id).orElse(null);
    }

    public Utilisateur authentifier(String email, String motDePasse) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email);
        if (utilisateur != null && utilisateur.authentifier(email, motDePasse)) {
            return utilisateur;
        }
        return null;
    }
}
