package org.example.dto;

import lombok.Data;
import org.example.model.Commande;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Data
public class CommandeDTO {
    private int idCommande;
    private String raisonSocialeFournisseur;
    private String numeroBC;
    private String directionGBM;
    private String typeDocument;
    private LocalDate dateRelanceBR;
    private LocalDate dateTransmission;
    private String raisonSocialeGBM;
    private String souscripteur;
    private Commande.TypeRelance typeRelance;
    private String personnesCollectrice;
    private boolean dossierComplet;
    private MultipartFile fichier;

    // Getters et setters
    public MultipartFile getFichier() {
        return fichier;
    }

    public void setFichier(MultipartFile fichier) {
        this.fichier = fichier;
    }
}