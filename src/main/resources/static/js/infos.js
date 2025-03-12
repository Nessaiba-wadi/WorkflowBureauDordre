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
// Garder le code existant de infos.js et ajouter ce qui suit

// Variables pour la gestion du tableau des commandes
let allCommandes = [];
let currentPage = 1;
const rowsPerPage = 10;
let totalPages = 0;
let filteredCommandes = [];
let currentSort = {
    column: 'dateModification',
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
function getEtatDossier(commande) {
    return commande.dossierComplet ? 'Complet' : 'En cours';
}

// Fonction pour filtrer les commandes
function filterCommandes() {
    // Récupération des valeurs des filtres de date
    const dateReceptionFilter = document.getElementById('dateReceptionFilter').value;
    const dateRelanceFilter = document.getElementById('dateRelanceFilter').value;
    const dateTransmissionFilter = document.getElementById('dateTransmissionFilter').value;

    // Fonction pour vérifier si une date correspond au filtre
    function dateMatches(dateStr, filterDate) {
        if (!filterDate) return true;
        if (!dateStr) return false;

        const date = new Date(dateStr);
        const filterDateObj = new Date(filterDate);

        return date.toISOString().slice(0, 10) === filterDateObj.toISOString().slice(0, 10);
    }

    // Applique les filtres
    filteredCommandes = allCommandes.filter(commande => {
        // Filtre par dates
        const receptionMatch = dateMatches(commande.dateModification, dateReceptionFilter);
        const relanceMatch = dateMatches(commande.dateRelance, dateRelanceFilter);
        const transmissionMatch = dateMatches(commande.dateTransmission, dateTransmissionFilter);

        return receptionMatch && relanceMatch && transmissionMatch;
    });

    // Réinitialise la pagination et applique le tri
    currentPage = 1;
    sortCommandes(currentSort.column, currentSort.direction);
    renderCommandesPage();
}

// Fonction pour trier les commandes
function sortCommandes(column, direction) {
    currentSort.column = column;
    currentSort.direction = direction;

    filteredCommandes.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Traitement spécial selon le type de colonne
        if (column.includes('date')) {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
        } else if (typeof valA === 'boolean') {
            // Pas de changement pour les booléens
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

// Fonction pour mettre à jour les icônes de tri
function updateSortIcons(column, direction) {
    // Réinitialise toutes les icônes
    document.querySelectorAll('th.sortable i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });

    // Met à jour l'icône pour la colonne triée
    const headerCell = document.querySelector(`th[data-sort="${column}"] i`);
    if (headerCell) {
        headerCell.className = direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
}

// Fonction pour afficher les commandes de la page courante
function renderCommandesPage() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentPageCommandes = filteredCommandes.slice(startIndex, endIndex);

    renderCommandes(currentPageCommandes);
    updatePaginationControls();
}

// Fonction pour mettre à jour les contrôles de pagination
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

// Fonction pour afficher les commandes
function renderCommandes(commandes) {
    const commandesBody = document.getElementById('commandesBody');
    commandesBody.innerHTML = '';

    // Gère le cas où aucune commande n'est trouvée
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

    // Crée les lignes du tableau pour chaque commande
    const rows = commandes.map(commande => {
        return `
            <tr>
                <td>${formatDate(commande.dateModification)}</td>
                <td>${commande.raisonSocialeFournisseur || 'N/A'}</td>
                <td>${commande.raisonSocialeGBM || 'N/A'}</td>
                <td>${commande.numeroBC || 'N/A'}</td>
                <td>${commande.directionGBM || 'N/A'}</td>
                <td>${commande.souscripteur || 'N/A'}</td>
                <td>${commande.typeDocument || 'N/A'}</td>
                <td>${formatDate(commande.dateRelance)}</td>
                <td>${commande.typeRelance || 'N/A'}</td>
                <td>${getEtatDossier(commande)}</td>
                <td>${formatDate(commande.dateTransmission)}</td>
                <td>${commande.personneCollectrice || 'N/A'}</td>
            </tr>
        `;
    }).join('');

    // Insère les lignes dans le tableau
    commandesBody.innerHTML = rows;
}

// Fonction pour charger les commandes
async function chargerCommandesEtDonnees() {
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

        // Applique le tri initial
        sortCommandes('dateModification', 'desc');
        filteredCommandes = [...allCommandes];

        // Supprime l'indicateur de chargement
        const loadingRow = document.getElementById('loadingRow');
        if (loadingRow) {
            loadingRow.remove();
        }

        // Affiche les commandes et met à jour la pagination
        renderCommandesPage();

        // Charge également les statistiques
        chargerStatistiquesCommandes();

        // Configure les écouteurs d'événements
        setupEventListeners();

    } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
        const commandesBody = document.getElementById('commandesBody');
        if (commandesBody) {
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
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Écouteurs pour les filtres de date
    document.getElementById('dateReceptionFilter').addEventListener('change', filterCommandes);
    document.getElementById('dateRelanceFilter').addEventListener('change', filterCommandes);
    document.getElementById('dateTransmissionFilter').addEventListener('change', filterCommandes);

    // Réinitialisation des filtres de date
    document.getElementById('resetDateFilters').addEventListener('click', () => {
        document.getElementById('dateReceptionFilter').value = '';
        document.getElementById('dateRelanceFilter').value = '';
        document.getElementById('dateTransmissionFilter').value = '';
        filteredCommandes = [...allCommandes];
        currentPage = 1;
        renderCommandesPage();
    });

    // Écouteurs pour le tri des colonnes
    document.querySelectorAll('th.sortable').forEach(header => {
        header.addEventListener('click', function() {
            const column = this.getAttribute('data-sort');
            // Inverse la direction si on clique sur la même colonne
            const direction = (column === currentSort.column && currentSort.direction === 'desc') ? 'asc' : 'desc';

            sortCommandes(column, direction);
            updateSortIcons(column, direction);
            renderCommandesPage();
        });
    });

    // Met à jour les icônes de tri initiales
    updateSortIcons('dateModification', 'desc');
}

// Initialise la page au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Si le tableau des commandes existe, initialise-le
    if (document.getElementById('tableCommandes')) {
        chargerCommandesEtDonnees();
    } else {
        // Sinon, charge uniquement les statistiques (comportement existant)
        chargerStatistiquesCommandes();
    }

    // Actualiser les données toutes les 5 minutes
    setInterval(() => {
        chargerStatistiquesCommandes();

        // Recharge également les commandes si le tableau existe
        if (document.getElementById('tableCommandes')) {
            chargerCommandesEtDonnees();
        }
    }, 300000);
});

// Charger les statistiques au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log("Page chargée, chargement des statistiques..."); // Pour déboguer
    chargerStatistiquesCommandes();

    // Actualiser les données toutes les 5 minutes
    setInterval(chargerStatistiquesCommandes, 300000);
});