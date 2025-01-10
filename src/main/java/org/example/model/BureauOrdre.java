package org.example.model;

import java.awt.*;
import java.util.Date;

public class BureauOrdre {
    private int idBureauOrdre;
    private int dossierID;
    private Date dateReception;
    private String raisonSocialeGBM;
    private String directionBGMConcernee;
    private String souscripteur;
    private Date dateRelanceBR;
    private String typeRelance;
    private Date dateCompositionDossierComplet;
    private Date dateTransmissionDCF;
    private String personneCollectrice;
    private boolean statut;


    //Constructeur
    public BureauOrdre(int idBureauOrdre, int dossierID,Date dateReception,String raisonSocialeGBM,String directionBGMConcernee,String souscripteur,Date dateRelanceBR,String typeRelance,Date dateCompositionDossierComplet, Date dateTransmissionDCF, String personneCollectrice, boolean statut){
        this.idBureauOrdre=idBureauOrdre;
        this.dossierID=dossierID;
        this.dateReception=dateReception;
        this.raisonSocialeGBM=raisonSocialeGBM;
        this.directionBGMConcernee=directionBGMConcernee;
        this.souscripteur=souscripteur;
        this.dateRelanceBR=dateRelanceBR;
        this.typeRelance=typeRelance;
        this.dateCompositionDossierComplet=dateCompositionDossierComplet;
        this.dateTransmissionDCF=dateTransmissionDCF;
        this.personneCollectrice=personneCollectrice;
        this.statut=statut;

    }
    //Getters & Setter
    public int getIdBureauOrdre(){
        return idBureauOrdre;
    }
    public void setIdBureauOrdre(int idBureauOrdre){
        this.idBureauOrdre=idBureauOrdre;
    }


    public int getDossierID(){
        return dossierID;
    }
    public void setDossierID(int dossierID) {
        this.dossierID = dossierID;
    }


    public Date getDateReception(){
        return dateReception;
    }
    public void setDateReception(){
        this.dateReception=dateReception;
    }


    public String getRaisonSocialeGBM(){
        return raisonSocialeGBM;
    }
    public void setRaisonSocialeGBM(){
        this.raisonSocialeGBM=raisonSocialeGBM;
    }


    public String getDirectionBGMConcernee(){
        return directionBGMConcernee;
    }
    public void setDirectionBGMConcernee(String directionBGMConcernee) {
        this.directionBGMConcernee = directionBGMConcernee;
    }


    public String getSouscripteur(){
        return  souscripteur;
    }
    public void setSouscripteur(String souscripteur) {
        this.souscripteur = souscripteur;
    }


    public Date getDateRelanceBR() {
        return dateRelanceBR;
    }
    public void setDateRelanceBR(Date dateRelanceBR) {
        this.dateRelanceBR = dateRelanceBR;
    }


    public String getTypeRelance(){
        return typeRelance;
    }
    public void setTypeRelance(String typeRelance) {
        this.typeRelance = typeRelance;
    }


    public Date getDateCompositionDossierComplet(){
        return dateCompositionDossierComplet;
    }
    public void setDateCompositionDossierComplet(Date dateCompositionDossierComplet) {
        this.dateCompositionDossierComplet = dateCompositionDossierComplet;
    }


    public Date getDateTransmissionDCF() {
        return dateTransmissionDCF;
    }
    public void setDateTransmissionDCF(Date dateTransmissionDCF) {
        this.dateTransmissionDCF = dateTransmissionDCF;
    }


    public String getPersonneCollectrice(){
        return personneCollectrice;
    }
    public void setPersonneCollectrice(String personneCollectrice) {
        this.personneCollectrice = personneCollectrice;
    }


    public boolean isStatut() {
        return statut;
    }
    public void setStatut(boolean statut) {
        this.statut = statut;
    }

    //methodes
    public void creerEntreeBureauOrdre(){
        System.out.println("entree bureau ordre crée .");
    }
    public void modifierEntreeBoureauOrdre(){
        System.out.println("Entree bureau ordre modifié .");
    }
    public void supprimerEntreeBureauOrdre(){
        System.out.println("Entree bureau ordre supprimé ! ");
    }

}
