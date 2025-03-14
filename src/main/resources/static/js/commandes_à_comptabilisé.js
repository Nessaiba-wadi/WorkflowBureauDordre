document.addEventListener('DOMContentLoaded', function() {
    // Initialise un conteneur pour les notifications toast
    function initToast() {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(container);
        }
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
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
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
        const comptabilisationFilter = document.getElementById('comptabilisationFilter').value;

        // Applique les filtres multi-critères
        filteredCommandes = allCommandes.filter(commande => {
            // Recherche globale sur toutes les colonnes
            const searchMatch = searchTerm ? Object.values(commande).some(value =>
                String(value).toLowerCase().includes(searchTerm)
            ) : true;

            // Filtre par direction
            const directionMatch = directionFilter ?
                commande.directionGBM === directionFilter : true;

            // Filtre par état de comptabilisation (true/false)
            const comptaMatch = comptabilisationFilter ?
                String(commande.comptabilise) === comptabilisationFilter : true;

            // Combine tous les filtres
            return searchMatch && directionMatch && comptaMatch;
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
        directionFilter.innerHTML = '<option value="">Toutes les Directions</option>';

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
                <td colspan="14" class="text-center text-muted py-4">
                    Aucune commande trouvée
                </td>
            </tr>
        `;
            return;
        }

        // Crée les lignes du tableau pour chaque commande
        const rows = commandes.map(commande => {
            // Formatage de l'état de comptabilisation
            const comptaStatus = commande.comptabilise ?
                '<span class="badge bg-success">Oui</span>' :
                '<span class="badge bg-warning">Pas encore</span>';

            // Bouton d'action différent selon l'état de comptabilisation
            const actionButton = commande.comptabilise ?
                `<button class="btn btn-sm btn-info" onclick="voirDetailsCommande('${btoa(JSON.stringify({id: commande.idCommande}))}')" title="Voir les détails">
                <i class="fas fa-eye"></i>
            </button>` :
                `<button class="btn btn-sm btn-primary" onclick="creerComptabilisation('${btoa(JSON.stringify({id: commande.idCommande}))}')" title="Comptabiliser">
                <i class="fas fa-calculator"></i>
            </button>`;

            return `
            <tr>
                <td>${formatDate(commande.dateReception)}</td>
                <td>${commande.raisonSocialeFournisseur || '-'}</td>
                <td>${commande.raisonSocialeGBM || '-'}</td>
                <td>${commande.numeroBC || '-'}</td>
                <td>${commande.directionGBM || '-'}</td>
                <td>${commande.souscripteur || '-'}</td>
                <td>${commande.typeDocument || '-'}</td>
                <td>${formatDate(commande.dateRelanceBR)}</td>
                <td>${commande.typeRelance || '-'}</td>
                <td>${formatDate(commande.dateDossierComplet)}</td>
                <td>${formatDate(commande.dateTransmission)}</td>
                <td>${commande.personnesCollectrice || '-'}</td>
                <td>${comptaStatus}</td>
                <td>
                    ${actionButton}
                </td>
            </tr>
        `;
        }).join('');

        // Insère les lignes dans le tableau
        commandesBody.innerHTML = rows;
    }

    // Charge les commandes validées depuis l'API
    async function chargerCommandesValidees() {
        try {
            // Vérifie l'authentification de l'utilisateur
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
            if (!userInfo || !userInfo.email) {
                throw new Error('Utilisateur non authentifié');
            }

            // Requête API pour récupérer les commandes validées
            const response = await fetch('http://localhost:8082/comptabilisations/commandes-validees', {
                method: 'GET',
                headers: {
                    'Authorization': userInfo.email
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la récupération des commandes');
            }

            // Stocke toutes les commandes
            allCommandes = await response.json();

            // Trier les commandes par date de réception décroissante (plus récentes en premier)
            allCommandes.sort((a, b) => {
                const dateA = a.dateReception ? new Date(a.dateReception) : new Date(0);
                const dateB = b.dateReception ? new Date(b.dateReception) : new Date(0);
                return dateB - dateA; // Ordre décroissant
            });

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
            document.getElementById('comptabilisationFilter').addEventListener('change', filterCommandes);

            // Gère la réinitialisation des filtres
            document.getElementById('resetFilters').addEventListener('click', () => {
                document.getElementById('searchInput').value = '';
                document.getElementById('directionFilter').value = '';
                document.getElementById('comptabilisationFilter').value = '';
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

    // Fonction globale pour voir les détails d'une commande
    window.voirDetailsCommande = function(idCommande) {
        window.location.href = `details.html?id=${idCommande}`;
    }

    // Initialisation de l'interface
    initToast();
    chargerCommandesValidees();

    // Affiche le nom de l'utilisateur connecté
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (userInfo) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userInfo.prenom + ' ' + userInfo.nom;
        }
    }

    // Initialisation des tooltips Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Fonction globale pour voir les détails d'une commande
window.voirDetailsCommande = function(encodedData) {
    try {
        const data = JSON.parse(atob(encodedData));
        window.location.href = `details.html?ref=${btoa(JSON.stringify({id: data.id}))}`;
    } catch (error) {
        console.error('Erreur lors du décodage des données:', error);
        showToast('Erreur lors de l\'accès aux détails', 'danger');
    }
}

// Fonction globale pour créer une nouvelle comptabilisation
window.creerComptabilisation = function(encodedData) {
    try {
        const data = JSON.parse(atob(encodedData));
        window.location.href = `nouvelleComptabilisation.html?ref=${btoa(JSON.stringify({id: data.id}))}`;
    } catch (error) {
        console.error('Erreur lors du décodage des données:', error);
        showToast('Erreur lors de la création de comptabilisation', 'danger');
    }
}