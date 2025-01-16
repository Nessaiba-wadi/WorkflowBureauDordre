package org.example.model;

import javax.persistence.*;

@Entity // Indique que cette classe est une entité (table)
@Table(name = "utilisateurs") // Nom de la table
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-incrémentée
    private int idUtilisateur;

    @Column(name = "nom", nullable = false)
    private String nom;

    @Column(name = "prenom", nullable = false)
    private String prenom;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    @ManyToOne
    @JoinColumn(name = "role_id") // Foreign key for the role
    private Role role;

    @Column(name = "statut", nullable = false)
    private boolean statut;

    public Utilisateur() {
    }

    // Constructeur avec tous les attributs
    public Utilisateur(int idUtilisateur, String nom, String prenom, String email, String motDePasse, int roleId, boolean statut) {
        this.idUtilisateur = idUtilisateur;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.motDePasse = motDePasse;
        this.role = new Role(roleId); // Assuming a constructor in Role to set id
        this.statut = statut;
    }

    public Utilisateur(String nom, String prenom, String email, String motDePasse, int role, boolean statut) {

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

    // methodes
    public void creerUtilisateur() {
        System.out.println("créer un nouvel utilisateur");
    }

    public void modifierUtilisateur() {
        System.out.println("Modifier les informations de l'utilisateur");
    }

    public void supprimerUtilisateur() {
        System.out.println("Supprimer l'utilisateur");
    }

    public boolean authentifier(String email, String motDePasse) {
        return this.email.equals(email) && this.motDePasse.equals(motDePasse);
    }

    public void changerMotDePasse(String nouveauMotDePasse) {
        this.motDePasse = nouveauMotDePasse;
        System.out.println("Mot de passe modifié avec succès.");
    }

    public String obtenirRole() {
        // Assuming a getter method for name in Role class
        return "Rôle associé à l'utilisateur : " + (role != null ? role.getNom() : "");
    }
}