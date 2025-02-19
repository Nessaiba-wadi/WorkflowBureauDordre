// ComptabilisationService.java
package org.example.service;

import org.example.model.Commande;
import org.example.model.Comptabilisation;
import org.example.model.Utilisateur;
import org.example.repository.ComptabilisationRepository;
import org.example.repository.CommandeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class ComptabilisationService {

    @Autowired
    private ComptabilisationRepository comptabilisationRepository;

    @Autowired
    private CommandeRepository commandeRepository;

    private static final String ROLE_COMPTABLE = "comptable";

    public boolean isComptable(Utilisateur utilisateur) {
        return utilisateur != null &&
                utilisateur.getRole() != null &&
                ROLE_COMPTABLE.equals(utilisateur.getRole().getNom());
    }

    public String validateComptabilisation(Comptabilisation comptabilisation) {
        StringBuilder errors = new StringBuilder();

        // Validation de la date de transmission
        if (comptabilisation.getDateTransmission() == null) {
            errors.append("La date de transmission est un champ obligatoire.\n");
        }

        // Validation des personnes collectrices
        if (comptabilisation.getPersonnesCollectrice() == null ||
                comptabilisation.getPersonnesCollectrice().trim().isEmpty()) {
            errors.append("Le champ 'Personnes collectrices' est obligatoire.\n");
        } else if (!comptabilisation.getPersonnesCollectrice().matches("[a-zA-Z\\s]+")) {
            errors.append("Le champ 'Personnes collectrices' ne doit contenir que des lettres.\n");
        }

        // Validation de la commande
        if (comptabilisation.getCommande() == null || comptabilisation.getCommande().getIdCommande() == 0) {
            errors.append("Veuillez sélectionner une commande valide.");
            return errors.toString();
        }

        // Charger et vérifier la commande
        Commande commande = commandeRepository.findById(comptabilisation.getCommande().getIdCommande())
                .orElse(null);

        if (commande == null) {
            errors.append("La commande sélectionnée n'existe pas dans le système.");
        } else {
            if (!"validé".equals(commande.getEtatCommande())) {
                errors.append("La commande sélectionnée doit être dans l'état 'validé' pour pouvoir être comptabilisée.");
            }

            if (comptabilisationRepository.existsByCommande(commande)) {
                errors.append("Cette commande a déjà été comptabilisée. Une seule comptabilisation par commande est autorisée.");
            }

            // Mettre à jour la commande complète si pas d'erreur
            if (errors.length() == 0) {
                comptabilisation.setCommande(commande);
            }

        }
        return errors.length() > 0 ? errors.toString() : null;
    }
    public Comptabilisation creerComptabilisation(Comptabilisation comptabilisation) {
            return comptabilisationRepository.save(comptabilisation);

    }


}