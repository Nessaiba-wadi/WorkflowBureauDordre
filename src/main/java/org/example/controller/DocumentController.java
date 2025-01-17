package org.example.controller;

import org.example.model.Document;
import org.example.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @PostMapping
    public Document creerDocument(@RequestBody Document document) {
        return documentService.creerDocument(document);
    }

    @GetMapping("/{id}")
    public Document getDocumentById(@PathVariable Integer id) {
        return documentService.getDocumentById(id);
    }

    @GetMapping
    public List<Document> getAllDocuments() {
        return documentService.getAllDocuments();
    }

    @PutMapping
    public Document updateDocument(@RequestBody Document document) {
        return documentService.updateDocument(document);
    }

    @DeleteMapping("/{id}")
    public void deleteDocument(@PathVariable Integer id) {
        documentService.deleteDocument(id);
    }
}