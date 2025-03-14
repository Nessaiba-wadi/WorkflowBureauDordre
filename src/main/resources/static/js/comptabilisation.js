document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les toasts
    initToast();

    // Récupérer l'ID de la commande depuis l'URL de manière sécurisée
    const urlParams = new URLSearchParams(window.location.search);
    const encodedRef = urlParams.get('ref');

    let idCommande;
    try {
        if (!encodedRef) throw new Error('Référence manquante');
        const data = JSON.parse(atob(encodedRef));
        idCommande = data.id;

        if (!idCommande) throw new Error('ID de commande invalide');
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Référence de commande invalide ou manquante', 'danger');
        setTimeout(() => {
            window.location.href = 'comptabilisations.html';
        }, 2000);
        return;
    }

    // Définir l'ID de la commande dans le formulaire (en caché)
    const idCommandeInput = document.createElement('input');
    idCommandeInput.type = 'hidden';
    idCommandeInput.id = 'idCommande';
    idCommandeInput.name = 'idCommande';
    idCommandeInput.value = idCommande;
    document.getElementById('comptabilisationForm').appendChild(idCommandeInput);

    // Reste du code pour la gestion du formulaire...
    const form = document.getElementById('comptabilisationForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Valider le formulaire
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        // Récupérer les données du formulaire
        const formData = new FormData();

        // Ajouter le fichier s'il existe
        const fichierInput = document.getElementById('fichier');
        if (fichierInput.files.length > 0) {
            formData.append('file', fichierInput.files[0]);
        }

        // Récupérer les infos utilisateur
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        if (!userInfo) {
            showToast('Utilisateur non authentifié', 'danger');
            return;
        }

        // Préparer l'objet comptabilisation
        const comptabilisation = {
            commande: { idCommande: parseInt(idCommande) },
            dateTransmission: document.getElementById('dateTransmission').value,
            personnesCollectrice: document.getElementById('personnesCollectrice').value,
            commentaire: document.getElementById('commentaire').value,
            etat: 'validé' // État par défaut
        };

        // Ajouter les données de comptabilisation
        formData.append('comptabilisationData', JSON.stringify(comptabilisation));
        formData.append('utilisateurId', userInfo.id);

        // Envoyer les données
        fetch('http://localhost:8082/comptabilisations', {
            method: 'POST',
            headers: {
                'Authorization': userInfo.email
            },
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(text || 'Erreur lors de la création de la comptabilisation');
                    });
                }
                return response.text();
            })
            .then(message => {
                showToast('Comptabilisation créée avec succès', 'success');
                setTimeout(() => {
                    window.location.href = 'comptabilisations.html';
                }, 2000);
            })
            .catch(error => {
                showToast(error.message, 'danger');
            });
    });

    // Afficher le nom de l'utilisateur connecté
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (userInfo) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userInfo.prenom + ' ' + userInfo.nom;
        }
    }
});