// Gestion des utilisateurs
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let utilisateursData = [];
    let selectedUtilisateurId = null;
// Vérifier si nous sommes sur la page de gestion des utilisateurs
    const utilisateursTableBody = document.getElementById('utilisateursTableBody');

    if (!utilisateursTableBody) {
        console.log("Page de gestion des utilisateurs non détectée, initialisation annulée");
        return; // Sortir de la fonction si l'élément clé n'est pas trouvé
    }
    // Initialisation
    chargerUtilisateurs();
    chargerRoles();
    setupEventListeners();

    // Charger la liste des utilisateurs
    function chargerUtilisateurs() {
        fetch('http://localhost:8082/utilisateurs/tous', {
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
                utilisateursData = data;
                renderUtilisateursTable(data);
            })
            .catch(error => {
                showToast('Erreur', error.message, 'danger');
            });
    }

    // Charger les rôles pour le formulaire
    function chargerRoles() {
        fetch('http://localhost:8082/utilisateurs/roles', {
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
                const roleSelect = document.getElementById('role');
                roleSelect.innerHTML = '';

                data.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.idRole;
                    option.textContent = role.nom;
                    roleSelect.appendChild(option);
                });
            })
            .catch(error => {
                showToast('Erreur', error.message, 'danger');
            });
    }

    // Afficher les utilisateurs dans le tableau
    function renderUtilisateursTable(utilisateurs) {
        const tableBody = document.getElementById('utilisateursTableBody');
        tableBody.innerHTML = '';

        utilisateurs.forEach(utilisateur => {
            const row = document.createElement('tr');

            row.innerHTML = `
        <td>${utilisateur.idUtilisateur}</td>
        <td>${utilisateur.nom}</td>
        <td>${utilisateur.prenom}</td>
        <td>${utilisateur.email}</td>
        <td>${utilisateur.role && utilisateur.role.nom ? utilisateur.role.nom : 'Non défini'}</td>
        <td>
          <span class="badge ${utilisateur.statut ? 'bg-success' : 'bg-danger'}">
            ${utilisateur.statut ? 'Actif' : 'Inactif'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-primary btn-edit" data-id="${utilisateur.idUtilisateur}">
            <i class="bi bi-pencil"></i> Modifier
          </button>
          ${utilisateur.statut ?
                `<button class="btn btn-sm btn-danger btn-deactivate" data-id="${utilisateur.idUtilisateur}">
              <i class="bi bi-trash"></i> Désactiver
            </button>` : ''}
        </td>
      `;

            tableBody.appendChild(row);
        });

        // Ajouter les gestionnaires d'événements aux boutons
        addTableButtonsEventListeners();
    }

    // Configuration des écouteurs d'événements
    function setupEventListeners() {
        // Vérifier si les éléments existent avant d'ajouter des écouteurs
        const btnAddUtilisateur = document.getElementById('btnAddUtilisateur');
        const saveUtilisateur = document.getElementById('saveUtilisateur');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        if (btnAddUtilisateur) {
            btnAddUtilisateur.addEventListener('click', () => {
        // Bouton pour ouvrir le modal d'ajout d'utilisateur
        document.getElementById('btnAddUtilisateur').addEventListener('click', () => {
            document.getElementById('utilisateurModalLabel').textContent = 'Ajouter un utilisateur';
            document.getElementById('utilisateurForm').reset();
            document.getElementById('idUtilisateur').value = '';

            const utilisateurModal = new bootstrap.Modal(document.getElementById('utilisateurModal'));
            utilisateurModal.show();
        });

        // Bouton pour enregistrer un utilisateur (ajout ou modification)
        document.getElementById('saveUtilisateur').addEventListener('click', saveUtilisateur);

        // Bouton pour confirmer la désactivation
        document.getElementById('confirmDeleteBtn').addEventListener('click', desactiverUtilisateur);
            });
        }

        if (saveUtilisateur) {
            saveUtilisateur.addEventListener('click', saveUtilisateur);
        }

        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', desactiverUtilisateur);
        }
    }


    // Ajouter les écouteurs d'événements aux boutons du tableau
    function addTableButtonsEventListeners() {
        // Boutons de modification
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', function() {
                const utilisateurId = this.getAttribute('data-id');
                chargerUtilisateurPourModification(utilisateurId);
            });
        });

        // Boutons de désactivation
        document.querySelectorAll('.btn-deactivate').forEach(button => {
            button.addEventListener('click', function() {
                selectedUtilisateurId = this.getAttribute('data-id');
                const deleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
                deleteModal.show();
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
            document.getElementById('role').value = utilisateur.role.idRole;

            const utilisateurModal = new bootstrap.Modal(document.getElementById('utilisateurModal'));
            utilisateurModal.show();
        }
    }

    // Enregistrer un utilisateur (ajout ou modification)
    function saveUtilisateur() {
        const idUtilisateur = document.getElementById('idUtilisateur').value;
        const isUpdate = idUtilisateur !== '';

        // Récupérer les données du formulaire
        const utilisateurData = {
            nom: document.getElementById('nom').value,
            prenom: document.getElementById('prenom').value,
            email: document.getElementById('email').value,
            role: {
                idRole: parseInt(document.getElementById('role').value)
            }
        };

        // Ajouter l'ID si c'est une modification
        if (isUpdate) {
            utilisateurData.idUtilisateur = parseInt(idUtilisateur);
        }

        // URL et méthode en fonction de l'action (ajout ou modification)
        const url = isUpdate ? `http://localhost:8082/utilisateurs/modifier-utilisateur/${idUtilisateur}` : 'http://localhost:8082/utilisateurs';
        const method = isUpdate ? 'PUT' : 'POST';

        // Envoyer la requête
        fetch(url, {
            method: method,
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
                return response.json();
            })
            .then(data => {
                bootstrap.Modal.getInstance(document.getElementById('utilisateurModal')).hide();
                showToast('Succès', `Utilisateur ${isUpdate ? 'modifié' : 'ajouté'} avec succès`, 'success');
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