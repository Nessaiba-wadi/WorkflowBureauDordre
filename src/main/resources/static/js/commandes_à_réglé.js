// Variables globales
let commandesData = [];
let currentPage = 1;
const itemsPerPage = 10;
let filteredCommandes = [];
let distinctDirections = [];

// Au chargement du document
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification et charger les commandes
    if (isAuthenticated()) {
        loadCommandesComptabilisees();
    } else {
        window.location.href = '/login';
    }

    // Initialiser les écouteurs d'événements
    initEventListeners();
});

// Charger les commandes comptabilisées depuis l'API
function loadCommandesComptabilisees() {
    console.log('Chargement des commandes...');
    fetch('http://localhost:8082/api/reglements/commandes-comptabilisees')
        .then(response => {
            console.log('Réponse reçue:', response.status);
            if (!response.ok) {
                if (response.status === 204) {
                    // Aucune commande trouvée, afficher un message
                    displayNoCommandesMessage();
                    return [];
                }
                throw new Error('Erreur lors de la récupération des commandes comptabilisées');
            }
            return response.json();
        })
        .then(data => {
            if (data && data.length > 0) {
                commandesData = data;

                // Récupérer le statut de règlement pour chaque commande
                return getReglementsStatuses(data.map(commande => commande.idCommande));
            } else {
                commandesData = [];
                return {};
            }
        })
        .then(reglementsStatuses => {
            // Fusionner les données de règlement avec les commandes
            commandesData.forEach(commande => {
                commande.reglementStatus = reglementsStatuses[commande.idCommande] || 'non-regle';
            });

            // Initialiser les filtres et afficher les commandes
            initializeFilters();
            applyFilters();
        })
        .catch(error => {
            console.error('Erreur:', error);
            showToast('Erreur lors du chargement des commandes', 'danger');
        })
        .finally(() => {
            // Masquer l'indicateur de chargement
            document.getElementById('loadingRow').style.display = 'none';
        });
}

// Récupérer le statut de règlement pour une liste d'IDs de commandes
// Modifier cette fonction pour normaliser les statuts
// Récupérer le statut de règlement pour une liste d'IDs de commandes
function getReglementsStatuses(commandeIds) {
    return fetch('http://localhost:8082/api/reglements/statuses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': JSON.parse(sessionStorage.getItem('userInfo')).email
        },
        body: JSON.stringify(commandeIds)
    })
        .then(response => {
            if (!response.ok) {
                return {};
            }
            return response.json();
        })
        .then(statuses => {
            // Normaliser les statuts - convertir "validé" en "valide"
            const normalizedStatuses = {};
            for (const id in statuses) {
                if (statuses[id] === "validé") {
                    normalizedStatuses[id] = "valide";
                } else {
                    normalizedStatuses[id] = statuses[id];
                }
            }
            return normalizedStatuses;
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des statuts de règlement:', error);
            return {};
        });
}
// Initialiser les filtres avec les valeurs uniques
function initializeFilters() {
    // Extraire les directions uniques
    distinctDirections = [...new Set(commandesData.map(item => item.directionGBM).filter(Boolean))];

    // Remplir le dropdown des directions
    const directionFilter = document.getElementById('directionFilter');
    distinctDirections.forEach(direction => {
        const option = document.createElement('option');
        option.value = direction;
        option.textContent = direction;
        directionFilter.appendChild(option);
    });
}

// Initialiser les écouteurs d'événements
function initEventListeners() {
    // Recherche
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));

    // Filtres
    document.getElementById('directionFilter').addEventListener('change', applyFilters);
    document.getElementById('comptabilisationFilter').addEventListener('change', applyFilters);

    // Réinitialisation des filtres
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
}

// Appliquer les filtres et recherches
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const directionFilter = document.getElementById('directionFilter').value;
    const comptabilisationFilter = document.getElementById('comptabilisationFilter').value;

    // Filtrer les commandes
    filteredCommandes = commandesData.filter(commande => {
        // Filtre de recherche
        const matchesSearch = Object.values(commande).some(value => {
            return value && typeof value === 'string' && value.toLowerCase().includes(searchTerm);
        });

        // Filtre de direction
        const matchesDirection = !directionFilter || commande.directionGBM === directionFilter;

        // Filtre de règlement
        let matchesReglementStatus = true;
        if (comptabilisationFilter === 'true') {
            matchesReglementStatus = commande.reglementStatus === 'valide';
        } else if (comptabilisationFilter === 'false') {
            matchesReglementStatus = commande.reglementStatus !== 'valide';
        }

        return matchesSearch && matchesDirection && matchesReglementStatus;
    });

    // Réinitialiser la pagination
    currentPage = 1;
    renderCommandes();
    renderPagination();
}

// Réinitialiser tous les filtres
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('directionFilter').selectedIndex = 0;
    document.getElementById('comptabilisationFilter').selectedIndex = 0;

    applyFilters();
}

// Afficher les commandes
function renderCommandes() {
    const tableBody = document.getElementById('commandesBody');
    tableBody.innerHTML = '';

    // Calculer les indices de début et de fin pour la pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredCommandes.length);

    // Si aucune commande n'est trouvée
    if (filteredCommandes.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="14" class="text-center">Aucune commande trouvée</td>`;
        tableBody.appendChild(noDataRow);
        return;
    }

    // Afficher les commandes pour la page actuelle
    for (let i = startIndex; i < endIndex; i++) {
        const commande = filteredCommandes[i];
        const row = document.createElement('tr');

        // Crypter l'ID de la commande
        const commandeEncodee = btoa(JSON.stringify({id: commande.idCommande}));

        // Formater les dates
        const dateReception = commande.dateTransmission ? new Date(commande.dateTransmission).toLocaleDateString('fr-FR') : '-';
        const dateRelanceBR = commande.dateRelanceBR ? new Date(commande.dateRelanceBR).toLocaleDateString('fr-FR') : '-';
        const dateTransmission = commande.dateTransmission ? new Date(commande.dateTransmission).toLocaleDateString('fr-FR') : '-';

        // Déterminer le statut de règlement et sa couleur
        let reglementStatus, reglementBadgeClass, isDisabled, reglementAction;
        if (commande.reglementStatus === 'valide' || commande.reglementStatus === 'validé') {
            reglementStatus = 'Réglée';
            reglementBadgeClass = 'bg-success';
            isDisabled = 'disabled';
            reglementAction = 'javascript:void(0)';
        } else {
            reglementStatus = 'À régler';
            reglementBadgeClass = 'bg-warning text-dark';
            isDisabled = '';
            reglementAction = `reglement.html?id=${commandeEncodee}`;
        }

        // Construire le contenu de la ligne
        row.innerHTML = `
            <td>${dateReception}</td>
            <td>${commande.raisonSocialeFournisseur || '-'}</td>
            <td>${commande.raisonSocialeGBM || '-'}</td>
            <td>${commande.numeroBC || '-'}</td>
            <td>${commande.directionGBM || '-'}</td>
            <td>${commande.souscripteur || '-'}</td>
            <td>${commande.typeDocument || '-'}</td>
            <td>${dateRelanceBR}</td>
            <td>${commande.typeRelance || '-'}</td>
            <td>${dateTransmission}</td>
            <td>${commande.personnesCollectrice || '-'}</td>
            <td>
                ${commande.fichierJoint ?
            `<a href="http://localhost:8082/api/files/${commande.fichierJoint}" target="_blank" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-file-download"></i>
                  </a>` :
            'Aucun fichier'}
            </td>
            <td>
                <a href="${reglementAction}" class="badge ${reglementBadgeClass} text-decoration-none w-100 py-2 d-inline-block text-center" ${isDisabled}>
                    <i class="fas fa-money-bill-wave me-1"></i> ${reglementStatus}
                </a>
            </td>
            <td>
                <a href="detailsReglement.html?id=${commandeEncodee}" class="btn btn-sm btn-info">
                    <i class="fas fa-eye"></i>
                </a>
            </td>
        `;

        tableBody.appendChild(row);
    }
}
// Afficher la pagination
function renderPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(filteredCommandes.length / itemsPerPage);

    if (totalPages <= 1) {
        return;
    }

    const pagination = document.createElement('nav');
    pagination.setAttribute('aria-label', 'Navigation des pages');

    const paginationList = document.createElement('ul');
    paginationList.className = 'pagination justify-content-center';

    // Bouton précédent
    const prevPageItem = document.createElement('li');
    prevPageItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevPageItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Précédent</a>`;
    paginationList.appendChild(prevPageItem);

    // Pages
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>`;
        paginationList.appendChild(pageItem);
    }

    // Bouton suivant
    const nextPageItem = document.createElement('li');
    nextPageItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextPageItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Suivant</a>`;
    paginationList.appendChild(nextPageItem);

    pagination.appendChild(paginationList);
    paginationContainer.appendChild(pagination);
}

// Changer de page
function changePage(page) {
    if (page < 1 || page > Math.ceil(filteredCommandes.length / itemsPerPage)) {
        return;
    }

    currentPage = page;
    renderCommandes();
    renderPagination();

    // Faire défiler vers le haut du tableau
    document.getElementById('commandesTable').scrollIntoView({ behavior: 'smooth' });
}

// Afficher un message quand aucune commande n'est trouvée
// Modifier la fonction displayNoCommandesMessage autour de la ligne 272
function displayNoCommandesMessage() {
    const tableBody = document.getElementById('commandesBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="14" class="text-center">
                <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle me-2"></i>
                    Aucune commande comptabilisée trouvée.
                </div>
            </td>
        </tr>
    `;
}

// Afficher un toast
function showToast(message, type = 'primary') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = 'toast-' + Date.now();

    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
            <div class="toast-header">
                <strong class="me-auto">Notification</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Fermer"></button>
            </div>
            <div class="toast-body bg-${type} text-${type === 'warning' || type === 'info' ? 'dark' : 'white'}">
                ${message}
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();

    // Supprimer le toast après qu'il disparaît
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// Afficher la modal pour régler une commande
function showReglementModal(commandeId) {
    // À implémenter - Ouvrir une modal pour régler la commande
    // Cette fonction pourrait appeler une API pour créer un nouveau règlement
    console.log(`Régler la commande ${commandeId}`);

    // Pour l'instant, juste montrer un toast
    showToast('Fonctionnalité de règlement à implémenter', 'info');
}

// Fonction de debounce pour limiter les appels de fonction lors de la recherche
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}