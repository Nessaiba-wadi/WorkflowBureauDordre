package org.example.repository;

import org.example.model.BureauOrdre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Date;

@Repository
public interface BureauOrdreRepository extends JpaRepository<BureauOrdre, Integer> {
    List<BureauOrdre> findByDossierID(Integer dossierID);
    List<BureauOrdre> findByDateReception(Date dateReception);
    List<BureauOrdre> findBySouscripteur(String souscripteur);
    List<BureauOrdre> findByDirectionBGMConcernee(String direction);
}