package org.example.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "reglements")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Reglement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idReglement;

    @Column(name = "date_preparation", nullable = false)
    private String datePreparation;

    @Column(name = "mode_reglement", nullable = false)
    private String modeReglement;

    @Column(name = "numero_cheque", nullable = false)
    private String numeroCheque;

    @Column(name = "date_transmission", nullable = false)
    private String dateTransmission;

    @Column(name = "commentaire", nullable = false)
    private String commentaire;

    @Column(name = "etat_en_cours_valide_etc", nullable = false)
    private String etatEnCoursValideEtc;

    @ManyToOne
    @JoinColumn(name = "commande_id", nullable = false)
    private Commande commande;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

}