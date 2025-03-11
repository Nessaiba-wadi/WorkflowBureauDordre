package org.example.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "commandes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Commande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idCommande;

    @Column(name = "date_reception", nullable = false)
    private LocalDate dateReception;

    @Column(name = "raison_sociale_fournisseur", nullable = false)
    private String raisonSocialeFournisseur;

    @Column(name = "raison_sociale_gbm", nullable = false)
    private String raisonSocialeGBM;

    @Column(name = "numero_bc", unique = true, nullable = false)
    private String numeroBC;

    @Column(name = "direction_gbm", nullable = false)
    private String directionGBM;

    @Column(name = "souscripteur", nullable = false)
    private String souscripteur;

    @Column(name = "type_document", nullable = false)
    private String typeDocument;

    @Column(name = "date_relance_br", nullable = false)
    private LocalDate dateRelanceBR;

    @Column(name = "type_relance", nullable = false)
    @Enumerated(EnumType.STRING)
    private TypeRelance typeRelance;

    @Column(name = "date_composition")
    private LocalDate dateComposition;

    @Column(name = "date_transmission", nullable = false)
    private LocalDate dateTransmission;

    @Column(name = "personnes_collectrice")
    private String personnesCollectrice;

    @Column(name = "fichier_joint")
    private String fichierJoint;

    @Column(name = "date_modification", nullable = false)
    private LocalDateTime dateModification;

    @Column(name = "etat_commande", nullable = false)
    private String etatCommande;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Column(name = "dossier_complet", nullable = false)
    private boolean dossierComplet;

    @Column(name = "status", nullable = false)
    private boolean status = true;

    public enum TypeRelance {
        MAIL, TELEPHONE
    }

    @PrePersist
    public void prePersist() {
        this.dateReception = LocalDate.now();
        this.dateModification = LocalDateTime.now();
        this.etatCommande = this.dossierComplet ? "validé" : "en cours";
        this.status = true;
    }
}