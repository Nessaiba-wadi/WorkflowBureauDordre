package org.example.model;

import java.util.Date;
import javax.persistence.*;
import java.util.List;

@Entity
@Table(name = "tresorerie")
public class Tresorerie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idTresorerie;

    @Column(name = "dossier_id")
    private int dossierID;

    @Temporal(TemporalType.DATE)
    private Date datePreparationReglement;

    private String modeReglement;

    private String numeroCheque;

    @Temporal(TemporalType.DATE)
    private Date dateTransmissionBO;

    @Column(length = 1000)
    private String commentaire;

    @ManyToOne
    @JoinColumn(name = "dossier_id", insertable = false, updatable = false)
    private Dossier dossier;

    public Tresorerie() {}
    //Constructeur

    public Tresorerie(int idTresorerie, int dossierID, Date datePreparationReglement,String modeReglement, String numeroCheque, Date dateTransmissionBO, String commentaire){
        this.idTresorerie=idTresorerie;
        this.dossierID=dossierID;
        this.datePreparationReglement=datePreparationReglement;
        this.modeReglement=modeReglement;
        this.numeroCheque=numeroCheque;
        this.dateTransmissionBO=dateTransmissionBO;
        this.commentaire=commentaire;
    }

    //Getters & Setters

    public int getIdTresorerie(){
        return idTresorerie;
    }
    public void setIdTresorerie(int idTresorerie) {
        this.idTresorerie = idTresorerie;
    }


    public int getDossierID(){
        return  dossierID;
    }
    public void setDossierID(int dossierID){
        this.dossierID=dossierID;
    }


    public Date getDatePreparationReglement() {
        return datePreparationReglement;
    }
    public void setDatePreparationReglement(Date datePreparationReglement) {
        this.datePreparationReglement = datePreparationReglement;
    }


    public String getModeReglement() {
        return modeReglement;
    }
    public void setModeReglement(String modeReglement) {
        this.modeReglement = modeReglement;
    }


    public String getNumeroCheque(){
        return numeroCheque;
    }
    public void setNumeroCheque(String numeroCheque) {
        this.numeroCheque = numeroCheque;
    }


    public Date getDateTransmissionBO(){
        return dateTransmissionBO;
    }
    public void setDateTransmissionBO(Date dateTransmissionBO){
        this.dateTransmissionBO=dateTransmissionBO;
    }


    public String getCommentaire(){
        return  commentaire;
    }
    public void setCommentaire(String commentaire) {
        this.commentaire = commentaire;
    }

    //Methodes
    public void creerEntreeTresorerie() {
        System.out.println("Entrée en trésorerie créée.");
    }
    public void modifierEntreeTresorerie() {
        System.out.println("Entrée en trésorerie modifiée.");
    }
    public void supprimerEntreeTresorerie() {
        System.out.println("Entrée en trésorerie supprimée.");
    }
}
