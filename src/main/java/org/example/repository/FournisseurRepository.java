package org.example.repository;

import org.example.model.Fournisseur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FournisseurRepository extends JpaRepository<Fournisseur, Integer> {
    Fournisseur findByRaisonSociale(String raisonSociale);
    List<Fournisseur> findByStatut(boolean statut);
    List<Fournisseur> findByAdresse(String adresse);
}