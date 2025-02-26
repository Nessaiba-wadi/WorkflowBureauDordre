const API_BASE_URL = 'http://localhost:8082';

document.addEventListener('DOMContentLoaded', async function() {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (!userInfo) {
        window.location.href = '../../templates/login.html';
        return;
    }

    try {
        // Modifiez l'URL pour inclure l'URL de base
        const response = await fetch(`${API_BASE_URL}/utilisateurs/${userInfo.id}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des détails utilisateur');
        }
        const userDetails = await response.json();

        document.getElementById('userName').textContent = `${userDetails.prenom} ${userDetails.nom}`;
        document.getElementById('userId').textContent = `${userInfo.id}`; // Affiche l'ID
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('userName').textContent = `${userInfo.prenom} ${userInfo.nom}`;
        document.getElementById('userId').textContent = `${userInfo.id}`; // Affiche l'ID
    }

    initializeForm();
});

function deconnexion() {
    sessionStorage.clear();
    window.location.href = '../../templates/login.html';
}

function openUserSettings() {
    // Implémentation à venir
    alert('Fonctionnalité en cours de développement');
}

function initializeForm() {
    const form = document.getElementById('commandeForm');
    if (!form) return;

    // Définir les dates minimales pour les champs de date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateRelanceBR').min = today;
    document.getElementById('dateTransmission').min = today;

    // Ajouter un écouteur d'événement pour la soumission du formulaire
    form.addEventListener('submit', handleSubmit);

    // Activer la validation Bootstrap
    form.classList.add('was-validated');
}

async function handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
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

        // Récupérer les valeurs du formulaire
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
            dossierComplet: document.getElementById('dossierComplet').checked
        };

        // Créer un objet FormData pour l'envoi multipart
        const formData = new FormData();
        formData.append('commande', JSON.stringify(commandeData));
        formData.append('utilisateurId', userInfo.id);

        // Ajouter le fichier s'il existe
        const fichierInput = document.getElementById('fichier');
        if (fichierInput.files.length > 0) {
            formData.append('fichier', fichierInput.files[0]);
        }

        // Envoyer la requête à l'API
        const response = await fetch(`${API_BASE_URL}/BO/commandes`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de la création de la commande');
        }

        const commande = await response.json();

        // Afficher un message de succès
        alert('Commande créée avec succès !');

        // Réinitialiser le formulaire
        form.reset();
        form.classList.remove('was-validated');

    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur: ${error.message}`);
    } finally {
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
    }
}

// Charger les commandes de l'utilisateur (cette fonction pourra être utilisée ultérieurement)
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
        // À implémenter: affichage des commandes dans l'interface
        console.log('Commandes chargées:', commandes);

    } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur lors du chargement des commandes: ${error.message}`);
    }
}