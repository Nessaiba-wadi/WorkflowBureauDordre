package org.example.dto;

import lombok.Data;
import org.example.model.Reglement;
import org.springframework.web.multipart.MultipartFile;
import org.example.model.Commande;

import java.time.LocalDate;

@Data
public class ReglementDTO {
    private int idReglement;
    private String datePreparation;
    private String modeReglement;
    private String numeroCheque;
    private String dateTransmission;
    private String commentaire;
    private String etatEnCoursValideEtc;
    private int commandeId;
    private MultipartFile fichier;

    public MultipartFile getFichier() {
        return fichier;
    }
    private Integer idCommande; // Utilisez l'ID de la commande au lieu de l'objet complet

    public void setFichier(MultipartFile fichier) {
        this.fichier = fichier;
    }
}