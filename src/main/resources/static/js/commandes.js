document.addEventListener('DOMContentLoaded', function() {
    // Initialise un conteneur pour les notifications toast
    function initToast() {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Affiche une notification toast personnalisée
    function showToast(message, type = 'success') {
        // Crée l'élément toast avec le type et le message spécifiés
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        // Structure HTML du toast avec message et bouton de fermeture
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        // Ajoute et affiche le toast
        const toastContainer = document.getElementById('toastContainer');
        toastContainer.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Supprime le toast après sa fermeture
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Formate une date au format français
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Formate une date ISO pour les champs de formulaire date
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    // Détermine l'état visuel d'une commande
    function getEtatCommande(commande) {
        // Génère un badge de couleur basé sur l'état du dossier
        if (commande.dossierComplet) {
            return '<span class="badge bg-success">Complet</span>';
        }
        return '<span class="badge bg-warning">En cours</span>';
    }

    // Stocke toutes les commandes pour le filtrage
    let allCommandes = [];

    // Configuration de la pagination
    let currentPage = 1;
    const rowsPerPage = 10;
    let totalPages = 0;
    let filteredCommandes = [];

    // Filtre dynamique des commandes
    function filterCommandes() {
        // Récupère les valeurs des filtres
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const directionFilter = document.getElementById('directionFilter').value;
        const etatFilter = document.getElementById('etatFilter').value;

        // Applique les filtres multi-critères
        filteredCommandes = allCommandes.filter(commande => {
            // Recherche globale sur toutes les colonnes
            const searchMatch = searchTerm ? Object.values(commande).some(value =>
                String(value).toLowerCase().includes(searchTerm)
            ) : true;

            // Filtre par direction
            const directionMatch = directionFilter ?
                commande.directionGBM === directionFilter : true;

            // Filtre par état (Complet/En cours)
            const etatMatch = etatFilter ?
                (etatFilter === 'Complet' ? commande.dossierComplet : !commande.dossierComplet) : true;

            // Combine tous les filtres
            return searchMatch && directionMatch && etatMatch;
        });

        // Réinitialise la pagination à la première page quand on filtre
        currentPage = 1;
        totalPages = Math.ceil(filteredCommandes.length / rowsPerPage);

        // Affiche les commandes filtrées pour la page courante
        renderCommandesPage();
    }

    // Peuple le menu déroulant des directions
    function populateDirectionFilter(commandes) {
        const directionFilter = document.getElementById('directionFilter');

        // Extrait les directions uniques
        const directions = [...new Set(commandes.map(c => c.directionGBM).filter(Boolean))];

        // Ajoute chaque direction comme option
        directions.forEach(direction => {
            const option = document.createElement('option');
            option.value = direction;
            option.textContent = direction;
            directionFilter.appendChild(option);
        });
    }

    // Affiche les commandes de la page courante
    function renderCommandesPage() {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const currentPageCommandes = filteredCommandes.slice(startIndex, endIndex);

        renderCommandes(currentPageCommandes);
        updatePaginationControls();
    }

    // Met à jour les contrôles de pagination
    function updatePaginationControls() {
        const paginationContainer = document.getElementById('paginationContainer');
        totalPages = Math.ceil(filteredCommandes.length / rowsPerPage);

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        // Crée la structure HTML de la pagination
        let paginationHTML = `
            <nav aria-label="Navigation des pages de commandes">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="prev" aria-label="Précédent">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
        `;

        // Affiche les numéros de page
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        paginationHTML += `
                    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="next" aria-label="Suivant">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                </ul>
            </nav>
            <div class="text-center text-muted">
                <small>Affichage de ${(currentPage - 1) * rowsPerPage + 1} à ${Math.min(currentPage * rowsPerPage, filteredCommandes.length)} sur ${filteredCommandes.length} commandes</small>
            </div>
        `;

        paginationContainer.innerHTML = paginationHTML;

        // Ajoute les gestionnaires d'événements pour les liens de pagination
        document.querySelectorAll('.pagination .page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.getAttribute('data-page');

                if (page === 'prev') {
                    if (currentPage > 1) currentPage--;
                } else if (page === 'next') {
                    if (currentPage < totalPages) currentPage++;
                } else {
                    currentPage = parseInt(page);
                }

                renderCommandesPage();
            });
        });
    }

    // Génère le tableau des commandes
    function renderCommandes(commandes) {
        const commandesBody = document.getElementById('commandesBody');
        commandesBody.innerHTML = '';

        // Gère le cas où aucune commande n'est trouvée
        if (commandes.length === 0) {
            commandesBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">
                        Aucune commande trouvée
                    </td>
                </tr>
            `;
            return;
        }

        // Crée les lignes du tableau pour chaque commande
        const rows = commandes.map(commande => {
            // N'affiche le bouton de modification que pour les commandes "En cours"
            const actionButtons = commande.dossierComplet ?
                `<button class="btn btn-sm btn-info" onclick="voirDetailsCommande(${commande.idCommande})">
                    <i class="fas fa-eye"></i>
                </button>` :
                `<div class="btn-group" role="group">
                    <button class="btn btn-sm btn-info" onclick="voirDetailsCommande(${commande.idCommande})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="modifierCommande(${commande.idCommande})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>`;

            return `
                <tr>
                    <td>${formatDate(commande.dateModification)}</td>
                    <td>${commande.raisonSocialeFournisseur || 'N/A'}</td>
                    <td>${commande.raisonSocialeGBM || 'N/A'}</td>
                    <td>${commande.numeroBC || 'N/A'}</td>
                    <td>${commande.directionGBM || 'N/A'}</td>
                    <td>${commande.souscripteur || 'N/A'}</td>
                    <td>${commande.typeDocument || 'N/A'}</td>
                    <td>${getEtatCommande(commande)}</td>
                    <td>${actionButtons}</td>
                </tr>
            `;
        }).join('');

        // Insère les lignes dans le tableau
        commandesBody.innerHTML = rows;
    }

    // Charge les commandes depuis l'API
    async function chargerCommandes() {
        try {
            // Vérifie l'authentification de l'utilisateur
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
            if (!userInfo || !userInfo.email) {
                throw new Error('Utilisateur non authentifié');
            }

            // Requête API pour récupérer les commandes
            const response = await fetch('http://localhost:8082/BO/commandes', {
                method: 'GET',
                headers: {
                    'Authorization': userInfo.email
                }
            });

            // Stocke toutes les commandes
            allCommandes = await response.json();
            filteredCommandes = [...allCommandes];
            totalPages = Math.ceil(filteredCommandes.length / rowsPerPage);

            // Supprime l'indicateur de chargement
            const loadingRow = document.getElementById('loadingRow');
            if (loadingRow) {
                loadingRow.remove();
            }

            // Prépare l'interface de filtrage
            populateDirectionFilter(allCommandes);
            renderCommandesPage();

            // Configure les écouteurs d'événements pour le filtrage
            document.getElementById('searchInput').addEventListener('input', _.debounce(filterCommandes, 300));
            document.getElementById('directionFilter').addEventListener('change', filterCommandes);
            document.getElementById('etatFilter').addEventListener('change', filterCommandes);

            // Gère la réinitialisation des filtres
            document.getElementById('resetFilters').addEventListener('click', () => {
                document.getElementById('searchInput').value = '';
                document.getElementById('directionFilter').value = '';
                document.getElementById('etatFilter').value = '';
                filteredCommandes = [...allCommandes];
                currentPage = 1;
                totalPages = Math.ceil(filteredCommandes.length / rowsPerPage);
                renderCommandesPage();
            });

        } catch (error) {
            // Gestion des erreurs de chargement
            console.error('Erreur lors du chargement des commandes:', error);
            showToast(error.message, 'danger');
        }
    }

    // Charge les détails d'une commande pour le modal
    async function chargerDetailsCommande(idCommande) {
        try {
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
            if (!userInfo || !userInfo.email) {
                throw new Error('Utilisateur non authentifié');
            }

            const response = await fetch(`http://localhost:8082/BO/commandes/${idCommande}`, {
                method: 'GET',
                headers: {
                    'Authorization': userInfo.email
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors du chargement de la commande');
            }

            return await response.json();

        } catch (error) {
            console.error('Erreur lors du chargement des détails de la commande:', error);
            showToast(error.message, 'danger');
            throw error;
        }
    }

    // Met à jour une commande existante
    async function mettreAJourCommande(idCommande, formData) {
        try {
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
            if (!userInfo || !userInfo.email) {
                throw new Error('Utilisateur non authentifié');
            }

            // Effectuer la requête AJAX
            const response = await fetch(`http://localhost:8082/BO/commandes/${idCommande}/modifier`, {
                method: 'PUT',
                headers: {
                    'Authorization': userInfo.email
                    // Supprimer le header 'Content-Type' pour permettre à FormData de définir sa propre boundary
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour de la commande');
            }

            const data = await response.json();
            showToast('Commande mise à jour avec succès', 'success');

            // Rafraîchir la liste des commandes
            chargerCommandes();

            return data;

        } catch (error) {
            console.error('Erreur lors de la mise à jour de la commande:', error);
            showToast(error.message, 'danger');
            throw error;
        }
    }

    // Remplir le modal de modification avec les données de la commande
    function remplirModalModification(commande) {
        // Remplir les champs du formulaire
        document.getElementById('modif-raisonSocialeFournisseur').value = commande.raisonSocialeFournisseur || '';
        document.getElementById('modif-numeroBC').value = commande.numeroBC || '';
        document.getElementById('modif-numeroBC').disabled = true; // Le numéro BC ne peut pas être modifié
        document.getElementById('modif-directionGBM').value = commande.directionGBM || '';
        document.getElementById('modif-typeDocument').value = commande.typeDocument || '';
        document.getElementById('modif-dateRelanceBR').value = formatDateForInput(commande.dateRelanceBR);
        document.getElementById('modif-dateTransmission').value = formatDateForInput(commande.dateTransmission);
        document.getElementById('modif-raisonSocialeGBM').value = commande.raisonSocialeGBM || '';
        document.getElementById('modif-souscripteur').value = commande.souscripteur || '';

        // Type de relance (select)
        const typeRelanceSelect = document.getElementById('modif-typeRelance');
        if (commande.typeRelance) {
            Array.from(typeRelanceSelect.options).forEach(option => {
                if (option.value === commande.typeRelance) {
                    option.selected = true;
                }
            });
        }

        document.getElementById('modif-personnesCollectrice').value = commande.personnesCollectrice || '';
        document.getElementById('modif-dossierComplet').checked = commande.dossierComplet;

        // Ajouter l'ID de la commande comme attribut de données au formulaire
        document.getElementById('formModifierCommande').setAttribute('data-commande-id', commande.idCommande);
    }

    // Fonctions globales pour les actions sur les commandes

    window.voirDetailsCommande = function(idCommande) {
        window.location.href = `details.html?id=${idCommande}`;
    }

    window.modifierCommande = async function(idCommande) {
        try {
            // Récupérer les détails de la commande
            const commande = await chargerDetailsCommande(idCommande);

            // Vérifier si la commande est complète (ne devrait pas arriver car le bouton est masqué)
            if (commande.dossierComplet) {
                showToast('Les commandes avec état "Complet" ne peuvent pas être modifiées', 'warning');
                return;
            }

            // Remplir le modal avec les données
            remplirModalModification(commande);

            // Afficher le modal
            const modalModifier = new bootstrap.Modal(document.getElementById('modalModifierCommande'));
            modalModifier.show();

        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la modification:', error);
        }
    }

    // Initialisation du modal et de son formulaire
    function initModalModification() {
        const formModifierCommande = document.getElementById('formModifierCommande');

        formModifierCommande.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Récupérer l'ID de la commande depuis l'attribut data
            const idCommande = this.getAttribute('data-commande-id');

            // Créer un FormData à partir du formulaire
            const formData = new FormData(this);

            try {
                // Envoyer la requête de mise à jour
                await mettreAJourCommande(idCommande, formData);

                // Fermer le modal
                const modalModifier = bootstrap.Modal.getInstance(document.getElementById('modalModifierCommande'));
                modalModifier.hide();

            } catch (error) {
                console.error('Erreur lors de la soumission du formulaire:', error);
            }
        });
    }

    // Initialisation de l'interface
    initToast();
    chargerCommandes();
    initModalModification();

    // Affiche le nom de l'utilisateur connecté
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (userInfo) {
        const userNameElement = document.getElementById('userName');
        userNameElement.textContent = userInfo.prenom + ' ' + userInfo.nom;
    }


    // Dans commandes.js
    function afficherErreurMiseAJour(message) {
        const alertElement = document.getElementById('updateErrorAlert');
        const messageElement = document.getElementById('updateErrorMessage');

        messageElement.textContent = message;
        alertElement.classList.add('show');
        alertElement.style.display = 'block';

        // Masquer après 5 secondes
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => {
                alertElement.style.display = 'none';
            }, 300);
        }, 5000);
    }

// Puis dans la fonction de soumission du formulaire
    formModifierCommande.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Récupérer l'ID de la commande depuis l'attribut data
        const idCommande = this.getAttribute('data-commande-id');

        // Créer un FormData à partir du formulaire
        const formData = new FormData(this);

        try {
            // Envoyer la requête de mise à jour
            await mettreAJourCommande(idCommande, formData);

            // Fermer le modal
            const modalModifier = bootstrap.Modal.getInstance(document.getElementById('modalModifierCommande'));
            modalModifier.hide();

        } catch (error) {
            console.error('Erreur lors de la soumission du formulaire:', error);
            afficherErreurMiseAJour(error.message);
        }
    });
});