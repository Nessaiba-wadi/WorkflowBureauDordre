package org.example.model;

import java.util.Date;
import java.util.List;
import jakarta.persistence.*;

@Entity
@Table(name = "dossier")
public class Dossier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idDossier;

    @ManyToOne
    @JoinColumn(name = "fournisseur_id", nullable = false)
    private Fournisseur fournisseur;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    private String numeroDossier;

    @Temporal(TemporalType.DATE)
    private Date dateCreation;

    private boolean statut;

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL)
    private List<Document> documents;

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL)
    private List<BureauOrdre> bureauOrdres;

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL)
    private List<Comptabilite> comptabilites;

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL)
    private List<Tresorerie> tresoreries;

    public Dossier() {}

    // Constructeur
    public Dossier(int idDossier, Fournisseur fournisseur, Utilisateur utilisateur, String numeroDossier, Date dateCreation, boolean statut) {
        this.idDossier = idDossier;
        this.fournisseur = fournisseur;
        this.utilisateur = utilisateur;
        this.numeroDossier = numeroDossier;
        this.dateCreation = dateCreation;
        this.statut = statut;
    }

    // Getters & Setters
    public int getIdDossier() {
        return idDossier;
    }

    public void setIdDossier(int idDossier) {
        this.idDossier = idDossier;
    }

    public Fournisseur getFournisseur() {
        return fournisseur;
    }

    public void setFournisseur(Fournisseur fournisseur) {
        this.fournisseur = fournisseur;
    }

    public Utilisateur getUtilisateur() {
        return utilisateur;
    }

    public void setUtilisateur(Utilisateur utilisateur) {
        this.utilisateur = utilisateur;
    }

    public String getNumeroDossier() {
        return numeroDossier;
    }

    public void setNumeroDossier(String numeroDossier) {
        this.numeroDossier = numeroDossier;
    }

    public Date getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(Date dateCreation) {
        this.dateCreation = dateCreation;
    }

    public boolean isStatut() {
        return statut;
    }

    public void setStatut(boolean statut) {
        this.statut = statut;
    }

    // Méthodes
    public void creerDossier() {
        System.out.println("Dossier créé");
    }

    public void modifierDossier() {
        System.out.println("Dossier modifié");
    }

    public void supprimerDossier() {
        System.out.println("Dossier supprimé");
    }
}