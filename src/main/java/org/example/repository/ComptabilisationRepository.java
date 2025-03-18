package org.example.repository;

import org.example.model.Commande;
import org.example.model.Comptabilisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.core.io.Resource;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComptabilisationRepository extends JpaRepository<Comptabilisation, Integer> {

    boolean existsByCommande(Commande commande);
    long countByEtat(String etat);
    // Méthode standard
    List<Comptabilisation> findByEtat(String etat);

    // Méthode alternative insensible à la casse
    @Query("SELECT c FROM Comptabilisation c WHERE LOWER(c.etat) = LOWER(:etat)")
    List<Comptabilisation> findByEtatIgnoreCase(String etat);

    Optional<Comptabilisation> findByCommande(Commande commande);

    Optional<Comptabilisation> findByCommandeIdCommande(Integer commandeId);
    // Nouvelle méthode pour compter les comptabilisations avec un état spécifique et un status de commande spécifique
    @Query("SELECT COUNT(c) FROM Comptabilisation c WHERE c.commande.status = :commandeStatus AND c.etat = :etat")
    long countByCommandeStatusAndEtat(boolean commandeStatus, String etat);


    // Vous pouvez également ajouter cette méthode plus spécifique si nécessaire
    @Query("SELECT c FROM Comptabilisation c WHERE c.etat = :etat AND c.commande.status = :status")
    List<Comptabilisation> findByEtatAndCommandeStatus(@Param("etat") String etat, @Param("status") boolean status);

}