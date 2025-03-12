package org.example.repository;

import org.example.model.Commande;
import org.example.model.Comptabilisation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComptabilisationRepository extends JpaRepository<Comptabilisation, Integer> {
    boolean existsByCommande(Commande commande);

    long countByEtat(String validé);
}