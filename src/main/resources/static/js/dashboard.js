document.addEventListener('DOMContentLoaded', async function() {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (!userInfo) {
        window.location.href = '../../templates/login.html';
        return;
    }

    try {
        // Appel à l'API pour récupérer les détails de l'utilisateur
        const response = await fetch(`/utilisateurs/${userInfo.id}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des détails utilisateur');
        }
        const userDetails = await response.json();

        // Mise à jour des informations dans le dropdown
        document.getElementById('userName').textContent = `${userDetails.prenom} ${userDetails.nom}`;
        document.getElementById('userRole').textContent = `Role: ${userDetails.role}`;
    } catch (error) {
        console.error('Erreur:', error);
        // En cas d'erreur, on utilise les données de base du sessionStorage
        document.getElementById('userName').textContent = `${userInfo.prenom} ${userInfo.nom}`;
        document.getElementById('userRole').textContent = `Role: ${userInfo.role}`;
    }

    initializeForm();
});

function deconnexion() {
    sessionStorage.clear();
    window.location.href = '../../templates/login.html';
}

function initializeForm() {
    const form = document.getElementById('commandeForm');
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateRelanceBR').min = today;
    document.getElementById('dateTransmission').min = today;
    form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
    e.preventDefault();

    if (!this.checkValidity()) {
        e.stopPropagation();
        this.classList.add('was-validated');
        return;
    }

    try {
        const formData = new FormData();
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

        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        formData.append('commandeData', JSON.stringify(commandeData));
        formData.append('utilisateurId', userInfo.id);

        const fileInput = document.getElementById('fichier');
        if (fileInput.files.length > 0) {
            formData.append('file', fileInput.files[0]);
        }

        const response = await fetch('/BO/commandes', {
            method: 'POST',
            body: formData
        });

        const responseData = await response.text();

        if (response.ok) {
            alert('Commande créée avec succès!');
            this.reset();
            this.classList.remove('was-validated');
        } else {
            alert(responseData);
        }
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}