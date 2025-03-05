document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le conteneur de toasts
    function initToast() {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Fonction pour afficher un toast
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        const toastContainer = document.getElementById('toastContainer');
        toastContainer.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Supprimer le toast après sa fermeture
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Fonction pour formater la date
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Fonction pour déterminer l'état de la commande
    function getEtatCommande(commande) {
        // Logique pour déterminer l'état de la commande
        // Vous pouvez personnaliser cette logique selon vos besoins
        if (commande.dossierComplet) {
            return '<span class="badge bg-success">Complet</span>';
        }
        return '<span class="badge bg-warning">En cours</span>';
    }

    // Fonction pour charger les commandes
    async function chargerCommandes() {
        try {
            // Récupérer les informations utilisateur depuis sessionStorage
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
            if (!userInfo || !userInfo.email) {
                throw new Error('Utilisateur non authentifié');
            }

            // Charger les commandes de l'utilisateur
            const response = await fetch('http://localhost:8082/BO/commandes', {
                method: 'GET',
                headers: {
                    'Authorization': userInfo.email
                }
            });

            const commandes = await response.json();

            // Sélectionner le corps du tableau
            const commandesBody = document.getElementById('commandesBody');

            // Supprimer la ligne de chargement
            const loadingRow = document.getElementById('loadingRow');
            if (loadingRow) {
                loadingRow.remove();
            }

            // Vérifier s'il y a des commandes
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

            // Générer les lignes du tableau
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

            // Insérer les lignes dans le tableau
            commandesBody.innerHTML = rows;

        } catch (error) {
            console.error('Erreur lors du chargement des commandes:', error);

            // Afficher un message d'erreur dans le tableau
            const commandesBody = document.getElementById('commandesBody');
            commandesBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-danger py-4">
                        Erreur de chargement des commandes : ${error.message}
                    </td>
                </tr>
            `;

            // Afficher un toast d'erreur
            showToast(error.message, 'danger');
        }
    }

    // Fonctions fictives pour les actions (à implémenter)
    window.voirDetailsCommande = function(idCommande) {
        showToast(`Voir les détails de la commande ${idCommande}`, 'info');
        // Logique pour afficher les détails de la commande
    }

    window.modifierCommande = function(idCommande) {
        showToast(`Modifier la commande ${idCommande}`, 'warning');
        // Logique pour modifier la commande
    }

    // Initialiser les toasts et charger les commandes
    initToast();
    chargerCommandes();

    // Récupérer et afficher le nom de l'utilisateur
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (userInfo) {
        const userNameElement = document.getElementById('userName');
        userNameElement.textContent = userInfo.prenom + ' ' + userInfo.nom;
        document.getElementById('userId').textContent = userInfo.id;
    }
});