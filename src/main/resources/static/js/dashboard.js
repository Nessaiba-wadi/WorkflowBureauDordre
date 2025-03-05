const API_BASE_URL = 'http://localhost:8082';

document.addEventListener('DOMContentLoaded', async function() {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (!userInfo) {
        window.location.href = '../../templates/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/utilisateurs/${userInfo.id}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des détails utilisateur');
        }
        const userDetails = await response.json();

        document.getElementById('userName').textContent = `${userDetails.prenom} ${userDetails.nom}`;
        document.getElementById('userId').textContent = `${userInfo.id}`;
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('userName').textContent = `${userInfo.prenom} ${userInfo.nom}`;
        document.getElementById('userId').textContent = `${userInfo.id}`;
    }

    initializeForm();

    if (!document.querySelector('.custom-toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'custom-toast-container';
        document.body.appendChild(toastContainer);
    }
});

function showToast(message, type = 'success', duration = 3000) {
    const toastContainer = document.querySelector('.custom-toast-container');

    const toast = document.createElement('div');
    toast.className = `custom-toast custom-toast-${type}`;

    const iconMap = {
        'success': '<i class="fas fa-check-circle text-success"></i>',
        'error': '<i class="fas fa-exclamation-circle text-danger"></i>',
        'info': '<i class="fas fa-info-circle text-info"></i>',
        'warning': '<i class="fas fa-exclamation-triangle text-warning"></i>'
    };

    const titleMap = {
        'success': 'Succès',
        'error': 'Erreur',
        'info': 'Information',
        'warning': 'Avertissement'
    };

    toast.innerHTML = `
        <div class="custom-toast-header">
            <div>
                ${iconMap[type]} <strong class="me-auto">${titleMap[type]}</strong>
            </div>
            <button type="button" class="btn-close btn-close-white btn-sm" onclick="closeToast(this)"></button>
        </div>
        <div class="custom-toast-body">${message}</div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        closeToast(toast.querySelector('.btn-close'));
    }, duration);

    return toast;
}

function closeToast(closeButton) {
    const toast = closeButton.closest('.custom-toast');
    toast.classList.add('hide');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

function deconnexion() {
    sessionStorage.clear();
    window.location.href = '../../templates/login.html';
}

function openUserSettings() {
    showToast('Fonctionnalité en cours de développement', 'info');
}

function initializeForm() {
    const form = document.getElementById('commandeForm');
    if (!form) return;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateRelanceBR').min = today;
    document.getElementById('dateTransmission').min = today;

    form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;

    form.classList.add('was-validated');

    if (!form.checkValidity()) {
        event.stopPropagation();
        return;
    }

    try {
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.id) {
            throw new Error('Informations utilisateur non disponibles. Veuillez vous reconnecter.');
        }

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

        const commandeData = {
            raisonSocialeFournisseur: document.getElementById('raisonSocialeFournisseur').value,
            raisonSocialeGBM: document.getElementById('raisonSocialeGBM').value,
            numeroBC: document.getElementById('numeroBC').value,
            directionGBM: document.getElementById('directionGBM').value,
            souscripteur: document.getElementById('souscripteur').value,
            typeDocument: document.getElementById('typeDocument').value,
            dateRelanceBR: document.getElementById('dateRelanceBR').value,
            typeRelance: document.getElementById('typeRelance').value,
            dateTransmission: document.getElementById('dateTransmission').value,
            personnesCollectrice: document.getElementById('personnesCollectrice').value,
            dossierComplet: document.getElementById('dossierComplet').checked.toString()
        };

        const formData = new FormData();
        formData.append('commande', JSON.stringify(commandeData));
        formData.append('utilisateurId', userInfo.id);

        const fichierInput = document.getElementById('fichier');
        if (fichierInput.files.length > 0) {
            formData.append('fichier', fichierInput.files[0]);
        }

        const response = await fetch(`${API_BASE_URL}/BO/commandes`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de la création de la commande');
        }

        const commande = await response.json();

        showToast('Commande créée avec succès !', 'success');

        form.reset();
        form.classList.remove('was-validated');

    } catch (error) {
        console.error('Erreur:', error);
        showToast(`Erreur: ${error.message}`, 'error');
    } finally {
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
    }
}
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
        console.log('Commandes chargées:', commandes);
        showToast('Commandes chargées avec succès', 'info');

    } catch (error) {
        console.error('Erreur:', error);
        showToast(`Erreur lors du chargement des commandes: ${error.message}`, 'error');
    }
}

/* Nessaiba */
function toggleMenu() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// Synchroniser l'affichage du nom d'utilisateur
document.addEventListener('DOMContentLoaded', function() {
    const userName = document.getElementById('userName');
    const userNameMobile = document.getElementById('userNameMobile');
    if (userName && userNameMobile) {
        userNameMobile.textContent = userName.textContent;
    }

    // Marquer la page active dans le menu
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
});