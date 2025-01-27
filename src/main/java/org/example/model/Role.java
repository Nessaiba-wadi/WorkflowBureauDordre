package org.example.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idRole;

    @Column(nullable = false)
    private String nom;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    private boolean statut = true; // Par défaut, le rôle est actif

    @OneToMany(mappedBy = "role", fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<Utilisateur> utilisateurs;

    // Constructeur sans arguments requis par JPA
    public Role() {
    }

    // Constructeur avec nom et description
    public Role(String nom, String description) {
        this.nom = nom;
        this.description = description;
    }

    // Constructeur avec tous les champs sauf ID et utilisateurs
    public Role(String nom, String description, boolean statut) {
        this.nom = nom;
        this.description = description;
        this.statut = statut;
    }

    // Getters & Setters
    public int getIdRole() {
        return idRole;
    }

    public void setIdRole(int idRole) {
        this.idRole = idRole;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isStatut() {
        return statut;
    }

    public void setStatut(boolean statut) {
        this.statut = statut;
    }

    public List<Utilisateur> getUtilisateurs() {
        return utilisateurs;
    }

    public void setUtilisateurs(List<Utilisateur> utilisateurs) {
        this.utilisateurs = utilisateurs;
    }
}