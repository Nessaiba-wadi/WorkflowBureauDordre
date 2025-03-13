package org.example.repository;

import org.example.model.Reglement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReglementRepository extends JpaRepository<Reglement, Integer> {
    long countByEtatEnCoursValideEtc(String etat);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Reglement r WHERE r.commande.idCommande = :commandeId")
    boolean existsByCommandeId(@Param("commandeId") int commandeId);
}