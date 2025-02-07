package org.example.service;

import org.example.model.Utilisateur;
import org.example.model.Role;
import org.example.repository.UtilisateurRepository;
import org.example.repository.RoleRepository;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.logging.Logger;
import java.util.regex.Pattern;

@Service
public class UtilisateurService {

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\\S+$).{8,}$");
    private static final Pattern NAME_PATTERN = Pattern.compile("^[a-zA-Z]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+\\d{1,3}[- ]?)?\\d{10}$");

    public static class UtilisateurNonTrouveException extends RuntimeException {
        public UtilisateurNonTrouveException(String message) {
            super(message);
        }
    }

    public static class UtilisateurInactifException extends RuntimeException {
        public UtilisateurInactifException(String message) {
            super(message);
        }
    }

    public static class RoleNonAttribueException extends RuntimeException {
        public RoleNonAttribueException(String message) {
            super(message);
        }
    }

    public static class RoleNonTrouveException extends RuntimeException {
        public RoleNonTrouveException(String message) {
            super(message);
        }
    }

    public static class MotDePasseIncorrectException extends RuntimeException {
        public MotDePasseIncorrectException(String message) {
            super(message);
        }
    }

    public static class EmailDejaUtiliseException extends RuntimeException {
        public EmailDejaUtiliseException(String message) {
            super(message);
        }
    }

    public static class FormatEmailInvalideException extends RuntimeException {
        public FormatEmailInvalideException(String message) {
            super(message);
        }
    }

    public static class ChampsRequisManquantsException extends RuntimeException {
        public ChampsRequisManquantsException(String message) {
            super(message);
        }
    }

    public static class MotDePasseTropCourtException extends RuntimeException {
        public MotDePasseTropCourtException(String message) {
            super(message);
        }
    }

    public static class NomPrenomInvalideException extends RuntimeException {
        public NomPrenomInvalideException(String message) {
            super(message);
        }
    }

    public static class TelephoneDejaUtiliseException extends RuntimeException {
        public TelephoneDejaUtiliseException(String message) {
            super(message);
        }
    }

    public Utilisateur creerUtilisateur(Utilisateur utilisateur) {
        if (utilisateur.getNom() == null || utilisateur.getPrenom() == null || utilisateur.getEmail() == null || utilisateur.getMotDePasse() == null || utilisateur.getTelephone() == null || utilisateur.getRole() == null) {
            throw new ChampsRequisManquantsException("Tous les champs requis doivent être remplis.");
        }

        if (!NAME_PATTERN.matcher(utilisateur.getNom()).matches() || !NAME_PATTERN.matcher(utilisateur.getPrenom()).matches()) {
            throw new NomPrenomInvalideException("Le nom et le prénom ne doivent contenir que des lettres.");
        }

        if (!EMAIL_PATTERN.matcher(utilisateur.getEmail()).matches()) {
            throw new FormatEmailInvalideException("Le format de l'e-mail est invalide. L'e-mail doit être de la forme 'nom@domaine.com'.");
        }

        // Validation du numéro de téléphone
        if (!PHONE_PATTERN.matcher(utilisateur.getTelephone()).matches()) {
            throw new FormatEmailInvalideException("Le format du numéro de téléphone est invalide. Le numéro doit être de la forme '+1234567890' ou '0123456789'.");
        }

        if (utilisateurRepository.findByEmail(utilisateur.getEmail()) != null) {
            throw new EmailDejaUtiliseException("L'adresse e-mail est déjà utilisée.");
        }

        if (!PASSWORD_PATTERN.matcher(utilisateur.getMotDePasse()).matches()) {
            throw new MotDePasseTropCourtException("Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial.");
        }

        Role role = roleRepository.findById(utilisateur.getRole().getIdRole())
                .orElseThrow(() -> new RoleNonTrouveException("Rôle non trouvé avec l'ID : " + utilisateur.getRole().getIdRole()));


        utilisateur.setStatut(true);
        utilisateur.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));


        try {
            return utilisateurRepository.save(utilisateur);
        } catch (DataIntegrityViolationException e) {
            // Si la violation de contrainte concerne le numéro de téléphone
            throw new TelephoneDejaUtiliseException("Le numéro de téléphone est déjà utilisé.");
        }
    }

    public Utilisateur getUtilisateurById(Integer id) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new UtilisateurNonTrouveException("Utilisateur non trouvé "));

        if (!utilisateur.isStatut()) {
            throw new UtilisateurInactifException("L'utilisateur est inactif.");
        }

        return utilisateur;
    }

    public Utilisateur authentifier(String email, String motDePasse) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email);
        if (utilisateur == null) {
            throw new UtilisateurNonTrouveException("Utilisateur non trouvé avec l'email : " + email);
        }

        if (!utilisateur.isStatut()) {
            throw new UtilisateurInactifException("L'utilisateur est inactif.");
        }

        if (utilisateur.getRole() == null) {
            throw new RoleNonAttribueException("L'utilisateur n'a pas de rôle attribué.");
        }

        if (!passwordEncoder.matches(motDePasse, utilisateur.getMotDePasse())) {
            throw new MotDePasseIncorrectException("Mot de passe incorrect.");
        }

        return utilisateur;
    }

    //modifier un utilisateur
    public Utilisateur modifierUtilisateur(Integer id, Utilisateur utilisateurModifie) {
        // Récupérer l'utilisateur existant
        Utilisateur utilisateurExistant = utilisateurRepository.findById(id)
                .orElseThrow(() -> new UtilisateurNonTrouveException("Utilisateur non trouvé avec l'ID : " + id));

        // Vérifier et mettre à jour le nom si fourni
        if (utilisateurModifie.getNom() != null) {
            if (!NAME_PATTERN.matcher(utilisateurModifie.getNom()).matches()) {
                throw new NomPrenomInvalideException("Le nom ne doit contenir que des lettres.");
            }
            utilisateurExistant.setNom(utilisateurModifie.getNom());
        }

        // Vérifier et mettre à jour le prénom si fourni
        if (utilisateurModifie.getPrenom() != null) {
            if (!NAME_PATTERN.matcher(utilisateurModifie.getPrenom()).matches()) {
                throw new NomPrenomInvalideException("Le prénom ne doit contenir que des lettres.");
            }
            utilisateurExistant.setPrenom(utilisateurModifie.getPrenom());
        }

        // Vérifier et mettre à jour l'email si fourni
        if (utilisateurModifie.getEmail() != null) {
            if (!EMAIL_PATTERN.matcher(utilisateurModifie.getEmail()).matches()) {
                throw new FormatEmailInvalideException("Le format de l'e-mail est invalide.");
            }
            Utilisateur utilisateurEmail = utilisateurRepository.findByEmail(utilisateurModifie.getEmail());
            if (utilisateurEmail != null && utilisateurEmail.getIdUtilisateur() != id)     {
                throw new EmailDejaUtiliseException("L'adresse e-mail est déjà utilisée.");
            }
            utilisateurExistant.setEmail(utilisateurModifie.getEmail());
        }

        // Vérifier et mettre à jour le téléphone si fourni
        if (utilisateurModifie.getTelephone() != null) {
            if (!PHONE_PATTERN.matcher(utilisateurModifie.getTelephone()).matches()) {
                throw new FormatEmailInvalideException("Le format du numéro de téléphone est invalide.");
            }
            try {
                utilisateurExistant.setTelephone(utilisateurModifie.getTelephone());
            } catch (DataIntegrityViolationException e) {
                throw new TelephoneDejaUtiliseException("Le numéro de téléphone est déjà utilisé.");
            }
        }

        // Vérifier et mettre à jour le rôle si fourni
        if (utilisateurModifie.getRole() != null) {
            Role nouveauRole = roleRepository.findById(utilisateurModifie.getRole().getIdRole())
                    .orElseThrow(() -> new RoleNonTrouveException("Rôle non trouvé"));
            utilisateurExistant.setRole(nouveauRole);
        }

        return utilisateurRepository.save(utilisateurExistant);
    }

    //modifier que le mot de passe
    public void modifierMotDePasse(Integer idUtilisateur, String ancienMotDePasse, String nouveauMotDePasse) {
        // Récupérer l'utilisateur depuis la base de données
        Utilisateur utilisateur = utilisateurRepository.findById(idUtilisateur)
                .orElseThrow(() -> new UtilisateurNonTrouveException("Utilisateur non trouvé avec l'ID : " + idUtilisateur));

        // Vérifier si l'ancien mot de passe est correct
        if (!passwordEncoder.matches(ancienMotDePasse, utilisateur.getMotDePasse())) {
            throw new MotDePasseIncorrectException("L'ancien mot de passe est incorrect.");
        }

        // Vérifier si le nouveau mot de passe est différent de l'ancien
        if (passwordEncoder.matches(nouveauMotDePasse, utilisateur.getMotDePasse())) {
            throw new MotDePasseIncorrectException("Le nouveau mot de passe doit être différent de l'ancien.");
        }

        // Vérifier que le nouveau mot de passe respecte les critères de sécurité
        if (!PASSWORD_PATTERN.matcher(nouveauMotDePasse).matches()) {
            throw new MotDePasseTropCourtException("Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial.");
        }

        // Crypter le nouveau mot de passe
        String nouveauMotDePasseCrypte = passwordEncoder.encode(nouveauMotDePasse);

        // Mettre à jour le mot de passe dans l'objet utilisateur
        utilisateur.setMotDePasse(nouveauMotDePasseCrypte);

        // Enregistrer les modifications dans la base de données
        utilisateurRepository.save(utilisateur);
    }

    //Désactiver un utilisateur (par les admins)
    public void desactiverUtilisateur(Integer id) {
        // Récupérer l'utilisateur
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new UtilisateurNonTrouveException("Utilisateur non trouvé avec l'ID : " + id));

        // Vérifier si l'utilisateur n'est pas déjà désactivé
        if (!utilisateur.isStatut()) {
            throw new UtilisateurInactifException("L'utilisateur est déjà inactif.");
        }

        // Changer le statut à false
        utilisateur.setStatut(false);

        // Sauvegarder les modifications
        utilisateurRepository.save(utilisateur);
    }
}