package org.example.service;

import org.example.model.Document;
import org.example.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DocumentService {
    @Autowired
    private DocumentRepository documentRepository;

    public Document creerDocument(Document document) {
        return documentRepository.save(document);
    }

    public Document getDocumentById(Integer id) {
        return documentRepository.findById(id).orElse(null);
    }

    public List<Document> getAllDocuments() {
        return documentRepository.findAll();
    }

    public Document updateDocument(Document document) {
        return documentRepository.save(document);
    }

    public void deleteDocument(Integer id) {
        documentRepository.deleteById(id);
    }
}