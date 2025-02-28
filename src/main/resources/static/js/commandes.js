async function chargerCommandes() {
    try {
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.id) {
            throw new Error('Informations utilisateur non disponibles');
        }

        const response = await fetch(`${API_BASE_URL}/BO/commandes/utilisateur/${userInfo.id}`);
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des commandes');
        }

        const commandes = await response.json();
        afficherCommandes(commandes);

    } catch (error) {
        console.error('Erreur:', error);
        showToast(`Erreur lors du chargement: ${error.message}`, 'error');
        document.getElementById('loadingRow').innerHTML =
            '<td colspan="8" class="text-center text-danger py-3">Erreur de chargement</td>';
    }
}

function afficherCommandes(commandes) {
    const tbody = document.getElementById('commandesBody');
    tbody.innerHTML = '';

    if (commandes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    Aucune commande trouvée
                </td>
            </tr>`;
        return;
    }

    commandes.forEach(commande => {
        const row = document.createElement('tr');

        // Formatage des dates
        const formatDate = (dateString) =>
            dateString ? new Date(dateString).toLocaleDateString('fr-FR') : 'N/A';

        // Badge d'état
        let badgeClass = 'secondary';
        if (commande.etatCommande === 'Terminé') badgeClass = 'success';
        if (commande.etatCommande === 'En cours') badgeClass = 'warning';
        if (commande.etatCommande === 'Urgent') badgeClass = 'danger';

        row.innerHTML = `
            <td>${formatDate(commande.dateReception)}</td>
            <td>${commande.raisonSocialeFournisseur}</td>
            <td>${commande.raisonSocialeGBM}</td>
            <td>${commande.numeroBC}</td>
            <td>${commande.directionGBM}</td>
            <td>${commande.souscripteur}</td>
            <td>${commande.typeDocument}</td>
            <td>
                <span class="badge bg-${badgeClass}">
                    ${commande.etatCommande}
                </span>
            </td>
            <td>
                ${commande.fichierJoint ? `
                <a href="${API_BASE_URL}/BO/commandes/fichier/${commande.fichierJoint}" class="btn btn-sm btn-outline-primary" download>
                    <i class="fas fa-download"></i>
                </a>
                ` : ''}
                <a href="details.html?id=${commande.id}" class="btn btn-sm btn-outline-info">
                    <i class="fas fa-eye"></i>
                </a>
            </td>
        `;

        tbody.appendChild(row);
    });
}
function afficherDetails(commande) {
    const modalContent = `
        <div class="modal fade" id="detailModal">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">Détails complet de la commande</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <dl class="row">
                            ${Object.entries(commande).map(([key, value]) => `
                                <dt class="col-sm-4">${key}</dt>
                                <dd class="col-sm-8">${value || 'Non renseigné'}</dd>
                            `).join('')}
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalContent);
    new bootstrap.Modal(document.getElementById('detailModal')).show();
}
// Appeler au chargement de la page
document.addEventListener('DOMContentLoaded', chargerCommandes);