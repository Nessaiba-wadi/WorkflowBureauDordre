package org.example.service;
import jakarta.transaction.Transactional;
import org.example.model.Commande;
import org.example.model.Utilisateur;
import org.example.repository.CommandeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
@Service
public class CommandeService {
    @Autowired
    private CommandeRepository commandeRepository;

    @Transactional
    public Commande creerCommande(Commande commande) {
        // Vérifier si le numéro BC est unique
        if (commandeRepository.existsByNumeroBC(commande.getNumeroBC())) {
            throw new RuntimeException("Un bon de commande avec ce numéro existe déjà");
        }

        // Enregistrer la commande
        return commandeRepository.save(commande);
    }

    //modification de la commande
    @Transactional
    public Commande mettreAJourCommande(Commande commande) {
        // Vérifier si la commande existe
        if (!commandeRepository.existsById(commande.getIdCommande())) {
            throw new RuntimeException("La commande n'existe pas");
        }

        return commandeRepository.save(commande);
    }

}