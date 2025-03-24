/**
 * Suivi des Remises et Chèques - Gestion des règlements
 */
// Variables globales pour la gestion de la pagination et du tri
let allReglements = [];
let filteredReglements = [];
let currentPageTresorerie = 1;
const rowsPerPageTresorerie = 10;
let totalPagesTresorerie = 0;
let currentSortTresorerie = {
    column: 'datePreparation',
    direction: 'desc'
};

// Fonction pour charger les règlements depuis l'API
async function chargerReglements() {
    // Afficher l'indicateur de chargement
    const reglementsBody = document.getElementById('reglementsBody');
    reglementsBody.innerHTML = `
        <tr id="loadingRowTresorerie">
            <td colspan="10" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p>Chargement des règlements...</p>
            </td>
        </tr>
    `;

    try {
        // Vérifier l'authentification
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.email) {
            throw new Error('Utilisateur non authentifié');
        }

        console.log("Récupération des règlements avec email:", userInfo.email);

        // Utiliser l'endpoint pour les règlements
        const response = await fetch('http://localhost:8082/api/reglements', {
            method: 'GET',
            headers: {
                'Authorization': userInfo.email,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Erreur de réponse:", response.status, errorText);
            throw new Error(`Erreur ${response.status}: ${errorText || response.statusText}`);
        }

        // Stocker tous les règlements
        const allReglementsData = await response.json();

        // Filtrer pour ne garder que les règlements validés
        allReglements = allReglementsData.filter(reglement =>
            reglement.etatEnCoursValideEtc &&
            reglement.etatEnCoursValideEtc.toLowerCase() === 'validé'
        );

        // Supprimer l'indicateur de chargement
        const loadingRow = document.getElementById('loadingRowTresorerie');
        if (loadingRow) {
            loadingRow.remove();
        }

        // Initialiser les règlements filtrés avec tous les règlements validés
        filteredReglements = [...allReglements];

        // Calculer le nombre total de pages
        totalPagesTresorerie = Math.ceil(filteredReglements.length / rowsPerPageTresorerie);

        // Préremplir les options du filtre de mode de règlement si elles ne sont pas déjà définies
        const modeReglementFilter = document.getElementById('modeReglementFilter');
        if (modeReglementFilter) {
            // Collecte des modes de règlement existants dans les données
            const modesReglement = [...new Set(allReglements
                .filter(r => r.modeReglement)
                .map(r => r.modeReglement.toLowerCase()))];

            // Vérifier si nous avons déjà des options définies manuellement
            const optionsExistantes = modeReglementFilter.options.length;
            if (optionsExistantes <= 1) { // Seulement l'option "Tous les modes"
                modesReglement.sort().forEach(mode => {
                    const option = document.createElement('option');
                    option.value = mode;
                    option.textContent = mode.charAt(0).toUpperCase() + mode.slice(1); // Première lettre en majuscule
                    modeReglementFilter.appendChild(option);
                });
            }
        }

        // Trier les données selon le tri par défaut
        sortReglements(currentSortTresorerie.column, currentSortTresorerie.direction);

        // Mettre à jour l'interface utilisateur
        renderReglementsPage();

        // Mettre à jour les icônes de tri
        updateSortIconsTresorerie(currentSortTresorerie.column, currentSortTresorerie.direction);

    } catch (error) {
        console.error('Erreur lors du chargement des règlements:', error);
        const reglementsBody = document.getElementById('reglementsBody');
        reglementsBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erreur: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Fonction pour filtrer les règlements
function filterReglements() {
    const searchTerm = document.getElementById('searchInputTresorerie').value.toLowerCase();
    const modeReglement = document.getElementById('modeReglementFilter').value.toLowerCase();

    console.log(`Filtrage des règlements - searchTerm: ${searchTerm}, modeReglement: ${modeReglement}`);

    // Filtrer les règlements
    filteredReglements = allReglements.filter(reglement => {
        // Recherche texte dans toutes les propriétés
        const searchMatch = searchTerm ? Object.entries(reglement).some(([key, value]) => {
            // Vérifier aussi les propriétés imbriquées (comme commande)
            if (key === 'commande' && value) {
                return Object.values(value).some(v =>
                    v && String(v).toLowerCase().includes(searchTerm)
                );
            }
            return value && String(value).toLowerCase().includes(searchTerm);
        }) : true;

        // Filtrage par mode de règlement
        let modeReglementMatch = true;
        if (modeReglement) {
            modeReglementMatch = reglement.modeReglement &&
                reglement.modeReglement.toLowerCase() === modeReglement;
        }

        return searchMatch && modeReglementMatch;
    });

    // Réinitialiser la pagination
    currentPageTresorerie = 1;
    totalPagesTresorerie = Math.ceil(filteredReglements.length / rowsPerPageTresorerie);

    // Trier et afficher les résultats
    sortReglements(currentSortTresorerie.column, currentSortTresorerie.direction);
    renderReglementsPage();
}

// Fonction pour trier les règlements
function sortReglements(column, direction) {
    currentSortTresorerie.column = column;
    currentSortTresorerie.direction = direction;

    filteredReglements.sort((a, b) => {
        let valA, valB;

        // Gestion des propriétés imbriquées (commande.directionGBM, commande.numeroBC, etc.)
        if (column === 'directionGBM') {
            valA = a.commande && a.commande.directionGBM ? a.commande.directionGBM : '';
            valB = b.commande && b.commande.directionGBM ? b.commande.directionGBM : '';
        } else if (column === 'raisonSocialeFournisseur') {
            valA = a.commande && a.commande.raisonSocialeFournisseur ? a.commande.raisonSocialeFournisseur : '';
            valB = b.commande && b.commande.raisonSocialeFournisseur ? b.commande.raisonSocialeFournisseur : '';
        } else if (column === 'numeroBC') {
            valA = a.commande && a.commande.numeroBC ? a.commande.numeroBC : '';
            valB = b.commande && b.commande.numeroBC ? b.commande.numeroBC : '';
        } else {
            valA = a[column];
            valB = b[column];
        }

        // Traitement selon le type de données
        if (column.includes('date')) {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
        } else {
            valA = valA ? String(valA).toLowerCase() : '';
            valB = valB ? String(valB).toLowerCase() : '';
        }

        // Appliquer la direction du tri
        if (direction === 'asc') {
            return valA > valB ? 1 : valA < valB ? -1 : 0;
        } else {
            return valA < valB ? 1 : valA > valB ? -1 : 0;
        }
    });
}

// Mettre à jour les icônes de tri
function updateSortIconsTresorerie(column, direction) {
    // Réinitialiser toutes les icônes
    document.querySelectorAll('#tableReglements th.sortable i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });

    // Mettre à jour l'icône pour la colonne triée
    const headerCell = document.querySelector(`#tableReglements th[data-sort="${column}"] i`);
    if (headerCell) {
        headerCell.className = direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
}

// Afficher les règlements de la page courante
function renderReglementsPage() {
    const startIndex = (currentPageTresorerie - 1) * rowsPerPageTresorerie;
    const endIndex = startIndex + rowsPerPageTresorerie;
    const currentPageReglements = filteredReglements.slice(startIndex, endIndex);

    renderReglements(currentPageReglements);
    updatePaginationControlsTresorerie();
}

// Générer le contenu du tableau des règlements
function renderReglements(reglements) {
    const reglementsBody = document.getElementById('reglementsBody');
    reglementsBody.innerHTML = '';

    // Aucun règlement trouvé
    if (reglements.length === 0) {
        reglementsBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-muted py-4">
                    Aucun règlement trouvé
                </td>
            </tr>
        `;
        return;
    }

    // Créer les lignes pour chaque règlement
    const rows = reglements.map(reglement => {
        // Récupérer les données à partir des propriétés imbriquées
        const numeroBC = reglement.commande && reglement.commande.numeroBC ? reglement.commande.numeroBC : '-';
        const directionGBM = reglement.commande && reglement.commande.directionGBM ? reglement.commande.directionGBM : '-';
        const fournisseur = reglement.commande && reglement.commande.raisonSocialeFournisseur ? reglement.commande.raisonSocialeFournisseur : '-';

        return `
            <tr>
                <td>${numeroBC}</td>
                <td>${formatDate(reglement.datePreparation)}</td>
                <td>${reglement.modeReglement || '-'}</td>
                <td>${reglement.numeroCheque || '-'}</td>
                <td>${formatDate(reglement.dateTransmission)}</td>
                <td>${directionGBM}</td>
                <td>${fournisseur}</td>
                <td>${reglement.commentaire || '-'}</td>
                <td class="text-center">${reglement.fichierJoint ?
            `<a href="#" onclick="voirFichierReglement(${reglement.idReglement}); return false;" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-eye"></i>
                </a>` : '-'}
                </td>
                <td class="text-center">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-secondary" 
                                onclick="detailsReglement(${reglement.idReglement})">
                            <i class="fas fa-info-circle"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-warning"
                                ${reglement.etatEnCoursValideEtc !== 'Validé' ? '' : 'disabled'}>
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    reglementsBody.innerHTML = rows;
}

// Mettre à jour les contrôles de pagination
function updatePaginationControlsTresorerie() {
    const paginationContainer = document.getElementById('paginationContainerTresorerie');
    totalPagesTresorerie = Math.ceil(filteredReglements.length / rowsPerPageTresorerie);

    if (totalPagesTresorerie <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    // Créer les contrôles de pagination
    let paginationHTML = `
        <nav aria-label="Navigation des pages de règlements">
            <ul class="pagination justify-content-center">
                <li class="page-item ${currentPageTresorerie === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="prev" aria-label="Précédent">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
    `;

    // Afficher les numéros de page
    let startPage = Math.max(1, currentPageTresorerie - 2);
    let endPage = Math.min(totalPagesTresorerie, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPageTresorerie ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    paginationHTML += `
                <li class="page-item ${currentPageTresorerie === totalPagesTresorerie ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="next" aria-label="Suivant">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>
            </ul>
        </nav>
        <div class="text-center text-muted">
            <small>Affichage de ${(currentPageTresorerie - 1) * rowsPerPageTresorerie + 1} à ${Math.min(currentPageTresorerie * rowsPerPageTresorerie, filteredReglements.length)} sur ${filteredReglements.length} règlements</small>
        </div>
    `;

    paginationContainer.innerHTML = paginationHTML;

    // Ajouter les gestionnaires d'événements pour la pagination
    document.querySelectorAll('#paginationContainerTresorerie .pagination .page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');

            if (page === 'prev') {
                if (currentPageTresorerie > 1) currentPageTresorerie--;
            } else if (page === 'next') {
                if (currentPageTresorerie < totalPagesTresorerie) currentPageTresorerie++;
            } else {
                currentPageTresorerie = parseInt(page);
            }

            renderReglementsPage();
        });
    });
}

// Fonction pour voir le fichier joint d'un règlement
window.voirFichierReglement = function(idReglement) {
    try {
        // Récupérer les informations de l'utilisateur connecté
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.email) {
            showToast('Utilisateur non authentifié', 'danger');
            throw new Error('Utilisateur non authentifié');
        }

        // URL pour récupérer le fichier
        const url = `http://localhost:8082/api/reglements/fichier/${idReglement}`;

        // Créer une requête fetch avec le header d'autorisation
        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': userInfo.email
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération du fichier: ' + response.status);
                }
                return response.blob();
            })
            .then(blob => {
                // Créer une URL pour le blob et l'ouvrir dans un nouvel onglet
                const fileURL = URL.createObjectURL(blob);
                window.open(fileURL, '_blank');
            })
            .catch(error => {
                console.error('Erreur lors de l\'ouverture du fichier:', error);
                showToast(error.message || "Une erreur est survenue", 'danger');
            });
    } catch (error) {
        console.error('Erreur lors de l\'ouverture du fichier:', error);
        showToast(error.message || "Une erreur est survenue", 'danger');
    }
};

// Fonction pour afficher les détails d'un règlement
window.detailsReglement = function(idReglement) {
    console.log(`Affichage des détails pour le règlement #${idReglement}`);
    // Implémentation à venir - pourrait ouvrir une modal avec les détails
    showToast(`Détails du règlement #${idReglement}`, 'info');
};

// Fonction pour afficher un toast (notification)
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = 'toast-' + Date.now();

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button>
        </div>
    `;

    toastContainer.appendChild(toast);

    const toastElement = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 5000
    });

    toastElement.show();

    // Nettoyer après que le toast soit masqué
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// Fonction pour formater une date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Initialisation lors du chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Charger les règlements
    chargerReglements();

    // Configurer les filtres et la recherche
    document.getElementById('searchInputTresorerie').addEventListener('input', _.debounce(filterReglements, 300));
    document.getElementById('modeReglementFilter').addEventListener('change', filterReglements);

    // Configurer le bouton de réinitialisation des filtres
    document.getElementById('resetFiltersTresorerie').addEventListener('click', function() {
        document.getElementById('searchInputTresorerie').value = '';
        document.getElementById('modeReglementFilter').value = '';

        filteredReglements = [...allReglements];
        currentPageTresorerie = 1;
        sortReglements('datePreparation', 'desc');
        updateSortIconsTresorerie('datePreparation', 'desc');
        renderReglementsPage();
    });

    // Configurer le tri par colonne
    document.querySelectorAll('#tableReglements th.sortable').forEach(header => {
        header.addEventListener('click', function() {
            const column = this.getAttribute('data-sort');
            const direction = (column === currentSortTresorerie.column && currentSortTresorerie.direction === 'desc')
                ? 'asc'
                : 'desc';

            sortReglements(column, direction);
            updateSortIconsTresorerie(column, direction);
            renderReglementsPage();
        });
    });
});