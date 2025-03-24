/**
 * KPI
 */

// Fonction pour récupérer les statistiques des commandes
function chargerStatistiquesCommandes() {
    // Récupération des données depuis l'API
    fetch('http://localhost:8082/BO/commandes/statistiques')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des statistiques');
            }
            return response.json();
        })
        .then(data => {
            console.log("Données reçues:", data); // Pour déboguer

            // Mise à jour des compteurs avec le format "X/Total"
            document.getElementById('commandesComptabilisees').textContent = data.commandesComptabilisees + ' comptabilisées';
            document.getElementById('commandesEnAttente').textContent = 'En attente ' + data.commandesEnAttente + '/' + data.totalCommandes;
            document.getElementById('commandesValidees').textContent = 'Envoyées ' + data.commandesValidees + '/' + data.totalCommandes;
            document.getElementById('commandesCloturees').textContent = 'Clôturées ' + data.commandesCloturees + '/' + data.totalCommandes;
        })
        .catch(error => {
            console.error('Erreur:', error);

            // En cas d'erreur, afficher un message
            document.getElementById('commandesComptabilisees').textContent = 'Erreur de chargement';
            document.getElementById('commandesEnAttente').textContent = 'Erreur de chargement';
            document.getElementById('commandesValidees').textContent = 'Erreur de chargement';
            document.getElementById('commandesCloturees').textContent = 'Erreur de chargement';
        });
}

// Charger les statistiques au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log("Page chargée, chargement des statistiques...");
    chargerStatistiquesCommandes();
    chargerCommandesAvecPagination();  // commandes


    // Écouter l'événement "shown.bs.tab" qui est déclenché par Bootstrap
    // lorsqu'un onglet devient visible
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(function(button) {
        button.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target');

            // Si l'onglet comptabilité est activé
            if (targetId === '#comptabilite') {
                console.log("Onglet comptabilité activé, chargement des données...");
                chargerComptabilisationsAvecPagination();
            }
            // Vous pouvez ajouter d'autres conditions pour les autres onglets
        });
    });
    // Si l'onglet comptabilité est actif par défaut
    if (document.querySelector('#comptabilite.active')) {
        chargerComptabilisationsAvecPagination();
    }


    // Actualiser les données toutes les 5 minutes
    setInterval(chargerStatistiquesCommandes, 300000);
});


/**
 * Partie BO
 */
// Variables globales pour la gestion de la pagination et du tri
// Variables globales pour la gestion de la pagination et du tri
let allCommandes = [];
let filteredCommandes = [];
let currentPage = 1;
const rowsPerPage = 10;
let totalPages = 0;
let currentSort = {
    column: 'dateReception',
    direction: 'desc'
};

// Fonction pour formater les dates
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

// Fonction pour afficher l'état du dossier
function getEtatDossier(dossierComplet) {
    return dossierComplet ? 'Validé' : 'En cours';
}

// Filtrage des commandes
function filterCommandes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const dateExacte = document.getElementById('dateExacteFilter').value;
    const typeDate = document.getElementById('typeDateFilter').value;

    filteredCommandes = allCommandes.filter(commande => {
        // Recherche texte
        const searchMatch = searchTerm ? Object.values(commande).some(value =>
            value && String(value).toLowerCase().includes(searchTerm)
        ) : true;

        // Filtrage par date exacte
        let dateMatch = true;
        if (dateExacte) {
            const dateCommande = new Date(commande[typeDate]);
            // Formater la date commande sans l'heure pour une comparaison exacte par jour
            const dateCommandeFormatted = dateCommande.toISOString().split('T')[0];
            dateMatch = dateCommandeFormatted === dateExacte;
        }

        return searchMatch && dateMatch;
    });

    // Trier les commandes selon les critères actuels
    sortCommandes(currentSort.column, currentSort.direction);

    // Réinitialise la pagination
    currentPage = 1;
    totalPages = Math.ceil(filteredCommandes.length / rowsPerPage);

    // Affiche les résultats
    renderCommandesPage();
}

// Trier les commandes
function sortCommandes(column, direction) {
    currentSort.column = column;
    currentSort.direction = direction;

    // Tri par comparaison selon le type de donnée
    filteredCommandes.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Traitement selon le type de données
        if (column.includes('date')) {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
        } else if (typeof valA === 'boolean') {
            // Pas de conversion pour les booléens
        } else {
            valA = valA ? String(valA).toLowerCase() : '';
            valB = valB ? String(valB).toLowerCase() : '';
        }

        // Applique la direction du tri
        if (direction === 'asc') {
            return valA > valB ? 1 : valA < valB ? -1 : 0;
        } else {
            return valA < valB ? 1 : valA > valB ? -1 : 0;
        }
    });
}

// Mettre à jour les icônes de tri
function updateSortIcons(column, direction) {
    // Réinitialiser toutes les icônes
    document.querySelectorAll('th.sortable i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });

    // Mettre à jour l'icône pour la colonne triée
    const headerCell = document.querySelector(`th[data-sort="${column}"] i`);
    if (headerCell) {
        headerCell.className = direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
}

// Affiche les commandes de la page courante
function renderCommandesPage() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentPageCommandes = filteredCommandes.slice(startIndex, endIndex);

    renderCommandes(currentPageCommandes);
    updatePaginationControls();
}

// Générer le contenu du tableau
function renderCommandes(commandes) {
    const commandesBody = document.getElementById('commandesBody');
    commandesBody.innerHTML = '';

    // Aucune commande trouvée
    if (commandes.length === 0) {
        commandesBody.innerHTML = `
            <tr>
                <td colspan="12" class="text-center text-muted py-4">
                    Aucune commande trouvée
                </td>
            </tr>
        `;
        return;
    }

    // Créer les lignes pour chaque commande
    const rows = commandes.map(commande => {
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
                <td>${getEtatDossier(commande.dossierComplet)}</td>
                <td>${formatDate(commande.dateTransmission)}</td>
                <td>${commande.personnesCollectrice || '-'}</td>
            </tr>
        `;
    }).join('');

    commandesBody.innerHTML = rows;
}

// Mettre à jour les contrôles de pagination
function updatePaginationControls() {
    const paginationContainer = document.getElementById('paginationContainer');
    totalPages = Math.ceil(filteredCommandes.length / rowsPerPage);

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    // Créer les contrôles de pagination
    let paginationHTML = `
        <nav aria-label="Navigation des pages de commandes">
            <ul class="pagination justify-content-center">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="prev" aria-label="Précédent">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
    `;

    // Afficher les numéros de page
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

    // Ajouter les gestionnaires d'événements pour la pagination
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

// Charger les commandes depuis l'API
async function chargerCommandesAvecPagination() {
    try {
        // Vérifier l'authentification
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.email) {
            throw new Error('Utilisateur non authentifié');
        }

        // Récupérer les commandes
        const response = await fetch('http://localhost:8082/BO/commandes', {
            method: 'GET',
            headers: {
                'Authorization': userInfo.email
            }
        });

        // Stocker toutes les commandes
        allCommandes = await response.json();

        // Trier par date de réception décroissante par défaut
        sortCommandes('dateReception', 'desc');
        filteredCommandes = [...allCommandes];

        // Supprimer l'indicateur de chargement
        const loadingRow = document.getElementById('loadingRow');
        if (loadingRow) {
            loadingRow.remove();
        }

        // Afficher les commandes
        renderCommandesPage();
        updateSortIcons('dateReception', 'desc');

        // Configurer les écouteurs d'événements
        document.getElementById('searchInput').addEventListener('input', _.debounce(filterCommandes, 300));
        document.getElementById('dateExacteFilter').addEventListener('change', filterCommandes);
        document.getElementById('typeDateFilter').addEventListener('change', filterCommandes);

        // Réinitialiser les filtres
        document.getElementById('resetFilters').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            document.getElementById('dateExacteFilter').value = '';
            document.getElementById('typeDateFilter').value = 'dateReception';

            filteredCommandes = [...allCommandes];
            currentPage = 1;
            sortCommandes('dateReception', 'desc');
            updateSortIcons('dateReception', 'desc');
            renderCommandesPage();
        });

        // Ajouter le tri par en-tête de colonne
        document.querySelectorAll('th.sortable').forEach(header => {
            header.addEventListener('click', function() {
                const column = this.getAttribute('data-sort');
                // Inverser la direction si on clique sur la même colonne
                const direction = (column === currentSort.column && currentSort.direction === 'desc') ? 'asc' : 'desc';

                sortCommandes(column, direction);
                updateSortIcons(column, direction);
                renderCommandesPage();
            });
        });

    } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
        const commandesBody = document.getElementById('commandesBody');
        commandesBody.innerHTML = `
            <tr>
                <td colspan="12" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erreur: ${error.message}
                </td>
            </tr>
        `;
    }
}

/**
 * Partie Comptabilisation
 */
// Variables globales pour la gestion de la pagination et du tri des comptabilisations
let allComptabilisations = [];
let filteredComptabilisations = [];
let currentPageCompta = 1;
const rowsPerPageCompta = 10;
let totalPagesCompta = 0;
let currentSortCompta = {
    column: 'dateComptabilisation',
    direction: 'desc'
};

// Charger les comptabilisations depuis l'API
async function chargerComptabilisationsAvecPagination() {
    // Afficher l'indicateur de chargement
    const comptabilisationsBody = document.getElementById('comptabilisationsBody');
    comptabilisationsBody.innerHTML = `
        <tr id="loadingRowCompta">
            <td colspan="6" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p>Chargement des comptabilisations...</p>
            </td>
        </tr>
    `;
    try {
        // Vérifier l'authentification
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.email) {
            throw new Error('Utilisateur non authentifié');
        }

        console.log("Récupération des comptabilisations avec email:", userInfo.email);

        // Utiliser le bon endpoint pour les comptabilisations validées
        const response = await fetch('http://localhost:8082/comptabilisations', {
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

        // Stocker toutes les comptabilisations
        allComptabilisations = await response.json();

        // Supprimer l'indicateur de chargement
        const loadingRow = document.getElementById('loadingRowCompta');
        if (loadingRow) {
            loadingRow.remove();
        }

        // Initialiser les comptabilisations filtrées avec toutes les comptabilisations
        filteredComptabilisations = [...allComptabilisations];

        // Calculer le nombre total de pages
        totalPagesCompta = Math.ceil(filteredComptabilisations.length / rowsPerPageCompta);

        // Trier les données selon le tri par défaut
        sortComptabilisations(currentSortCompta.column, currentSortCompta.direction);

        // Mettre à jour l'interface utilisateur
        renderComptabilisationsPage();

        // Mettre à jour les icônes de tri
        updateSortIconsCompta(currentSortCompta.column, currentSortCompta.direction);

        // Configuration des écouteurs d'événements pour la recherche et le filtrage
        // Utilisation de debounce pour la recherche, comme pour les commandes
        document.getElementById('searchInputCompta').addEventListener('input', _.debounce(filterComptabilisations, 300));
        document.getElementById('dateExacteFilterCompta').addEventListener('change', filterComptabilisations);
        document.getElementById('typeDateFilterCompta').addEventListener('change', filterComptabilisations);

        // Réinitialiser les filtres
        document.getElementById('resetFiltersCompta').addEventListener('click', () => {
            document.getElementById('searchInputCompta').value = '';
            document.getElementById('dateExacteFilterCompta').value = '';
            document.getElementById('typeDateFilterCompta').value = 'dateComptabilisation';

            filteredComptabilisations = [...allComptabilisations];
            currentPageCompta = 1;
            sortComptabilisations('dateComptabilisation', 'desc');
            updateSortIconsCompta('dateComptabilisation', 'desc');
            renderComptabilisationsPage();
        });

        // Ajouter le tri par en-tête de colonne
        document.querySelectorAll('#tableComptabilisations th.sortable').forEach(header => {
            header.addEventListener('click', function() {
                const column = this.getAttribute('data-sort');
                // Inverser la direction si on clique sur la même colonne
                const direction = (column === currentSortCompta.column && currentSortCompta.direction === 'desc') ? 'asc' : 'desc';

                sortComptabilisations(column, direction);
                updateSortIconsCompta(column, direction);
                renderComptabilisationsPage();
            });
        });

    } catch (error) {
        console.error('Erreur lors du chargement des comptabilisations:', error);
        const comptabilisationsBody = document.getElementById('comptabilisationsBody');
        comptabilisationsBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erreur: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Filtrage des comptabilisations
function filterComptabilisations() {
    const searchTerm = document.getElementById('searchInputCompta').value.toLowerCase();
    const dateExacte = document.getElementById('dateExacteFilterCompta').value;
    const typeDate = document.getElementById('typeDateFilterCompta').value;

    console.log(`Filtrage des comptabilisations - searchTerm: ${searchTerm}, dateExacte: ${dateExacte}, typeDate: ${typeDate}`);

    filteredComptabilisations = allComptabilisations.filter(compta => {
        // Recherche texte - vérifier chaque propriété pour le texte de recherche
        const searchMatch = searchTerm ? Object.values(compta).some(value => {
            return value && String(value).toLowerCase().includes(searchTerm);
        }) : true;

        // Filtrage par date exacte
        let dateMatch = true;
        if (dateExacte && compta[typeDate]) {
            const dateCompta = new Date(compta[typeDate]);
            // Formater la date sans l'heure pour une comparaison exacte par jour
            const dateComptaFormatted = dateCompta.toISOString().split('T')[0];
            dateMatch = dateComptaFormatted === dateExacte;
        }

        console.log(`Comptabilisation ${compta.numeroBC} - searchMatch: ${searchMatch}, dateMatch: ${dateMatch}`);

        return searchMatch && dateMatch;
    });

    // Trier les comptabilisations selon les critères actuels
    sortComptabilisations(currentSortCompta.column, currentSortCompta.direction);

    // Réinitialise la pagination
    currentPageCompta = 1;
    totalPagesCompta = Math.ceil(filteredComptabilisations.length / rowsPerPageCompta);

    console.log(`Résultat du filtrage: ${filteredComptabilisations.length} comptabilisations trouvées`);

    // Affiche les résultats
    renderComptabilisationsPage();
}

// Initialisation des écouteurs d'événements pour l'onglet comptabilité
document.addEventListener('DOMContentLoaded', function() {
    // Écouteur pour le chargement de l'onglet comptabilité
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(function(button) {
        button.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target');

            // Si l'onglet comptabilité est activé
            if (targetId === '#comptabilite') {
                console.log("Onglet comptabilité activé, chargement des données...");
                chargerComptabilisationsAvecPagination();
            }
        });
    });

    // Charger les comptabilisations si l'onglet comptabilité est actif par défaut
    if (document.querySelector('.tab-pane.fade.active.show#comptabilite')) {
        chargerComptabilisationsAvecPagination();
    }
});
// Trier les comptabilisations
function sortComptabilisations(column, direction) {
    currentSortCompta.column = column;
    currentSortCompta.direction = direction;

    // Tri par comparaison selon le type de donnée
    filteredComptabilisations.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Traitement selon le type de données
        if (column.includes('date')) {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
        } else if (typeof valA === 'boolean') {
            // Pas de conversion pour les booléens
        } else {
            valA = valA ? String(valA).toLowerCase() : '';
            valB = valB ? String(valB).toLowerCase() : '';
        }

        // Applique la direction du tri
        if (direction === 'asc') {
            return valA > valB ? 1 : valA < valB ? -1 : 0;
        } else {
            return valA < valB ? 1 : valA > valB ? -1 : 0;
        }
    });
}

// Mettre à jour les icônes de tri pour les comptabilisations
function updateSortIconsCompta(column, direction) {
    // Réinitialiser toutes les icônes
    document.querySelectorAll('#tableComptabilisations th.sortable i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });

    // Mettre à jour l'icône pour la colonne triée
    const headerCell = document.querySelector(`#tableComptabilisations th[data-sort="${column}"] i`);
    if (headerCell) {
        headerCell.className = direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
}

// Affiche les comptabilisations de la page courante
function renderComptabilisationsPage() {
    const startIndex = (currentPageCompta - 1) * rowsPerPageCompta;
    const endIndex = startIndex + rowsPerPageCompta;
    const currentPageComptabilisations = filteredComptabilisations.slice(startIndex, endIndex);

    renderComptabilisations(currentPageComptabilisations);
    updatePaginationControlsCompta();
}

// Générer le contenu du tableau des comptabilisations
function renderComptabilisations(comptabilisations) {
    const comptabilisationsBody = document.getElementById('comptabilisationsBody');
    comptabilisationsBody.innerHTML = '';

    // Aucune comptabilisation trouvée
    if (comptabilisations.length === 0) {
        comptabilisationsBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    Aucune comptabilisation trouvée
                </td>
            </tr>
        `;
        return;
    }

    // Créer les lignes pour chaque comptabilisation
    const rows = comptabilisations.map(compta => {
        return `
            <tr>
                <td>${compta.numeroBC || '-'}</td>
                <td>${formatDate(compta.dateComptabilisation)}</td>
                <td>${formatDate(compta.dateTransmission)}</td>
                <td>${compta.personneCollectrice || '-'}</td>
                <td>${compta.commentaire || '-'}</td>
                <td class="text-center">${compta.fichierJoint ?
                    `<a href="#" onclick="voirFichierComptabilisation(${compta.id}); return false;" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-eye"></i>
                    </a>` : '-'}
                </td>
            </tr>
        `;
    }).join('');

    comptabilisationsBody.innerHTML = rows;
}

// Fonction pour voir le fichier joint d'une comptabilisation
window.voirFichierComptabilisation = function(idComptabilisation) {
    try {
        // Récupérer les informations de l'utilisateur connecté
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.email) {
            showToast('Utilisateur non authentifié', 'danger');
            throw new Error('Utilisateur non authentifié');
        }

        // Créer une requête au lieu d'ouvrir directement l'URL
        const url = `http://localhost:8082/comptabilisations/fichier/${idComptabilisation}`;

        // Créer un élément iframe caché pour afficher le PDF
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

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
                // Nettoyer
                document.body.removeChild(iframe);
            })
            .catch(error => {
                document.body.removeChild(iframe);
                console.error('Erreur lors de l\'ouverture du fichier:', error);
                showToast(error.message || "Une erreur est survenue", 'danger');
            });
    } catch (error) {
        console.error('Erreur lors de l\'ouverture du fichier:', error);
        showToast(error.message || "Une erreur est survenue", 'danger');
    }
};

// Mettre à jour les contrôles de pagination pour les comptabilisations
function updatePaginationControlsCompta() {
    const paginationContainer = document.getElementById('paginationContainerCompta');
    totalPagesCompta = Math.ceil(filteredComptabilisations.length / rowsPerPageCompta);

    if (totalPagesCompta <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    // Créer les contrôles de pagination
    let paginationHTML = `
        <nav aria-label="Navigation des pages de comptabilisations">
            <ul class="pagination justify-content-center">
                <li class="page-item ${currentPageCompta === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="prev" aria-label="Précédent">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
    `;

    // Afficher les numéros de page
    let startPage = Math.max(1, currentPageCompta - 2);
    let endPage = Math.min(totalPagesCompta, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPageCompta ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    paginationHTML += `
                <li class="page-item ${currentPageCompta === totalPagesCompta ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="next" aria-label="Suivant">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>
            </ul>
        </nav>
        <div class="text-center text-muted">
            <small>Affichage de ${(currentPageCompta - 1) * rowsPerPageCompta + 1} à ${Math.min(currentPageCompta * rowsPerPageCompta, filteredComptabilisations.length)} sur ${filteredComptabilisations.length} comptabilisations</small>
        </div>
    `;

    paginationContainer.innerHTML = paginationHTML;

    // Ajouter les gestionnaires d'événements pour la pagination
    document.querySelectorAll('#paginationContainerCompta .pagination .page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');

            if (page === 'prev') {
                if (currentPageCompta > 1) currentPageCompta--;
            } else if (page === 'next') {
                if (currentPageCompta < totalPagesCompta) currentPageCompta++;
            } else {
                currentPageCompta = parseInt(page);
            }

            renderComptabilisationsPage();
        });
    });
}

/**
 * Partie Trésorerie - Règlements
 */
// Variables globales pour la gestion de la pagination et du tri des règlements
let allReglements = [];
let filteredReglements = [];
let currentPageTresorerie = 1;
const rowsPerPageTresorerie = 10;
let totalPagesTresorerie = 0;
let currentSortTresorerie = {
    column: 'datePreparation',
    direction: 'desc'
};

// Charger les règlements depuis l'API
// Modification dans la fonction chargerReglementsAvecPagination
async function chargerReglementsAvecPagination() {
    // Afficher l'indicateur de chargement
    const reglementsBody = document.getElementById('reglementsBody');
    reglementsBody.innerHTML = `
        <tr id="loadingRowTresorerie">
            <td colspan="7" class="text-center">
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

        // Trier les données selon le tri par défaut
        sortReglements(currentSortTresorerie.column, currentSortTresorerie.direction);

        // Mettre à jour l'interface utilisateur
        renderReglementsPage();

        // Mettre à jour les icônes de tri
        updateSortIconsTresorerie(currentSortTresorerie.column, currentSortTresorerie.direction);

        // Configuration des écouteurs d'événements pour la recherche et le filtrage
        document.getElementById('searchInputTresorerie').addEventListener('input', _.debounce(filterReglements, 300));
        document.getElementById('dateExacteFilterTresorerie').addEventListener('change', filterReglements);
        document.getElementById('typeDateFilterTresorerie').addEventListener('change', filterReglements);

        // Réinitialiser les filtres
        document.getElementById('resetFiltersTresorerie').addEventListener('click', () => {
            document.getElementById('searchInputTresorerie').value = '';
            document.getElementById('dateExacteFilterTresorerie').value = '';
            document.getElementById('typeDateFilterTresorerie').value = 'datePreparation';

            filteredReglements = [...allReglements]; // Toujours uniquement les validés
            currentPageTresorerie = 1;
            sortReglements('datePreparation', 'desc');
            updateSortIconsTresorerie('datePreparation', 'desc');
            renderReglementsPage();
        });

        // Ajouter le tri par en-tête de colonne
        document.querySelectorAll('#tableReglements th.sortable').forEach(header => {
            header.addEventListener('click', function() {
                const column = this.getAttribute('data-sort');
                // Inverser la direction si on clique sur la même colonne
                const direction = (column === currentSortTresorerie.column && currentSortTresorerie.direction === 'desc') ? 'asc' : 'desc';

                sortReglements(column, direction);
                updateSortIconsTresorerie(column, direction);
                renderReglementsPage();
            });
        });

    } catch (error) {
        console.error('Erreur lors du chargement des règlements:', error);
        const reglementsBody = document.getElementById('reglementsBody');
        reglementsBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erreur: ${error.message}
                </td>
            </tr>
        `;
    }
}

// la fonction filterReglements
function filterReglements() {
    const searchTerm = document.getElementById('searchInputTresorerie').value.toLowerCase();
    const dateExacte = document.getElementById('dateExacteFilterTresorerie').value;
    const typeDate = document.getElementById('typeDateFilterTresorerie').value;

    console.log(`Filtrage des règlements - searchTerm: ${searchTerm}, dateExacte: ${dateExacte}, typeDate: ${typeDate}`);

    // Pas besoin de filtrer sur l'état car allReglements ne contient déjà que les validés
    filteredReglements = allReglements.filter(reglement => {
        // Recherche texte - vérifier chaque propriété pour le texte de recherche
        const searchMatch = searchTerm ? Object.values(reglement).some(value => {
            return value && String(value).toLowerCase().includes(searchTerm);
        }) : true;

        // Filtrage par date exacte
        let dateMatch = true;
        if (dateExacte && reglement[typeDate]) {
            const dateReglement = new Date(reglement[typeDate]);
            // Formater la date sans l'heure pour une comparaison exacte par jour
            const dateReglementFormatted = dateReglement.toISOString().split('T')[0];
            dateMatch = dateReglementFormatted === dateExacte;
        }

        return searchMatch && dateMatch;
    });

    // Trier les règlements selon les critères actuels
    sortReglements(currentSortTresorerie.column, currentSortTresorerie.direction);

    // Réinitialise la pagination
    currentPageTresorerie = 1;
    totalPagesTresorerie = Math.ceil(filteredReglements.length / rowsPerPageTresorerie);

    console.log(`Résultat du filtrage: ${filteredReglements.length} règlements trouvés`);

    // Affiche les résultats
    renderReglementsPage();
}

// Initialisation des écouteurs d'événements pour l'onglet trésorerie
document.addEventListener('DOMContentLoaded', function() {
    // Écouteur pour le chargement de l'onglet trésorerie
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(function(button) {
        button.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target');

            // Si l'onglet trésorerie est activé
            if (targetId === '#tresorerie') {
                console.log("Onglet trésorerie activé, chargement des données...");
                chargerReglementsAvecPagination();
            }
        });
    });

    // Charger les règlements si l'onglet trésorerie est actif par défaut
    if (document.querySelector('.tab-pane.fade.active.show#tresorerie')) {
        chargerReglementsAvecPagination();
    }
});

// Trier les règlements
function sortReglements(column, direction) {
    currentSortTresorerie.column = column;
    currentSortTresorerie.direction = direction;

    // Tri par comparaison selon le type de donnée
    filteredReglements.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Traitement selon le type de données
        if (column.includes('date')) {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
        } else if (typeof valA === 'boolean') {
            // Pas de conversion pour les booléens
        } else {
            valA = valA ? String(valA).toLowerCase() : '';
            valB = valB ? String(valB).toLowerCase() : '';
        }

        // Applique la direction du tri
        if (direction === 'asc') {
            return valA > valB ? 1 : valA < valB ? -1 : 0;
        } else {
            return valA < valB ? 1 : valA > valB ? -1 : 0;
        }
    });
}

// Mettre à jour les icônes de tri pour les règlements
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

// Affiche les règlements de la page courante
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
                <td colspan="7" class="text-center text-muted py-4">
                    Aucun règlement trouvé
                </td>
            </tr>
        `;
        return;
    }

    // Créer les lignes pour chaque règlement
    const rows = reglements.map(reglement => {
        // Récupérer le numéro de BC à partir de la commande
        const numeroBC = reglement.commande && reglement.commande.numeroBC ? reglement.commande.numeroBC : '-';

        return `
            <tr>
                <td>${numeroBC}</td>
                <td>${formatDate(reglement.datePreparation)}</td>
                <td>${reglement.modeReglement || '-'}</td>
                <td>${reglement.numeroCheque || '-'}</td>
                <td>${formatDate(reglement.dateTransmission)}</td>
                <td>${reglement.commentaire || '-'}</td>
                <td class="text-center">${reglement.fichierJoint ?
            `<a href="#" onclick="voirFichierReglement(${reglement.idReglement}); return false;" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-eye"></i>
                    </a>` : '-'}
                </td>
            </tr>
        `;
    }).join('');

    reglementsBody.innerHTML = rows;
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

        // Créer un élément iframe caché pour afficher le PDF
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

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
                // Nettoyer
                document.body.removeChild(iframe);
            })
            .catch(error => {
                document.body.removeChild(iframe);
                console.error('Erreur lors de l\'ouverture du fichier:', error);
                showToast(error.message || "Une erreur est survenue", 'danger');
            });
    } catch (error) {
        console.error('Erreur lors de l\'ouverture du fichier:', error);
        showToast(error.message || "Une erreur est survenue", 'danger');
    }
};

// Mettre à jour les contrôles de pagination pour les règlements
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

if (typeof formatDate !== 'function') {
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
}


/**
 * Partie Vision Globale
 */
// Variables pour la vision globale
let allGlobalData = [];
let filteredGlobalData = [];
let currentPageGlobal = 1;
let totalPagesGlobal = 1;
let rowsPerPageGlobal = 10;
let currentSortGlobal = { column: 'dateReception', direction: 'desc' };

// Charger et combiner les données pour la vision globale
async function chargerDonneesGlobales() {
    try {
        // Afficher l'indicateur de chargement
        const globalBody = document.getElementById('globalBody');
        globalBody.innerHTML = `
            <tr id="loadingRowGlobal">
                <td colspan="23" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <p>Chargement des données globales...</p>
                </td>
            </tr>
        `;

        // Vérifier l'authentification
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.email) {
            throw new Error('Utilisateur non authentifié');
        }

        // 1. Charger les commandes (BO)
        const responseCommandes = await fetch('http://localhost:8082/BO/commandes', {
            method: 'GET',
            headers: {
                'Authorization': userInfo.email
            }
        });
        const commandes = await responseCommandes.json();

        // 2. Charger les comptabilisations
        const responseComptabilisations = await fetch('http://localhost:8082/comptabilisations', {
            method: 'GET',
            headers: {
                'Authorization': userInfo.email,
                'Content-Type': 'application/json'
            }
        });
        const comptabilisations = await responseComptabilisations.json();

        // 3. Charger les règlements
        const responseReglements = await fetch('http://localhost:8082/api/reglements', {
            method: 'GET',
            headers: {
                'Authorization': userInfo.email,
                'Content-Type': 'application/json'
            }
        });
        const reglementsData = await responseReglements.json();

        // Filtrer pour ne garder que les règlements validés
        const reglements = reglementsData.filter(reglement =>
            reglement.etatEnCoursValideEtc &&
            reglement.etatEnCoursValideEtc.toLowerCase() === 'validé'
        );

        // Créer une structure de données combinée en utilisant le numéro BC comme clé
        const combinedData = {};

        // Ajouter les commandes
        commandes.forEach(commande => {
            const numeroBC = commande.numeroBC;
            if (numeroBC) {
                combinedData[numeroBC] = {
                    numeroBC: numeroBC,
                    // Données de réception
                    dateReception: commande.dateReception,
                    raisonSocialeFournisseur: commande.raisonSocialeFournisseur,
                    raisonSocialeGBM: commande.raisonSocialeGBM,
                    directionGBM: commande.directionGBM,
                    souscripteur: commande.souscripteur,
                    typeDocument: commande.typeDocument,
                    dateRelanceBR: commande.dateRelanceBR,
                    typeRelance: commande.typeRelance,
                    dossierComplet: commande.dossierComplet,
                    dateTransmissionBO: commande.dateTransmission,
                    personnesCollectrice: commande.personnesCollectrice
                };
            }
        });

        // Ajouter les données de comptabilisation
        comptabilisations.forEach(compta => {
            const numeroBC = compta.numeroBC;
            if (numeroBC && combinedData[numeroBC]) {
                combinedData[numeroBC].dateComptabilisation = compta.dateComptabilisation;
                combinedData[numeroBC].dateTransmissionCompta = compta.dateTransmission;
                combinedData[numeroBC].personneCollectriceCompta = compta.personneCollectrice;
                combinedData[numeroBC].commentaireCompta = compta.commentaire;
                combinedData[numeroBC].comptaId = compta.id;
                combinedData[numeroBC].comptaFileId = compta.fichierJoint ? compta.id : null;
            } else if (numeroBC) {
                // Si la commande n'existe pas encore dans combinedData
                combinedData[numeroBC] = {
                    numeroBC: numeroBC,
                    dateComptabilisation: compta.dateComptabilisation,
                    dateTransmissionCompta: compta.dateTransmission,
                    personneCollectriceCompta: compta.personneCollectrice,
                    commentaireCompta: compta.commentaire,
                    comptaId: compta.id,
                    comptaFileId: compta.fichierJoint ? compta.id : null
                };
            }
        });

        // Ajouter les données de règlement
        reglements.forEach(reglement => {
            const numeroBC = reglement.commande ? reglement.commande.numeroBC : null;
            if (numeroBC && combinedData[numeroBC]) {
                combinedData[numeroBC].datePreparation = reglement.datePreparation;
                combinedData[numeroBC].modeReglement = reglement.modeReglement;
                combinedData[numeroBC].numeroCheque = reglement.numeroCheque;
                combinedData[numeroBC].dateTransmissionRegl = reglement.dateTransmission;
                combinedData[numeroBC].commentaireRegl = reglement.commentaire;
                combinedData[numeroBC].reglId = reglement.idReglement;
                combinedData[numeroBC].reglFileId = reglement.fichierJoint ? reglement.idReglement : null;
            } else if (numeroBC) {
                // Si la commande n'existe pas encore dans combinedData
                combinedData[numeroBC] = {
                    numeroBC: numeroBC,
                    datePreparation: reglement.datePreparation,
                    modeReglement: reglement.modeReglement,
                    numeroCheque: reglement.numeroCheque,
                    dateTransmissionRegl: reglement.dateTransmission,
                    commentaireRegl: reglement.commentaire,
                    reglId: reglement.idReglement,
                    reglFileId: reglement.fichierJoint ? reglement.idReglement : null
                };
            }
        });

        // Convertir l'objet en tableau
        allGlobalData = Object.values(combinedData);
        filteredGlobalData = [...allGlobalData];

        // Supprimer l'indicateur de chargement
        const loadingRow = document.getElementById('loadingRowGlobal');
        if (loadingRow) {
            loadingRow.remove();
        }

        // Calculer le nombre total de pages
        totalPagesGlobal = Math.ceil(filteredGlobalData.length / rowsPerPageGlobal);

        // Trier les données selon le tri par défaut
        sortGlobalData(currentSortGlobal.column, currentSortGlobal.direction);

        // Mettre à jour l'interface utilisateur
        renderGlobalDataPage();

        // Mettre à jour les icônes de tri
        updateSortIconsGlobal(currentSortGlobal.column, currentSortGlobal.direction);

        // Configuration des écouteurs d'événements pour la recherche et le filtrage
        document.getElementById('searchInputGlobal').addEventListener('input', _.debounce(filterGlobalData, 300));
        document.getElementById('dateExacteFilterGlobal').addEventListener('change', filterGlobalData);
        document.getElementById('typeDateFilterGlobal').addEventListener('change', filterGlobalData);

        // Réinitialiser les filtres
        document.getElementById('resetFiltersGlobal').addEventListener('click', () => {
            document.getElementById('searchInputGlobal').value = '';
            document.getElementById('dateExacteFilterGlobal').value = '';
            document.getElementById('typeDateFilterGlobal').value = 'dateReception';

            filteredGlobalData = [...allGlobalData];
            currentPageGlobal = 1;
            sortGlobalData('dateReception', 'desc');
            updateSortIconsGlobal('dateReception', 'desc');
            renderGlobalDataPage();
        });

        // Ajouter le tri par en-tête de colonne
        document.querySelectorAll('#tableGlobal th.sortable').forEach(header => {
            header.addEventListener('click', function() {
                const column = this.getAttribute('data-sort');
                // Inverser la direction si on clique sur la même colonne
                const direction = (column === currentSortGlobal.column && currentSortGlobal.direction === 'desc') ? 'asc' : 'desc';

                sortGlobalData(column, direction);
                updateSortIconsGlobal(column, direction);
                renderGlobalDataPage();
            });
        });

    } catch (error) {
        console.error('Erreur lors du chargement des données globales:', error);
        const globalBody = document.getElementById('globalBody');
        globalBody.innerHTML = `
            <tr>
                <td colspan="23" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erreur: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Fonction pour filtrer les données globales
function filterGlobalData() {
    const searchTerm = document.getElementById('searchInputGlobal').value.toLowerCase();
    const dateExacte = document.getElementById('dateExacteFilterGlobal').value;
    const typeDate = document.getElementById('typeDateFilterGlobal').value;

    console.log(`Filtrage des données globales - searchTerm: ${searchTerm}, dateExacte: ${dateExacte}, typeDate: ${typeDate}`);

    filteredGlobalData = allGlobalData.filter(item => {
        // Recherche texte - vérifier chaque propriété pour le texte de recherche
        const searchMatch = searchTerm ? Object.values(item).some(value => {
            return value && String(value).toLowerCase().includes(searchTerm);
        }) : true;

        // Filtrage par date exacte
        let dateMatch = true;
        if (dateExacte && item[typeDate]) {
            const dateItem = new Date(item[typeDate]);
            // Formater la date sans l'heure pour une comparaison exacte par jour
            const dateItemFormatted = dateItem.toISOString().split('T')[0];
            dateMatch = dateItemFormatted === dateExacte;
        }

        return searchMatch && dateMatch;
    });

    // Trier les données selon les critères actuels
    sortGlobalData(currentSortGlobal.column, currentSortGlobal.direction);

    // Réinitialise la pagination
    currentPageGlobal = 1;
    totalPagesGlobal = Math.ceil(filteredGlobalData.length / rowsPerPageGlobal);

    console.log(`Résultat du filtrage: ${filteredGlobalData.length} éléments trouvés`);

    // Affiche les résultats
    renderGlobalDataPage();
}

// Fonction pour trier les données globales
function sortGlobalData(column, direction) {
    currentSortGlobal.column = column;
    currentSortGlobal.direction = direction;

    filteredGlobalData.sort((a, b) => {
        let valueA = a[column] || '';
        let valueB = b[column] || '';

        // Convertir les dates en objets Date pour les comparer
        if (column.includes('date') && valueA && valueB) {
            valueA = new Date(valueA);
            valueB = new Date(valueB);
        }

        // Comparer les valeurs
        if (valueA < valueB) {
            return direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

// Fonction pour mettre à jour les icônes de tri
function updateSortIconsGlobal(column, direction) {
    // Réinitialiser toutes les icônes
    document.querySelectorAll('#tableGlobal th.sortable i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });

    // Mettre à jour l'icône de la colonne triée
    const header = document.querySelector(`#tableGlobal th[data-sort="${column}"]`);
    if (header) {
        const icon = header.querySelector('i');
        icon.className = direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
}

// Fonction pour rendre les données globales par page
function renderGlobalDataPage() {
    // Calculer les indices de début et de fin pour la pagination
    const startIndex = (currentPageGlobal - 1) * rowsPerPageGlobal;
    const endIndex = Math.min(startIndex + rowsPerPageGlobal, filteredGlobalData.length);

    // Récupérer les données pour la page actuelle
    const currentPageData = filteredGlobalData.slice(startIndex, endIndex);

    // Rendre les données
    renderGlobalData(currentPageData);

    // Mettre à jour la pagination
    updatePaginationControlsGlobal();
}

// Fonction pour rendre le tableau de données globales
// Fonction pour rendre le tableau de données globales avec toutes les colonnes
function renderGlobalData(data) {
    const globalBody = document.getElementById('globalBody');
    globalBody.innerHTML = '';

    // Aucune donnée trouvée
    if (data.length === 0) {
        globalBody.innerHTML = `
            <tr>
                <td colspan="23" class="text-center text-muted py-4">
                    Aucune donnée trouvée
                </td>
            </tr>
        `;
        return;
    }

    // Créer les lignes pour chaque élément
    const rows = data.map(item => {
        // Identifier si des fichiers sont joints
        const hasComptaFile = item.hasOwnProperty('comptaFileId') && item.comptaFileId;
        const hasReglFile = item.hasOwnProperty('reglFileId') && item.reglFileId;

        return `
            <tr>
                <!-- Colonnes de Réception (BO) -->
                <td>${item.numeroBC || '-'}</td>
                <td>${formatDate(item.dateReception)}</td>
                <td>${item.raisonSocialeFournisseur || '-'}</td>
                <td>${item.raisonSocialeGBM || '-'}</td>
                <td>${item.directionGBM || '-'}</td>
                <td>${item.souscripteur || '-'}</td>
                <td>${item.typeDocument || '-'}</td>
                <td>${formatDate(item.dateRelanceBR)}</td>
                <td>${item.typeRelance || '-'}</td>
                <td>${getEtatDossier(item.dossierComplet)}</td>
                <td>${formatDate(item.dateTransmissionBO)}</td>
                <td>${item.personnesCollectrice || '-'}</td>
                
                <!-- Colonnes de Comptabilité -->
                <td>${formatDate(item.dateComptabilisation)}</td>
                <td>${formatDate(item.dateTransmissionCompta)}</td>
                <td>${item.personneCollectriceCompta || '-'}</td>
                <td>${item.commentaireCompta || '-'}</td>
                <td class="text-center">${hasComptaFile ?
            `<a href="#" onclick="voirFichierComptabilisation(${item.comptaId}); return false;" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-eye"></i>
                    </a>` : '-'}
                </td>
                
                <!-- Colonnes de Trésorerie -->
                <td>${formatDate(item.datePreparation)}</td>
                <td>${item.modeReglement || '-'}</td>
                <td>${item.numeroCheque || '-'}</td>
                <td>${formatDate(item.dateTransmissionRegl)}</td>
                <td>${item.commentaireRegl || '-'}</td>
                <td class="text-center">${hasReglFile ?
            `<a href="#" onclick="voirFichierReglement(${item.reglId}); return false;" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-eye"></i>
                    </a>` : '-'}
                </td>
            </tr>
        `;
    }).join('');

    globalBody.innerHTML = rows;
}

// Fonction pour mettre à jour les contrôles de pagination pour la vision globale
function updatePaginationControlsGlobal() {
    const paginationContainer = document.getElementById('paginationContainerGlobal');

    if (totalPagesGlobal <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    // Créer les contrôles de pagination
    let paginationHTML = `
        <nav aria-label="Navigation des pages de données globales">
            <ul class="pagination justify-content-center">
                <li class="page-item ${currentPageGlobal === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="prev" aria-label="Précédent">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
    `;

    // Afficher les numéros de page
    let startPage = Math.max(1, currentPageGlobal - 2);
    let endPage = Math.min(totalPagesGlobal, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPageGlobal ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    paginationHTML += `
        </nav>
        <div class="text-center text-muted">
            <small>Affichage de ${Math.min(filteredGlobalData.length, (currentPageGlobal - 1) * rowsPerPageGlobal + 1)} à ${Math.min(currentPageGlobal * rowsPerPageGlobal, filteredGlobalData.length)} sur ${filteredGlobalData.length} éléments</small>
        </div>
        <div class="text-center mt-2">
            <small class="text-muted">Faites défiler horizontalement pour voir toutes les colonnes</small>
        </div>
    `;

    paginationContainer.innerHTML = paginationHTML;

    // Ajouter les gestionnaires d'événements pour la pagination
    document.querySelectorAll('#paginationContainerGlobal .pagination .page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');

            if (page === 'prev') {
                if (currentPageGlobal > 1) currentPageGlobal--;
            } else if (page === 'next') {
                if (currentPageGlobal < totalPagesGlobal) currentPageGlobal++;
            } else {
                currentPageGlobal = parseInt(page);
            }

            renderGlobalDataPage();
        });
    });
}

// Ajouter un écouteur d'événements pour charger les données globales lorsque l'onglet est activé
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(function(button) {
        button.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target');

            // Si l'onglet vision globale est activé
            if (targetId === '#global') {
                console.log("Onglet vision globale activé, chargement des données...");
                chargerDonneesGlobales();
            }
        });
    });

    // Charger les données globales si l'onglet vision globale est actif par défaut
    if (document.querySelector('.tab-pane.fade.active.show#global')) {
        chargerDonneesGlobales();
    }
});

// S'assurer que la fonction getEtatDossier existe
if (typeof getEtatDossier !== 'function') {
    function getEtatDossier(etat) {
        if (etat === true || etat === 'true') {
            return '<span class="badge bg-success">Complet</span>';
        } else if (etat === false || etat === 'false') {
            return '<span class="badge bg-danger">Incomplet</span>';
        } else {
            return '-';
        }
    }
}

