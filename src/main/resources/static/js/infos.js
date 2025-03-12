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
    chargerCommandesAvecPagination();  // Ajoutez cette ligne

    // Actualiser les données toutes les 5 minutes
    setInterval(chargerStatistiquesCommandes, 300000);
});

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
                <td>${commande.raisonSocialeFournisseur || 'N/A'}</td>
                <td>${commande.raisonSocialeGBM || 'N/A'}</td>
                <td>${commande.numeroBC || 'N/A'}</td>
                <td>${commande.directionGBM || 'N/A'}</td>
                <td>${commande.souscripteur || 'N/A'}</td>
                <td>${commande.typeDocument || 'N/A'}</td>
                <td>${formatDate(commande.dateRelance)}</td>
                <td>${commande.typeRelance || 'N/A'}</td>
                <td>${getEtatDossier(commande.dossierComplet)}</td>
                <td>${formatDate(commande.dateTransmission)}</td>
                <td>${commande.personneCollectrice || 'N/A'}</td>
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