package org.example.controller;

import org.example.model.Role;
import org.example.model.Utilisateur;
import org.example.repository.RoleRepository;
import org.example.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class MainController implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Override
    public void run(String... args) throws Exception {
        Role role = new Role("ROLE_USER", "Utilisateur standard");
        roleRepository.save(role);

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("wadinessaiba@gmail.com");
        utilisateur.setMotDePasse("Nessaiba123");
        utilisateur.setNom("WADI");
        utilisateur.setPrenom("Nessaiba");
        utilisateur.setStatut(true);
        utilisateur.setRole(role);
        utilisateurRepository.save(utilisateur);

        System.out.println("Application démarrée avec succès !");
    }
}