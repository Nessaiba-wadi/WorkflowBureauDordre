package org.example.service;

import org.example.dto.ReglementDTO;
import org.example.model.Commande;
import org.example.model.Reglement;
import org.example.model.Utilisateur;
import org.example.repository.CommandeRepository;
import org.example.repository.ReglementRepository;
import org.example.repository.UtilisateurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ReglementService {

    @Autowired
    private ReglementRepository reglementRepository;

    @Autowired
    private CommandeRepository commandeRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Value("${file.upload-dir:uploads}/tresorerie")
    private String uploadPath;

    public List<Reglement> getAllReglements() {
        return reglementRepository.findAll();
    }

    public Optional<Reglement> getReglementById(int id) {
        return reglementRepository.findById(id);
    }


    public Reglement creerReglement(ReglementDTO reglementDTO) throws IOException {
        // Récupérer l'utilisateur authentifié
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Utilisateur utilisateur = utilisateurRepository.findByEmail(username);

        if (utilisateur == null) {
            throw new RuntimeException("Utilisateur non trouvé");
        }

        // Vérifier que l'utilisateur a le rôle "Trésorerie"
        boolean hasTresorerieRole = utilisateur.getRole().getNom().equals("ROLE_TRESORERIE");

        if (!hasTresorerieRole) {
            throw new RuntimeException("Accès refusé: rôle Trésorerie requis");
        }

        // Récupérer la commande associée
        Optional<Commande> commandeOpt = commandeRepository.findById(reglementDTO.getCommandeId());
        if (!commandeOpt.isPresent()) {
            throw new RuntimeException("Commande non trouvée");
        }

        Commande commande = commandeOpt.get();

        // Vérifier que la commande est validée
        if (!commande.getEtatCommande().equals("validé")) {
            throw new RuntimeException("La commande doit être validée avant d'être réglée");
        }

        // Créer le règlement
        Reglement reglement = new Reglement();
        reglement.setDatePreparation(reglementDTO.getDatePreparation());
        reglement.setModeReglement(reglementDTO.getModeReglement());
        reglement.setNumeroCheque(reglementDTO.getNumeroCheque());
        reglement.setDateTransmission(reglementDTO.getDateTransmission());
        reglement.setCommentaire(reglementDTO.getCommentaire());
        reglement.setEtatEnCoursValideEtc("en cours");
        reglement.setCommande(commande);
        reglement.setUtilisateur(utilisateur);

        // Gérer le fichier joint
        MultipartFile fichier = reglementDTO.getFichier();
        if (fichier != null && !fichier.isEmpty()) {
            // Créer le dossier s'il n'existe pas
            Path uploadDirectory = Paths.get(uploadPath);
            if (!Files.exists(uploadDirectory)) {
                Files.createDirectories(uploadDirectory);
            }

            // Générer un nom unique pour le fichier
            String originalFilename = fichier.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFilename = UUID.randomUUID().toString() + extension;

            // Enregistrer le fichier
            Path filePath = uploadDirectory.resolve(newFilename);
            Files.copy(fichier.getInputStream(), filePath);

            // Stocker le nom du fichier
            reglement.setFichierJoint(newFilename);
        }

        // Mettre à jour l'état de la commande
        commande.setEtatCommande("en règlement");
        commandeRepository.save(commande);

        return reglementRepository.save(reglement);
    }

    public Reglement updateReglement(int id, ReglementDTO reglementDTO) throws IOException {
        // Vérifier que le règlement existe
        Optional<Reglement> reglementOpt = reglementRepository.findById(id);
        if (!reglementOpt.isPresent()) {
            throw new RuntimeException("Règlement non trouvé");
        }

        Reglement reglement = reglementOpt.get();

        // Récupérer l'utilisateur authentifié
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Utilisateur utilisateur = utilisateurRepository.findByEmail(username);

        if (utilisateur == null) {
            throw new RuntimeException("Utilisateur non trouvé");
        }

        // Vérifier que l'utilisateur a le rôle "Trésorerie"
        boolean hasTresorerieRole = utilisateur.getRole().getNom().equals("ROLE_TRESORERIE");

        if (!hasTresorerieRole) {
            throw new RuntimeException("Accès refusé: rôle Trésorerie requis");
        }

        // Mettre à jour les champs
        reglement.setDatePreparation(reglementDTO.getDatePreparation());
        reglement.setModeReglement(reglementDTO.getModeReglement());
        reglement.setNumeroCheque(reglementDTO.getNumeroCheque());
        reglement.setDateTransmission(reglementDTO.getDateTransmission());
        reglement.setCommentaire(reglementDTO.getCommentaire());
        reglement.setEtatEnCoursValideEtc(reglementDTO.getEtatEnCoursValideEtc());
        reglement.setUtilisateur(utilisateur);

        // Gérer le fichier joint
        MultipartFile fichier = reglementDTO.getFichier();
        if (fichier != null && !fichier.isEmpty()) {
            // Supprimer l'ancien fichier s'il existe
            if (reglement.getFichierJoint() != null) {
                Path oldFilePath = Paths.get(uploadPath, reglement.getFichierJoint());
                Files.deleteIfExists(oldFilePath);
            }

            // Générer un nom unique pour le fichier
            String originalFilename = fichier.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFilename = UUID.randomUUID().toString() + extension;

            // Enregistrer le fichier
            Path filePath = Paths.get(uploadPath, newFilename);
            Files.copy(fichier.getInputStream(), filePath);

            // Stocker le nom du fichier
            reglement.setFichierJoint(newFilename);
        }

        // Si le règlement est validé, mettre à jour l'état de la commande
        if ("validé".equals(reglementDTO.getEtatEnCoursValideEtc())) {
            Commande commande = reglement.getCommande();
            commande.setEtatCommande("réglé");
            commandeRepository.save(commande);
        }

        return reglementRepository.save(reglement);
    }

    public void deleteReglement(int id) {
        reglementRepository.deleteById(id);
    }

    public long countReglementsByEtat(String etat) {
        return reglementRepository.countByEtatEnCoursValideEtc(etat);
    }
    public Reglement saveReglement(Reglement reglement) {
        return reglementRepository.save(reglement);
    }

    public boolean existsByCommandeId(int commandeId) {
        return reglementRepository.existsByCommandeId(commandeId);
    }
}