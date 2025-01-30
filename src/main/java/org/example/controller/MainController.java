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

    public MainController(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) {
        String[] roles = {"admin", "comptable", "Bureau d'ordre", "Trésorerie"};
        for (String roleName : roles) {
            if (roleRepository.findByNom(roleName) == null) {
                Role role = new Role(roleName, "Description pour " + roleName);
                roleRepository.save(role);
            }
        }

        System.out.println("Application démarrée avec succès !");
    }
}