package org.example.service;

import jakarta.transaction.Transactional;
import org.example.model.Commande;
import org.example.model.Utilisateur;
import org.example.repository.CommandeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CommandeService {

    @Autowired
    private CommandeRepository commandeRepository;

    private static final String ROLE_BUREAU_ORDRE = "Bureau d'ordre";

    @Transactional
    public Commande creerCommande(Commande commande, Utilisateur utilisateur) {
        if (!isBureauOrdre(utilisateur)) {
            throw new IllegalStateException("Accès refusé: Seuls les utilisateurs du Bureau d'ordre peuvent créer des commandes");
        }

        commande.setUtilisateur(utilisateur);
        return commandeRepository.save(commande);
    }

    public boolean isBureauOrdre(Utilisateur utilisateur) {
        return utilisateur != null &&
                utilisateur.getRole() != null &&
                ROLE_BUREAU_ORDRE.equals(utilisateur.getRole().getNom());
    }

    public List<Commande> getCommandesByUtilisateur(Utilisateur utilisateur) {
        return commandeRepository.findByUtilisateur(utilisateur);
    }

    public boolean existsByNumeroBC(String numeroBC) {
        return commandeRepository.existsByNumeroBC(numeroBC);
    }

    public Commande updateCommande(Commande commande) {
        return commandeRepository.save(commande);
    }

    public Commande getCommandeById(int id) {
        return commandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commande non trouvée avec l'ID : " + id));
    }
}