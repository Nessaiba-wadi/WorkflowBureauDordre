package org.example.model;

import java.util.Date;
import javax.persistence.*;
import java.util.List;

@Entity
@Table(name = "comptabilite")
public class Comptabilite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idComptabilite;

    @Column(name = "dossier_id")
    private int dossierID;

    @Temporal(TemporalType.DATE)
    private Date dateComptabilisation;

    @Temporal(TemporalType.DATE)
    private Date dateTransmission;

    private String personneCollectrice;

    @Column(length = 1000)
    private String commentaire;

    @ManyToOne
    @JoinColumn(name = "dossier_id", insertable = false, updatable = false)
    private Dossier dossier;

    public Comptabilite() {}
    //Constructeur
    public Comptabilite(int idComptabilite, int dossierID, Date dateComptabilisation, Date dateTransmission, String personneCollectrice, String commentaire){
        this.idComptabilite=idComptabilite;
        this.dossierID=dossierID;
        this.dateComptabilisation=dateComptabilisation;
        this.dateTransmission=dateTransmission;
        this.personneCollectrice=personneCollectrice;
        this.commentaire=commentaire;
    }

    //Getters & Setters


    public int getIdComptabilite() {
        return idComptabilite;
    }
    public void setIdComptabilite(int idComptabilite) {
        this.idComptabilite = idComptabilite;
    }


    public int getDossierID() {
        return dossierID;
    }
    public void setDossierID(int dossierID) {
        this.dossierID = dossierID;
    }


    public Date getDateComptabilisation() {
        return dateComptabilisation;
    }
    public void setDateComptabilisation(Date dateComptabilisation) {
        this.dateComptabilisation = dateComptabilisation;
    }


    public Date getDateTransmission() {
        return dateTransmission;
    }
    public void setDateTransmission(Date dateTransmission) {
        this.dateTransmission = dateTransmission;
    }


    public String getPersonneCollectrice() {
        return personneCollectrice;
    }
    public void setPersonneCollectrice(String personneCollectrice) {
        this.personneCollectrice = personneCollectrice;
    }

    public String getCommentaire() {
        return commentaire;
    }
    public void setCommentaire(String commentaire) {
        this.commentaire = commentaire;
    }


    // Méthodes
    public void creerEntreeComptabilite() {
        System.out.println("Entrée en comptabilité créée.");
    }

    public void modifierEntreeComptabilite() {
        System.out.println("Entrée en comptabilité modifiée.");
    }

    public void supprimerEntreeComptabilite() {
        System.out.println("Entrée en comptabilité supprimée.");
    }
}
