package org.example.model;
import javax.persistence.*;
import java.util.List;


@Entity
@Table(name = "fournisseur")
public class Fournisseur {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idFournisseur;

    private String raisonSociale;

    private String adresse;

    private String telephone;

    private boolean statut;

    @OneToMany(mappedBy = "fournisseur", cascade = CascadeType.ALL)
    private List<Dossier> dossiers;

    public Fournisseur() {}

    //Constructeur
    public Fournisseur(int idFournisseur, String raisonSociale, String adresse, String telephone, boolean statut){
        this.idFournisseur=idFournisseur;
        this.raisonSociale=raisonSociale;
        this.adresse=adresse;
        this.telephone=telephone;
        this.statut=statut;
    }
    //Getters & Setters
    public int getIdFournisseur(){
        return idFournisseur;
    }
    public void setIdFournisseur(int idFournisseur){
        this.idFournisseur=idFournisseur;
    }

    public String getRaisonSociale(){
        return raisonSociale;
    }
    public void setRaisonSociale(String raisonSociale){
        this.raisonSociale=raisonSociale;
    }
    public String getAdresse(){
        return adresse;
    }
    public void setAdresse(String adresse){
        this.adresse=adresse;
    }
    public String getTelephone(){
        return telephone;
    }
    public void setTelephone(String telephone){
        this.telephone=telephone;
    }
    public boolean isStatut(){
        return statut;
    }
    public void setStatut(boolean statut){
        this.statut=statut;
    }

    //methodes
    public void creerFournisseur(){
        System.out.println("Fournisseur crée.");
    }
    public void modifierFournisseur(){
        System.out.println("Fournisseur modifié.");
    }
    public void supprimerFournisseur(){
        System.out.println("Fournisseur supprimé.");
    }
    public void obtenirDossier(){
        System.out.println("Liste des dossieres associés au fournisseur.");
    }

}
