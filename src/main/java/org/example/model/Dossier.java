package org.example.model;

import java.util.Date;
import javax.persistence.*;
import java.util.List;

@Entity
@Table(name = "dossier")
public class Dossier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idDossier;

    @Column(name = "fournisseur_id")
    private int fournisseurID;

    @Column(name = "utilisateur_id")
    private int utilisateurID;

    private String numeroDossier;

    @Temporal(TemporalType.DATE)
    private Date dateCreation;

    private boolean statut;

    @ManyToOne
    @JoinColumn(name = "fournisseur_id", insertable = false, updatable = false)
    private Fournisseur fournisseur;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id", insertable = false, updatable = false)
    private Utilisateur utilisateur;

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL)
    private List<Document> documents;

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL)
    private List<BureauOrdre> bureauOrdres;

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL)
    private List<Comptabilite> comptabilites;

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL)
    private List<Tresorerie> tresoreries;

    public Dossier() {}
    //Constructeur
    public Dossier (int idDossier, int fournisseurID, int utilisateurID, String numeroDossier, Date dateCreation, boolean statut){
        this.idDossier=idDossier;
        this.fournisseurID=fournisseurID;
        this.utilisateurID=utilisateurID;
        this.numeroDossier=numeroDossier;
        this.dateCreation=dateCreation;
        this.statut=statut;
    }

    //Getters & Setters
    public int getIdDossier(){
        return idDossier;
    }
    public void setIdDossier(int idDossier){
        this.idDossier=idDossier;
    }
    public int getFournisseurID(){
        return fournisseurID;
    }

    public void setFournisseurID(int fournisseurID) {
        this.fournisseurID = fournisseurID;
    }
    public int getUtilisateurID(){
        return utilisateurID;
    }
    public void setUtilisateurID(int utilisateurID){
        this.utilisateurID=utilisateurID;
    }

    public String getNumeroDossier(){
        return numeroDossier;
    }
    public void setNumeroDossier(String numeroDossier){
        this.numeroDossier=numeroDossier;
    }
    public Date getDateCreation(){
        return dateCreation;
    }
    public void setDateCreation(Date dateCreation){
        this.dateCreation=dateCreation;
    }
    public boolean isStatut(){
        return statut;
    }
    public void setStatut(boolean statut){
        this.statut=statut;
    }

    //methodes
    public void creerDossier(){
        System.out.println("Dossier crée");
    }
    public void modifierDossier(){
        System.out.println("Dossier modifié");
    }

    public void supprimerDossier(){
        System.out.println("Dossier supprimé");
    }
}
