package org.example.controller;

import org.example.model.Role;
import org.example.model.Utilisateur;
import org.example.repository.RoleRepository;
import org.example.repository.UtilisateurRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class MainController implements CommandLineRunner {

    private final RoleRepository roleRepository;

    // Injection par constructeur
    public MainController(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) {
        // Vérifier si le rôle existe déjà avant de l'ajouter
        if (roleRepository.findByNom("ROLE_USER") == null) {
            Role role = new Role("ROLE_USER", "Utilisateur 123");
            roleRepository.save(role);
        }

        System.out.println("Application démarrée avec succès !");
    }
}