package org.example.repository;

import org.example.model.Tresorerie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TresorerieRepository extends JpaRepository<Tresorerie, Integer> {
    List<Tresorerie> findByDossierID(Integer dossierId);
}