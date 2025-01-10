package org.example.model;

import java.util.Date;

public class Dossier {
    private int idDossier;
    private int fournisseurID;
    private int utilisateurID;
    private String numeroDossier;
    private Date dateCreation;
    private boolean statut;

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
