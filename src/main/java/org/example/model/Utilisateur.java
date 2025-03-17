package org.example.model;

import com.fasterxml.jackson.annotation.*;
import jakarta.persistence.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "utilisateurs")
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "idUtilisateur"
)
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idUtilisateur;

    @Column(name = "nom", nullable = false)
    @NotBlank(message = "Le nom est requis")
    private String nom;

    @Column(name = "prenom", nullable = false)
    @NotBlank(message = "Le prénom est requis")
    private String prenom;

    @Column(name = "email", unique = true, nullable = false)
    @NotBlank(message = "L'e-mail est requis")
    @Email(message = "Le format de l'e-mail est invalide")
    private String email;

    @Column(name = "mot_de_passe", nullable = false)
    @NotBlank(message = "Le mot de passe est requis")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String motDePasse;

    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    @JsonBackReference
    private Role role;

    @Column(name = "statut", nullable = false)
    private boolean statut;


    public Utilisateur() {
    }

    // Constructeur complet
    public Utilisateur(int idUtilisateur, String nom, String prenom, String email, String motDePasse, Role role, boolean statut) {
        this.idUtilisateur = idUtilisateur;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;

        this.motDePasse = motDePasse;
        this.role = role;
        this.statut = statut;
    }

    // Constructeur simplifié
    public Utilisateur(String nom, String prenom, String email, String motDePasse, Role role, boolean statut) {
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.motDePasse = motDePasse;
        this.role = role;
        this.statut = statut;
    }

    // Getters & Setters
    public int getIdUtilisateur() {
        return idUtilisateur;
    }

    public void setIdUtilisateur(int idUtilisateur) {
        this.idUtilisateur = idUtilisateur;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
    public String getMotDePasse() {
        return motDePasse;
    }

    public void setMotDePasse(String motDePasse) {
        System.out.println("Ancien mot de passe: " + this.motDePasse);
        System.out.println("Nouveau mot de passe: " + motDePasse);
        this.motDePasse = motDePasse;
    }
    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isStatut() {
        return statut;
    }

    public void setStatut(boolean statut) {
        this.statut = statut;
    }

    // Méthode pour changer le mot de passe
    public void changerMotDePasse(String nouveauMotDePasse) {
        this.motDePasse = nouveauMotDePasse;
    }

    // Méthode pour obtenir le rôle
    public String obtenirRole() {
        return "Rôle associé à l'utilisateur : " + (role != null ? role.getNom() : "Aucun rôle");
    }
}