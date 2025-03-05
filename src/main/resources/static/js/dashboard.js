// Fonction pour initialiser les toasts
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

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser le conteneur de toasts
    initToast();
    // Récupérer les informations utilisateur depuis sessionStorage
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (userInfo) {
        // Afficher le nom de l'utilisateur
        const userNameElement = document.getElementById('userName');
        userNameElement.textContent = userInfo.prenom + ' ' + userInfo.nom;
        document.getElementById('userId').textContent = userInfo.id;
    }

    const commandeForm = document.getElementById('commandeForm');

    commandeForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Récupérer les valeurs du formulaire
        const formData = new FormData();
        formData.append('raisonSocialeFournisseur', document.getElementById('raisonSocialeFournisseur').value);
        formData.append('numeroBC', document.getElementById('numeroBC').value);
        formData.append('directionGBM', document.getElementById('directionGBM').value);
        formData.append('typeDocument', document.getElementById('typeDocument').value);
        formData.append('dateRelanceBR', document.getElementById('dateRelanceBR').value);
        formData.append('dateTransmission', document.getElementById('dateTransmission').value);
        formData.append('raisonSocialeGBM', document.getElementById('raisonSocialeGBM').value);
        formData.append('souscripteur', document.getElementById('souscripteur').value);
        formData.append('typeRelance', document.getElementById('typeRelance').value);

        const personnesCollectrice = document.getElementById('personnesCollectrice').value;
        if (personnesCollectrice) {
            formData.append('personnesCollectrice', personnesCollectrice);
        }

        formData.append('dossierComplet', document.getElementById('dossierComplet').checked);

        const fichierInput = document.getElementById('fichier');
        if (fichierInput.files.length > 0) {
            formData.append('fichier', fichierInput.files[0]);
        }

        try {
            // Récupérer l'email de l'utilisateur connecté depuis la session
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
            if (!userInfo || !userInfo.email) {
                throw new Error('Utilisateur non authentifié');
            }

            const response = await fetch('http://localhost:8082/BO/commandes/nouvelle', {
                method: 'POST',
                headers: {
                    'Authorization': userInfo.email
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showToast(`Commande créée avec succès !`, 'success');
                setTimeout(() => {
                    // Rediriger vers la page des commandes
                    window.location.href = 'commandes.html';
                }, 1500); // 1.5 secondes pour voir le toast
            } else {
                throw new Error(data.message || 'Erreur lors de la création de la commande');
            }

        } catch (error) {
            console.error('Erreur:', error);
            showToast(error.message, 'danger');
        }
    });
});