package org.example.repository;

import org.example.model.Comptabilite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Date;

@Repository
public interface ComptabiliteRepository extends JpaRepository<Comptabilite, Integer> {
    List<Comptabilite> findByDossierID(Integer dossierID);
    List<Comptabilite> findByDateComptabilisation(Date dateComptabilisation);
    List<Comptabilite> findByPersonneCollectrice(String personneCollectrice);
}