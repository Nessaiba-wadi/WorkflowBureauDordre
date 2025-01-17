package org.example.model;

import java.util.Date;
import jakarta.persistence.*;

@Entity
@Table(name = "document")
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idDocument;

    @Column(name = "dossier_id")
    private int dossierID;

    private String type;

    private String numero;

    @Temporal(TemporalType.DATE)
    private Date dateCreation;

    private boolean statut;

    @ManyToOne
    @JoinColumn(name = "dossier_id", insertable = false, updatable = false)
    private Dossier dossier;

    public Document() {}

    // Constructeur
    public Document(int idDocument, int dossierID, String type, String numero, Date dateCreation, boolean statut) {
        this.idDocument = idDocument;
        this.dossierID = dossierID;
        this.type = type;
        this.numero = numero;
        this.dateCreation = dateCreation;
        this.statut = statut;
    }

    // Getters & Setters
    public int getIdDocument() {
        return idDocument;
    }

    public void setIdDocument(int idDocument) {
        this.idDocument = idDocument;
    }

    public int getDossierID() {
        return dossierID;
    }

    public void setDossierID(int dossierID) {
        this.dossierID = dossierID;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
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
    public void creerDocument() {
        System.out.println("Document créé.");
    }

    public void modifierDocument() {
        System.out.println("Document modifié.");
    }

    public void supprimerDocument() {
        System.out.println("Document supprimé.");
    }
}