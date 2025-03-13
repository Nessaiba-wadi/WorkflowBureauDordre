package org.example.repository;

import org.example.model.Commande;
import org.example.model.Comptabilisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComptabilisationRepository extends JpaRepository<Comptabilisation, Integer> {

    boolean existsByCommande(Commande commande);
    long countByEtat(String etat);
    // Méthode standard
    List<Comptabilisation> findByEtat(String etat);

    // Méthode alternative insensible à la casse
    @Query("SELECT c FROM Comptabilisation c WHERE LOWER(c.etat) = LOWER(:etat)")
    List<Comptabilisation> findByEtatIgnoreCase(String etat);
}