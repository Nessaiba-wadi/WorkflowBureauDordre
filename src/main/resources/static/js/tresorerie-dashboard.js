/**
 * KPI
 */

// Fonction pour récupérer les statistiques des règlements
function chargerStatistiquesCommandes() {
    // Récupération des données depuis l'API
    fetch('http://localhost:8082/api/reglements/dashboard')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des statistiques');
            }
            return response.json();
        })
        .then(data => {
            console.log("Données reçues:", data); // Pour déboguer

            // Mise à jour des compteurs avec les nouvelles données
            document.getElementById('commandesRecues').textContent = data.recues + ' Reçues';
            document.getElementById('commandesEnCours').textContent = data.enCours + ' En cours';
            document.getElementById('commandesCloturees').textContent = data.cloturees + ' Clôturées';
            //document.getElementById('tempsTraitementMoyen').textContent = data.tempsTraitementMoyen + ' jours';
        })
        .catch(error => {
            console.error('Erreur:', error);

            // En cas d'erreur, afficher un message
            document.getElementById('commandesRecues').textContent = 'Erreur';
            document.getElementById('commandesEnCours').textContent = 'Erreur';
            document.getElementById('commandesCloturees').textContent = 'Erreur';
            //document.getElementById('tempsTraitementMoyen').textContent = 'Erreur';
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
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Fonction pour afficher l'état du dossier
function getEtatDossier(dossierComplet) {
    return dossierComplet ? 'Complet' : 'En cours';
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

// Assurez-vous que la fonction formatDate existe
// Si elle n'existe pas déjà dans votre code, ajoutez-la :
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