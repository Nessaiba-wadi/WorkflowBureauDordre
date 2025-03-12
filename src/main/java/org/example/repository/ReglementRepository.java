package org.example.repository;

import org.example.model.Reglement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReglementRepository extends JpaRepository<Reglement, Integer> {
    long countByEtatEnCoursValideEtc(String etat);
}