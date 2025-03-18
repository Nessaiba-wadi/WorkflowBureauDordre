package org.example.repository;

import org.example.model.Commande;
import org.example.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommandeRepository extends JpaRepository<Commande, Integer> {
    List<Commande> findByUtilisateur(Utilisateur utilisateur);
    boolean existsByNumeroBC(String numeroBC);
    List<Commande> findByStatusTrue();

    // calcul de dashboard
    long countByEtatCommande(String etatCommande);
    // Nouvelle méthode pour compter les commandes avec un status spécifique
    long countByStatus(boolean status);

    // Méthode pour compter les commandes qui n'ont pas encore été comptabilisées

    @Query("SELECT COUNT(c) FROM Commande c WHERE c.status = :status AND c.etatCommande = :etat AND NOT EXISTS (SELECT comp FROM Comptabilisation comp WHERE comp.commande = c)")
    long countNonComptabilisees(boolean status, String etat);
    long countByStatusAndEtatCommande(boolean status, String etatCommande);

    List<Commande> findByStatusAndEtatCommande(boolean status, String etatCommande);

    long countByEtatCommandeAndStatus(String etatCommande, boolean status);
}