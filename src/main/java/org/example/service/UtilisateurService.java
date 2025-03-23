package org.example.service;

import jakarta.transaction.Transactional;
import org.example.model.Utilisateur;
import org.example.model.Role;
import org.example.repository.UtilisateurRepository;
import org.example.repository.RoleRepository;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.logging.Logger;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Autowired
    public UtilisateurService(UtilisateurRepository utilisateurRepository,
                              RoleRepository roleRepository,
                              BCryptPasswordEncoder passwordEncoder) {
        this.utilisateurRepository = utilisateurRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$");
    private static final Pattern NAME_PATTERN = Pattern.compile("^[a-zA-Z]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+\\d{1,3}[- ]?)?\\d{10}$");

    public Utilisateur activerUtilisateur(Integer id) throws UtilisateurNonTrouveException {
        Utilisateur utilisateur = findUtilisateurById(id);

        if (utilisateur.isStatut()) {
            throw new UtilisateurDejaActifException("L'utilisateur est déjà actif");
        }

        // Si on arrive ici, l'utilisateur est inactif et on peut l'activer
        utilisateur.setStatut(true);
        return utilisateurRepository.save(utilisateur);
    }

    // Ajouter cette classe d'exception
    public static class UtilisateurDejaActifException extends RuntimeException {
        public UtilisateurDejaActifException(String message) {
            super(message);
        }
    }

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

    public static class NomPrenomInvalideException extends RuntimeException {
        public NomPrenomInvalideException(String message) {
            super(message);
        }
    }


    // mot de passe
    public static class MotDePasseTropCourtException extends RuntimeException {
        public MotDePasseTropCourtException(String message) {
            super(message);
        }
    }
    public static class MotDePasseIncorrectException extends RuntimeException {
        public MotDePasseIncorrectException(String message) {
            super(message);
        }
    }

    public Utilisateur findByEmail(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email);
        if (utilisateur == null) {
            throw new UtilisateurNonTrouveException("Utilisateur non  avec l'email : " + email);
        }
        return utilisateur;
    }
    public Utilisateur creerUtilisateur(Utilisateur utilisateur) {
        if (utilisateur.getNom() == null || utilisateur.getPrenom() == null || utilisateur.getEmail() == null || utilisateur.getMotDePasse() == null || utilisateur.getRole() == null) {
            throw new ChampsRequisManquantsException("Tous les champs requis doivent être remplis.");
        }

        if (!NAME_PATTERN.matcher(utilisateur.getNom()).matches() || !NAME_PATTERN.matcher(utilisateur.getPrenom()).matches()) {
            throw new NomPrenomInvalideException("Le nom et le prénom ne doivent contenir que des lettres.");
        }

        if (!EMAIL_PATTERN.matcher(utilisateur.getEmail()).matches()) {
            throw new FormatEmailInvalideException("Le format de l'e-mail est invalide. L'e-mail doit être de la forme 'nom@domaine.com'.");
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


            return utilisateurRepository.save(utilisateur);

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


        // Vérifier et mettre à jour le rôle si fourni
        if (utilisateurModifie.getRole() != null) {
            Role nouveauRole = roleRepository.findById(utilisateurModifie.getRole().getIdRole())
                    .orElseThrow(() -> new RoleNonTrouveException("Rôle non trouvé"));
            utilisateurExistant.setRole(nouveauRole);
        }

        return utilisateurRepository.save(utilisateurExistant);
    }

   // modifier le mot de passe
    /**
     * Vérifie si le mot de passe actuel est correct
     */
    public boolean verifierMotDePasse(Integer id, String motDePasseActuel) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new UtilisateurNonTrouveException("Utilisateur non trouvé avec l'ID : " + id));

        return passwordEncoder.matches(motDePasseActuel, utilisateur.getMotDePasse());
    }

    /**
     * Modifie le mot de passe d'un utilisateur
     */
    @Transactional
    public void modifierMotDePasse(Integer id, String motDePasseActuel, String nouveauMotDePasse) {
        // Vérifier si l'utilisateur existe
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new UtilisateurNonTrouveException("Utilisateur non trouvé avec l'ID : " + id));

        // Vérifier si le mot de passe actuel est correct
        if (!passwordEncoder.matches(motDePasseActuel, utilisateur.getMotDePasse())) {
            throw new MotDePasseIncorrectException("Le mot de passe actuel est incorrect");
        }

        // Vérifier si le nouveau mot de passe est identique à l'ancien
        if (passwordEncoder.matches(nouveauMotDePasse, utilisateur.getMotDePasse())) {
            throw new MotDePasseIncorrectException("Le nouveau mot de passe doit être différent de l'ancien");
        }

        // Vérifier la complexité du nouveau mot de passe
        if (!estMotDePasseSecurise(nouveauMotDePasse)) {
            throw new MotDePasseTropCourtException(
                    "Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, " +
                            "une minuscule, un chiffre et un caractère spécial");
        }

        // Encoder et enregistrer le nouveau mot de passe
        String motDePasseEncode = passwordEncoder.encode(nouveauMotDePasse);
        utilisateur.setMotDePasse(motDePasseEncode);
        utilisateurRepository.save(utilisateur);
    }

    /**
     * Vérifie la complexité du mot de passe
     */
    private boolean estMotDePasseSecurise(String motDePasse) {
        return PASSWORD_PATTERN.matcher(motDePasse).matches();
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
    public List<Utilisateur> getAllUtilisateurs() {
        return utilisateurRepository.findAll();
    }

    // recuperer tous les utilisateurs sauf les admins
    public List<Utilisateur> getAllUtilisateursExceptAdmins() {
        // Supposons que le rôle d'administrateur a l'ID 1
        int adminRoleId = 1;
        return utilisateurRepository.findAllExceptAdmins(adminRoleId);
    }

    // méthode qui récupère un utilisateur sans vérifier son statut
    public Utilisateur findUtilisateurById(Integer id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new UtilisateurNonTrouveException("Utilisateur non trouvé"));
    }
}