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

    // Filtre dynamique des commandes
    function filterCommandes() {
        // Récupère les valeurs des filtres
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const directionFilter = document.getElementById('directionFilter').value;
        const etatFilter = document.getElementById('etatFilter').value;

        // Applique les filtres multi-critères
        const filteredCommandes = allCommandes.filter(commande => {
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

        // Affiche les commandes filtrées
        renderCommandes(filteredCommandes);
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
        const rows = commandes.map(commande => `
            <tr>
                <td>${formatDate(commande.dateModification)}</td>
                <td>${commande.raisonSocialeFournisseur || 'N/A'}</td>
                <td>${commande.raisonSocialeGBM || 'N/A'}</td>
                <td>${commande.numeroBC || 'N/A'}</td>
                <td>${commande.directionGBM || 'N/A'}</td>
                <td>${commande.souscripteur || 'N/A'}</td>
                <td>${commande.typeDocument || 'N/A'}</td>
                <td>${getEtatCommande(commande)}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-info" onclick="voirDetailsCommande(${commande.idCommande})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="modifierCommande(${commande.idCommande})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

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

            // Supprime l'indicateur de chargement
            const loadingRow = document.getElementById('loadingRow');
            if (loadingRow) {
                loadingRow.remove();
            }

            // Prépare l'interface de filtrage
            populateDirectionFilter(allCommandes);
            renderCommandes(allCommandes);

            // Configureles écouteurs d'événements pour le filtrage
            document.getElementById('searchInput').addEventListener('input', _.debounce(filterCommandes, 300));
            document.getElementById('directionFilter').addEventListener('change', filterCommandes);
            document.getElementById('etatFilter').addEventListener('change', filterCommandes);

            // Gère la réinitialisation des filtres
            document.getElementById('resetFilters').addEventListener('click', () => {
                document.getElementById('searchInput').value = '';
                document.getElementById('directionFilter').value = '';
                document.getElementById('etatFilter').value = '';
                renderCommandes(allCommandes);
            });

        } catch (error) {
            // Gestion des erreurs de chargement
            console.error('Erreur lors du chargement des commandes:', error);
            showToast(error.message, 'danger');
        }
    }

    // Fonctions globales pour les actions sur les commandes

    window.voirDetailsCommande = function(idCommande) {
        window.location.href = `details.html?id=${idCommande}`;
    }
    window.modifierCommande = function(idCommande) {
        showToast(`Modifier la commande ${idCommande}`, 'warning');
    }

    // Initialisation de l'interface
    initToast();
    chargerCommandes();

    // Affiche le nom de l'utilisateur connecté
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (userInfo) {
        const userNameElement = document.getElementById('userName');
        userNameElement.textContent = userInfo.prenom + ' ' + userInfo.nom;
    }
});