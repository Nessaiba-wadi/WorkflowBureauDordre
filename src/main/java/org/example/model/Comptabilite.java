package org.example.model;

import java.util.Date;

public class Comptabilite {
    private int idComptabilité;
    private int dossierID;
    private Date dateComptabilisation;
    private Date dateTransmission;
    private String personneCollectrice;
    private String commentaire;

    //Constructeur
    public Comptabilite(int idComptabilité, int dossierID, Date dateComptabilisation, Date dateTransmission, String personneCollectrice, String commentaire){
        this.idComptabilité=idComptabilité;
        this.dossierID=dossierID;
        this.dateComptabilisation=dateComptabilisation;
        this.dateTransmission=dateTransmission;
        this.personneCollectrice=personneCollectrice;
        this.commentaire=commentaire;
    }

    //Getters & Setters


    public int getIdComptabilité() {
        return idComptabilité;
    }
    public void setIdComptabilité(int idComptabilité) {
        this.idComptabilité = idComptabilité;
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
