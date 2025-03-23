document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let utilisateursData = [];
    let selectedUtilisateurId = null;
    let rolesMap = {};

    // Vérifier si nous sommes sur la page de gestion des utilisateurs
    const utilisateursTableBody = document.getElementById('utilisateursTableBody');

    if (!utilisateursTableBody) {
        console.log("Page de gestion des utilisateurs non détectée, initialisation annulée");
        return; // Sortir de la fonction si l'élément clé n'est pas trouvé
    }

    // Initialisation
    chargerRoles();  // Charger d'abord les rôles
    chargerUtilisateurs();  // Puis les utilisateurs
    setupEventListeners();

    function appliquerFiltres() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const roleFiltre = document.getElementById('roleFilter').value;
        const statutFiltre = document.getElementById('statutFilter').value;

        // Filtrer les données selon les critères
        const utilisateursFiltre = utilisateursData.filter(user => {
            // Filtre de recherche textuelle
            const matchSearch = searchTerm === '' ||
                user.nom?.toLowerCase().includes(searchTerm) ||
                user.prenom?.toLowerCase().includes(searchTerm) ||
                user.email?.toLowerCase().includes(searchTerm);

            // Filtre par rôle
            const matchRole = roleFiltre === '' ||
                (user.role && user.role.idRole == roleFiltre);

            // Filtre par statut
            const matchStatut = statutFiltre === '' ||
                user.statut.toString() === statutFiltre;

            return matchSearch && matchRole && matchStatut;
        });

        // Afficher les résultats filtrés
        renderUtilisateursTable(utilisateursFiltre);
    }

    // Charger les rôles avant de charger les utilisateurs
    function chargerRoles() {
        return fetch('http://localhost:8082/utilisateurs/roles', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des rôles');
                }
                return response.json();
            })
            .then(data => {
                console.log("Rôles chargés:", data);
                // Create a map of roles for faster lookups
                rolesMap = {};
                data.forEach(role => {
                    rolesMap[role.idRole] = role.nom;
                });

                // Remplir le select du modal
                const roleSelect = document.getElementById('role');
                if (roleSelect) {
                    roleSelect.innerHTML = '';
                    data.forEach(role => {
                        const option = document.createElement('option');
                        option.value = role.idRole;
                        option.textContent = role.nom;
                        roleSelect.appendChild(option);
                    });
                }

                return data;
            })
            .catch(error => {
                showToast('Erreur', 'Erreur lors du chargement des rôles: ' + error.message, 'danger');
                console.error("Erreur lors du chargement des rôles:", error);
            });
    }

    // Charger la liste des utilisateurs
    function chargerUtilisateurs() {
        fetch('http://localhost:8082/utilisateurs/tous-avec-roles', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des utilisateurs');
                }
                return response.json();
            })
            .then(data => {
                console.log("Utilisateurs chargés:", data);
                utilisateursData = data;
                renderUtilisateursTable(data);

                initializeRoleFilter(data);
            })
            .catch(error => {
                showToast('Erreur', 'Erreur lors du chargement des utilisateurs: ' + error.message, 'danger');
                console.error("Erreur lors du chargement des utilisateurs:", error);
            });
    }

    // Initialise le filtre de rôle à partir des données des utilisateurs
    function initializeRoleFilter(utilisateurs) {
        const roleFilter = document.getElementById('roleFilter');
        if (!roleFilter) return;

        // Récupérer tous les rôles uniques des utilisateurs
        const uniqueRoles = [...new Set(utilisateurs
            .filter(u => u.role && u.role.idRole) // S'assurer que le rôle existe
            .map(u => JSON.stringify({id: u.role.idRole, nom: u.role.nom || rolesMap[u.role.idRole] || 'Non défini'})))];

        // Vider le select existant sauf l'option par défaut
        roleFilter.innerHTML = '<option value="">Tous les rôles</option>';

        // Ajouter chaque rôle unique
        uniqueRoles.forEach(roleString => {
            const role = JSON.parse(roleString);
            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = role.nom;
            roleFilter.appendChild(option);
        });
    }

    // Modifier la fonction renderUtilisateursTable pour prendre en compte la structure de données correcte
    function renderUtilisateursTable(utilisateurs) {
        const tableBody = document.getElementById('utilisateursTableBody');
        tableBody.innerHTML = '';

        utilisateurs.forEach(utilisateur => {
            const row = document.createElement('tr');

            // Obtenir l'ID et le nom du rôle correctement
            const roleId = utilisateur.role ? utilisateur.role.idRole : null;

            // Priorité: utiliser le nom du rôle de l'utilisateur s'il existe,
            // sinon utiliser le nom du rôle à partir de rolesMap,
            // sinon afficher 'Non défini'
            let roleName = 'Non défini';
            if (utilisateur.role) {
                if (utilisateur.role.nom) {
                    roleName = utilisateur.role.nom;
                } else if (roleId && rolesMap[roleId]) {
                    roleName = rolesMap[roleId];
                }
            }

            row.innerHTML = `
            <td>${utilisateur.nom || ''}</td>
            <td>${utilisateur.prenom || ''}</td>
            <td>${utilisateur.email || ''}</td>
            <td data-role-id="${roleId || ''}">${roleName}</td>
            <td>
              <span class="badge ${utilisateur.statut ? 'bg-success' : 'bg-danger'}">
                ${utilisateur.statut ? 'Actif' : 'Inactif'}
              </span>
            </td>
            <td>
              <div class="d-flex">
                <button class="btn btn-sm btn-link text-primary me-2 btn-edit" title="Modifier" data-id="${utilisateur.idUtilisateur}">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-link ${utilisateur.statut ? 'text-danger' : 'text-success'} btn-toggle-status" 
                        title="${utilisateur.statut ? 'Désactiver' : 'Activer'}" 
                        data-id="${utilisateur.idUtilisateur}" 
                        data-status="${utilisateur.statut}">
                  <i class="fas ${utilisateur.statut ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                </button>
              </div>
            </td>
        `;

            tableBody.appendChild(row);
        });

        // Ajouter les gestionnaires d'événements aux boutons
        addTableButtonsEventListeners();
    }

    function updateTableRoles() {
        const roleCells = document.querySelectorAll('[data-role-id]');
        roleCells.forEach(cell => {
            const roleId = cell.getAttribute('data-role-id');
            if (roleId && rolesMap[roleId]) {
                cell.textContent = rolesMap[roleId];
            }
        });
    }

    // Configuration des écouteurs d'événements
    function setupEventListeners() {
        // Bouton pour enregistrer un utilisateur (modification)
        const saveUtilisateur = document.getElementById('saveUtilisateur');
        if (saveUtilisateur) {
            saveUtilisateur.addEventListener('click', sauvegarderUtilisateur);
        }

        // Bouton pour confirmer la désactivation
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', desactiverUtilisateur);
        }

        // Écouteurs pour les filtres
        const searchInput = document.getElementById('searchInput');
        const roleFilter = document.getElementById('roleFilter');
        const statutFilter = document.getElementById('statutFilter');
        const resetFilters = document.getElementById('resetFilters');

        if (searchInput) {
            searchInput.addEventListener('input', appliquerFiltres);
        }

        if (roleFilter) {
            roleFilter.addEventListener('change', appliquerFiltres);
        }

        if (statutFilter) {
            statutFilter.addEventListener('change', appliquerFiltres);
        }

        if (resetFilters) {
            resetFilters.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                if (roleFilter) roleFilter.value = '';
                if (statutFilter) statutFilter.value = '';
                appliquerFiltres();
            });
        }
    }

    // Ajouter les écouteurs d'événements aux boutons du tableau
    function addTableButtonsEventListeners() {
        // Boutons d'édition
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                chargerUtilisateurPourModification(id);
            });
        });

        // Boutons de toggle statut (activer/désactiver)
        document.querySelectorAll('.btn-toggle-status').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const currentStatus = e.currentTarget.getAttribute('data-status') === 'true';

                selectedUtilisateurId = id;

                if (currentStatus) {
                    // Afficher le modal de confirmation pour désactiver
                    document.getElementById('confirmDeleteModalLabel').textContent = 'Confirmation de désactivation';
                    document.getElementById('confirmDeleteBtn').textContent = 'Désactiver';
                    document.querySelector('#confirmDeleteModal .modal-body').textContent =
                        'Êtes-vous sûr de vouloir désactiver cet utilisateur ? Cette action peut être annulée ultérieurement.';

                    const confirmModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
                    confirmModal.show();
                } else {
                    // Pour activer, pas besoin de confirmation, on appelle directement activerUtilisateur
                    activerUtilisateur(id);
                }
            });
        });
    }

    // Charger les données d'un utilisateur pour modification
    function chargerUtilisateurPourModification(utilisateurId) {
        const utilisateur = utilisateursData.find(u => u.idUtilisateur == utilisateurId);

        if (utilisateur) {
            document.getElementById('utilisateurModalLabel').textContent = 'Modifier l\'utilisateur';
            document.getElementById('idUtilisateur').value = utilisateur.idUtilisateur;
            document.getElementById('nom').value = utilisateur.nom;
            document.getElementById('prenom').value = utilisateur.prenom;
            document.getElementById('email').value = utilisateur.email;

            // S'assurer que le rôle existe
            if (utilisateur.role && utilisateur.role.idRole) {
                document.getElementById('role').value = utilisateur.role.idRole;
            }

            const utilisateurModal = new bootstrap.Modal(document.getElementById('utilisateurModal'));
            utilisateurModal.show();
        }
    }

    // Enregistrer un utilisateur (modification)
    function sauvegarderUtilisateur() {
        const idUtilisateur = document.getElementById('idUtilisateur').value;
        if (!idUtilisateur) return;

        // Récupérer les données du formulaire
        const utilisateurData = {
            nom: document.getElementById('nom').value,
            prenom: document.getElementById('prenom').value,
            email: document.getElementById('email').value,
            role: {
                idRole: parseInt(document.getElementById('role').value)
            }
        };

        // Ajouter l'ID
        utilisateurData.idUtilisateur = parseInt(idUtilisateur);

        // Envoyer la requête
        fetch(`http://localhost:8082/utilisateurs/modifier-utilisateur/${idUtilisateur}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(utilisateurData)
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(text);
                    });
                }
                return response.text();
            })
            .then(data => {
                bootstrap.Modal.getInstance(document.getElementById('utilisateurModal')).hide();
                showToast('Succès', 'Utilisateur modifié avec succès', 'success');
                chargerUtilisateurs(); // Rafraîchir la liste
            })
            .catch(error => {
                showToast('Erreur', error.message, 'danger');
            });
    }

    // Désactiver un utilisateur
    function desactiverUtilisateur() {
        if (!selectedUtilisateurId) return;

        fetch(`http://localhost:8082/utilisateurs/desactiver/${selectedUtilisateurId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(text);
                    });
                }
                return response.text();
            })
            .then(data => {
                bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal')).hide();
                showToast('Succès', 'Utilisateur désactivé avec succès', 'success');
                chargerUtilisateurs(); // Rafraîchir la liste
            })
            .catch(error => {
                showToast('Erreur', error.message, 'danger');
            });
    }

    // Activer un utilisateur (nouvelle fonction)
    function activerUtilisateur(utilisateurId) {
        fetch(`http://localhost:8082/utilisateurs/activer/${utilisateurId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(text);
                    });
                }
                return response.text();
            })
            .then(data => {
                showToast('Succès', 'Utilisateur activé avec succès', 'success');
                chargerUtilisateurs(); // Rafraîchir la liste
            })
            .catch(error => {
                showToast('Erreur', error.message, 'danger');
            });
    }

    // Afficher une notification toast
    function showToast(title, message, type) {
        const toastContainer = document.getElementById('toastContainer');

        const toastElement = document.createElement('div');
        toastElement.className = `toast align-items-center text-white bg-${type} border-0`;
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', 'assertive');
        toastElement.setAttribute('aria-atomic', 'true');

        toastElement.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <strong>${title}</strong>: ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

        toastContainer.appendChild(toastElement);

        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });

        toast.show();

        // Supprimer le toast du DOM après qu'il ait disparu
        toastElement.addEventListener('hidden.bs.toast', function() {
            toastContainer.removeChild(toastElement);
        });
    }
});