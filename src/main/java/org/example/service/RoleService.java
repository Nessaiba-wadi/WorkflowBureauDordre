package org.example.service;

import org.example.model.Role;
import org.example.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class RoleService {
    @Autowired
    private RoleRepository roleRepository;

    public Role creerRole(Role role) {
        return roleRepository.save(role);
    }

    public Role getRoleById(Integer id) {
        return roleRepository.findById(id).orElse(null);
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public Role updateRole(Role role) {
        return roleRepository.save(role);
    }

    public void deleteRole(Integer id) {
        roleRepository.deleteById(id);
    }

    public Role findByNom(String nom) {
        return roleRepository.findByNom(nom);
    }

    // Désactiver un rôle
    public Role desactiverRole(Integer id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé avec l'ID : " + id));
        role.setStatut(false);
        return roleRepository.save(role);
    }

    // Activer un rôle
    public Role activerRole(Integer id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rôle non trouvé avec l'ID : " + id));
        role.setStatut(true);
        return roleRepository.save(role);
    }
}