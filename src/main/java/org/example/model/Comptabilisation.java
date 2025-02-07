package org.example.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "comptabilisations")

@Getter // Génère automatiquement les getters
@Setter // Génère automatiquement les setters
@NoArgsConstructor // Génère un constructeur sans arguments
@AllArgsConstructor // Génère un constructeur avec tous les arguments
public class Comptabilisation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idComptabilisation;

    @Column(name = "date_comptabilisation", nullable = false)
    private String dateComptabilisation;

    @Column(name = "date_transmission", nullable = false)
    private String dateTransmission;

    @Column(name = "personnes_collectrice", nullable = false)
    private String personnesCollectrice;

    @Column(name = "commentaire", nullable = false)
    private String commentaire;

    @Column(name = "etat_en_cours_valide_etc", nullable = false)
    private String etatEnCoursValideEtc;

    @ManyToOne
    @JoinColumn(name = "reglement_id", nullable = false)
    private Reglement reglement;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    // Constructeurs, getters et setters
}