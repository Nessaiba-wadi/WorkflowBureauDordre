package org.example.controller;

import org.example.model.Role;
import org.example.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/roles")
public class RoleController {

    @Autowired
    private RoleService roleService;


    @PostMapping
    public Role creerRole(@RequestBody Role role) {
        return roleService.creerRole(role);
    }

    @GetMapping("/{id}")
    public Role getRoleById(@PathVariable Integer id) {
        return roleService.getRoleById(id);
    }

    @GetMapping
    public List<Role> getAllRoles() {
        return roleService.getAllRoles();
    }

    @PutMapping
    public Role updateRole(@RequestBody Role role) {
        return roleService.updateRole(role);
    }


    @GetMapping("/nom/{nom}")
    public Role findByNom(@PathVariable String nom) {
        return roleService.findByNom(nom);
    }

}