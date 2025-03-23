package org.example.controller;

import org.antlr.v4.runtime.Token;
import org.example.model.Role;
import org.example.model.Utilisateur;
import org.example.service.RoleService;
import org.example.service.UtilisateurService;
import org.example.service.UtilisateurService.UtilisateurNonTrouveException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@CrossOrigin(origins = {"http://127.0.0.1:8080", "http://localhost:8080"})
@RestController
@RequestMapping("/utilisateurs")
public class UtilisateurController {

        @Autowired
        private final UtilisateurService utilisateurService;
        private final RoleService roleService;

        @Autowired
        public UtilisateurController(UtilisateurService utilisateurService, RoleService roleService) {
            this.utilisateurService = utilisateurService;
            this.roleService = roleService;
        }
        @PostMapping
        public ResponseEntity<?> creerUtilisateur(@RequestBody Utilisateur utilisateur) {
            try {
                // Vérifier si le rôle existe
                if (utilisateur.getRole() == null || utilisateur.getRole().getIdRole() <= 0) {
                    return new ResponseEntity<>("Le rôle est requis", HttpStatus.BAD_REQUEST);
                }

                // Set default status
                utilisateur.setStatut(true);


                Utilisateur nouvelUtilisateur = utilisateurService.creerUtilisateur(utilisateur);
                return new ResponseEntity<>(nouvelUtilisateur, HttpStatus.CREATED);
            } catch (UtilisateurService.ChampsRequisManquantsException e) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
            } catch (UtilisateurService.NomPrenomInvalideException e) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
            } catch (UtilisateurService.FormatEmailInvalideException e) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
            } catch (UtilisateurService.EmailDejaUtiliseException e) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
            } catch (UtilisateurService.MotDePasseTropCourtException e) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
            } catch (Exception e) {
                return new ResponseEntity<>("Une erreur interne est survenue: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        // Endpoint pour récupérer la liste des rôles
        @GetMapping("/roles")
        public ResponseEntity<List<Role>> getAllRoles() {
            try {
                // Make sure this method exists in your RoleService
                List<Role> roles = roleService.findAllRoles(); // Use the correct method name
                return new ResponseEntity<>(roles, HttpStatus.OK);
            } catch (Exception e) {
                return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        @GetMapping("/{id}")
        public ResponseEntity<?> getUtilisateurById(@PathVariable Integer id) {
            try {
                Utilisateur utilisateur = utilisateurService.getUtilisateurById(id);

                // Créer une Map pour renvoyer uniquement les champs souhaités
                Map<String, Object> response = new HashMap<>();
                response.put("nom", utilisateur.getNom());
                response.put("prenom", utilisateur.getPrenom());
                response.put("email", utilisateur.getEmail());
                response.put("role", utilisateur.getRole().getNom()); // Récupérer le nom du rôle

                return new ResponseEntity<>(response, HttpStatus.OK);
            } catch (UtilisateurNonTrouveException e) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
            }catch (UtilisateurService.UtilisateurInactifException e){
                return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
            }
        }

        @PostMapping("/authentifier")
        public ResponseEntity<?> authentifier(@RequestParam String email, @RequestParam String motDePasse) {
            try {
                System.out.println("Tentative d'authentification pour : " + email);
                Utilisateur utilisateur = utilisateurService.authentifier(email, motDePasse);
                Map<String, String> response = new HashMap<>();
                response.put("message", "Authentification réussie");
                response.put("id", String.valueOf(utilisateur.getIdUtilisateur())); // Conversion directe
                response.put("nom", utilisateur.getNom());
                response.put("prenom", utilisateur.getPrenom());
                response.put("role", utilisateur.getRole().getNom());
                System.out.println("Authentification réussie pour : " + email);
                return ResponseEntity.ok(response);
            } catch (RuntimeException e) {
                System.out.println("Erreur d'authentification : " + e.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(e.getMessage());
            }
        }

        //Modifier un utilisateur
        @PutMapping("/modifier-utilisateur/{id}")
        public ResponseEntity<?> modifierUtilisateur(@PathVariable Integer id, @RequestBody Utilisateur utilisateur) {
            try {
                Utilisateur utilisateurModifie = utilisateurService.modifierUtilisateur(id, utilisateur);
                return new ResponseEntity<>("Utilisateur modifié avec succès", HttpStatus.OK);
            } catch (UtilisateurNonTrouveException e) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
            } catch (UtilisateurService.NomPrenomInvalideException | UtilisateurService.FormatEmailInvalideException |
                     UtilisateurService.RoleNonTrouveException e) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
            } catch (Exception e) {
                return new ResponseEntity<>("Une erreur est survenue lors de la modification", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }


        //désactiver un utilisateur (par les admins)
        @PutMapping("/desactiver/{id}")
        public ResponseEntity<?> desactiverUtilisateur(@PathVariable Integer id) {
            try {
                utilisateurService.desactiverUtilisateur(id);
                return new ResponseEntity<>("Utilisateur désactivé avec succès", HttpStatus.OK);
            } catch (UtilisateurService.UtilisateurNonTrouveException e) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
            } catch (UtilisateurService.UtilisateurInactifException e) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
            } catch (Exception e) {
                return new ResponseEntity<>("Une erreur est survenue lors de la désactivation de l'utilisateur",
                        HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        /**
         * Activer un utilisateur
         */
        @PutMapping("/activer/{id}")
        public ResponseEntity<?> activerUtilisateur(@PathVariable Integer id) {
            try {
                Utilisateur utilisateur = utilisateurService.activerUtilisateur(id);
                return new ResponseEntity<>("Utilisateur activé avec succès: " + utilisateur.getNom() + " " + utilisateur.getPrenom(), HttpStatus.OK);
            } catch (UtilisateurService.UtilisateurNonTrouveException e) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
            } catch (UtilisateurService.UtilisateurDejaActifException e) {
                return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
            } catch (Exception e) {
                // Log l'exception complète pour diagnostic
                e.printStackTrace();
                return new ResponseEntity<>("Une erreur est survenue lors de l'activation de l'utilisateur: " + e.getMessage(),
                        HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        /**
         * Vérifie si le mot de passe actuel est correct
         */
        @PostMapping("/verifier-mot-de-passe/{id}")
        public ResponseEntity<?> verifierMotDePasse(@PathVariable("id") Integer id,
                                                    @RequestBody Map<String, String> passwordMap) {
            try {
                String motDePasseActuel = passwordMap.get("motDePasseActuel");
                boolean estCorrect = utilisateurService.verifierMotDePasse(id, motDePasseActuel);

                Map<String, Object> response = new HashMap<>();
                response.put("estCorrect", estCorrect);

                return ResponseEntity.ok(response);
            } catch (UtilisateurService.UtilisateurNonTrouveException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Une erreur est survenue lors de la vérification du mot de passe"));
            }
        }

        /**
         * Modifie le mot de passe de l'utilisateur
         */
        @PutMapping("/modifier-mot-de-passe/{id}")
        public ResponseEntity<?> modifierMotDePasse(@PathVariable("id") Integer id,
                                                    @RequestBody Map<String, String> passwordMap) {
            try {
                String motDePasseActuel = passwordMap.get("motDePasseActuel");
                String nouveauMotDePasse = passwordMap.get("nouveauMotDePasse");

                // Vérification des paramètres
                if (motDePasseActuel == null || nouveauMotDePasse == null) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "Les paramètres 'motDePasseActuel' et 'nouveauMotDePasse' sont requis"));
                }

                utilisateurService.modifierMotDePasse(id, motDePasseActuel, nouveauMotDePasse);

                return ResponseEntity.ok(Map.of(
                        "message", "Mot de passe modifié avec succès",
                        "success", true
                ));
            } catch (UtilisateurService.UtilisateurNonTrouveException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "message", "Utilisateur non trouvé",
                                "success", false
                        ));
            } catch (UtilisateurService.MotDePasseIncorrectException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "message", "Le mot de passe actuel est incorrect",
                                "success", false
                        ));
            } catch (UtilisateurService.MotDePasseTropCourtException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "message", "Le nouveau mot de passe ne respecte pas les critères de sécurité",
                                "success", false
                        ));
            } catch (Exception e) {
                // Journaliser l'erreur sur le serveur
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of(
                                "message", "Une erreur inattendue est survenue lors de la modification du mot de passe",
                                "success", false
                        ));
            }
        }

        /**
         * Se deconnecter
         */

        @PostMapping("/deconnecter")
        public ResponseEntity<?> deconnecter() {
            // Nous retournons simplement un succès car la déconnexion sera gérée côté client
            // avec suppression des données de session
            return ResponseEntity.ok(Map.of(
                    "message", "Déconnexion réussie",
                    "success", true
            ));
        }

        /**
         * Récupérer tous les utilisateurs sauf les admins
         */
        @GetMapping("/tous")
        public ResponseEntity<?> getAllUtilisateurs() {
            try {
                List<Utilisateur> utilisateurs = utilisateurService.getAllUtilisateursExceptAdmins();
                return new ResponseEntity<>(utilisateurs, HttpStatus.OK);
            } catch (Exception e) {
                return new ResponseEntity<>("Une erreur est survenue lors de la récupération des utilisateurs: " + e.getMessage(),
                        HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

    @GetMapping("/tous-avec-roles")
    public ResponseEntity<List<Map<String, Object>>> getAllUtilisateursAvecRoles() {
        try {
            List<Utilisateur> utilisateurs = utilisateurService.getAllUtilisateurs();
            List<Map<String, Object>> utilisateursAvecRoles = new ArrayList<>();

            for (Utilisateur u : utilisateurs) {
                Map<String, Object> utilisateurMap = new HashMap<>();
                utilisateurMap.put("idUtilisateur", u.getIdUtilisateur());
                utilisateurMap.put("nom", u.getNom());
                utilisateurMap.put("prenom", u.getPrenom());
                utilisateurMap.put("email", u.getEmail());
                utilisateurMap.put("statut", u.isStatut());

                // Créer un objet pour le rôle
                if (u.getRole() != null) {
                    Map<String, Object> roleMap = new HashMap<>();
                    roleMap.put("idRole", u.getRole().getIdRole());
                    roleMap.put("nom", u.getRole().getNom());
                    utilisateurMap.put("role", roleMap);
                } else {
                    utilisateurMap.put("role", null);
                }

                utilisateursAvecRoles.add(utilisateurMap);
            }

            return new ResponseEntity<>(utilisateursAvecRoles, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    }