package org.example.repository;

import org.example.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Integer> {
    List<Document> findByDossierID(Integer dossierID);
    List<Document> findByType(String type);
    List<Document> findByNumero(String numero);
    List<Document> findByStatut(boolean statut);
}