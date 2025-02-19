package org.example.model;

import jakarta.persistence.*;
import jdk.jfr.Period;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Persistent;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "comptabilisations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Comptabilisation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int idComptabilisation;

    @Column(name = "date_comptabilisation", nullable = false)
    private LocalDate dateComptabilisation;

    @Column(name = "date_transmission", nullable = false)
    private LocalDate dateTransmission;

    @Column(name = "personnes_collectrice", nullable = false)
    private String personnesCollectrice;

    @Column(name = "commentaire", nullable = true) // Commentaire optionnel
    private String commentaire;

    @Column(name = "etat", nullable = false)
    private String etat;

    @Column(name = "fichier_joint")
    private String fichierJoint;

    @Column(name = "date_modification", nullable = false)
    private LocalDateTime dateModification;

    @OneToOne
    @JoinColumn(name = "commande_id", nullable = false, unique = true)
    private Commande commande;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @PrePersist
    public void prePersist() {
        this.dateModification = LocalDateTime.now();
        this.dateComptabilisation = LocalDate.now();
        this.etat = "validé"; // État par défaut
    }
}