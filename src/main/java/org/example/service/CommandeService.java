package org.example.service;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import jakarta.transaction.Transactional;
import org.example.model.Commande;
import org.example.model.Comptabilisation;
import org.example.model.Reglement;
import org.example.repository.CommandeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
public class CommandeService {
    @Autowired
    private CommandeRepository commandeRepository;
    @Autowired
    private final ReglementService reglementService;
    @PersistenceContext
    private EntityManager entityManager;
    @Autowired
    public CommandeService(CommandeRepository commandeRepository, ReglementService reglementService) {
        this.commandeRepository = commandeRepository;
        this.reglementService = reglementService;
    }

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

    public Optional<Commande> findById(int commandeId) {
        return commandeRepository.findById(commandeId);
    }

    public List<Commande> findCommandesValideesPourReglement() {
        String jpql = "SELECT c FROM Commande c " +
                "INNER JOIN Comptabilisation cp ON cp.commande = c " +
                "WHERE cp.etat = 'validé' " +
                "AND c.etatCommande = 'validé' " +
                "AND c.status = true " +
                "AND NOT EXISTS (SELECT r FROM Reglement r WHERE r.commande = c)";

        return entityManager.createQuery(jpql, Commande.class).getResultList();
    }


}