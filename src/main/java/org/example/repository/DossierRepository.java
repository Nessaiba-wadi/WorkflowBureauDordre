package org.example.repository;

import org.example.model.Dossier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DossierRepository extends JpaRepository<Dossier, Integer> {
    List<Dossier> findByFournisseur_IdFournisseur(Integer idFournisseur);
}