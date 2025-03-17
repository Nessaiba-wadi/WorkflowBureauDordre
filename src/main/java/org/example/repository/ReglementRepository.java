package org.example.repository;

import org.example.model.Reglement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReglementRepository extends JpaRepository<Reglement, Integer> {
    long countByEtatEnCoursValideEtc(String etat);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Reglement r WHERE r.commande.idCommande = :commandeId")
    boolean existsByCommandeId(@Param("commandeId") int commandeId);

    // Nouvelle méthode pour compter les règlements avec un état spécifique et un status de commande spécifique
    @Query("SELECT COUNT(r) FROM Reglement r WHERE r.commande.status = :commandeStatus AND r.etatEnCoursValideEtc = :etat")
    long countByCommandeStatusAndEtat(boolean commandeStatus, String etat);


    List<Reglement> findByEtatEnCoursValideEtc(String etat);

    //Optional<Reglement> findByCommande_IdCommande(Integer idCommande);

    // Alternative avec une requête JPQL explicite
    @Query("SELECT r FROM Reglement r WHERE r.commande.idCommande = :idCommande")
    Optional<Reglement> findByCommandeId(@Param("idCommande") Integer idCommande);

    Optional<Reglement> findByCommandeIdCommande(Integer commandeId);
}