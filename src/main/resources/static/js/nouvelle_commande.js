document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('commandeForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Vérification des champs obligatoires
        const requiredFields = [
            { id: 'raisonSocialeFournisseur', label: 'Raison Sociale Fournisseur' },
            { id: 'numeroBC', label: 'Numéro BC' },
            { id: 'directionGBM', label: 'Direction GBM' },
            { id: 'typeDocument', label: 'Type Document' },
            { id: 'dateRelanceBR', label: 'Date Relance BR' },
            { id: 'dateTransmission', label: 'Date Transmission' },
            { id: 'raisonSocialeGBM', label: 'Raison Sociale GBM' },
            { id: 'souscripteur', label: 'Souscripteur' },
            { id: 'typeRelance', label: 'Type Relance' }
        ];

        // Identifier les champs manquants avec leurs labels
        const missingFields = requiredFields.filter(field =>
            !document.getElementById(field.id).value.trim()
        );

        // Ajouter la classe 'is-invalid' aux champs manquants pour l'affichage visuel
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element.value.trim()) {
                element.classList.add('is-invalid');
            } else {
                element.classList.remove('is-invalid');
            }
        });

        if (missingFields.length > 0) {
            // Construire un message d'erreur détaillé avec la liste des champs manquants
            const missingFieldLabels = missingFields.map(field => field.label);
            let errorMessage = 'Veuillez remplir les champs obligatoires suivants:<br><ul>';
            missingFieldLabels.forEach(label => {
                errorMessage += `<li>${label}</li>`;
            });
            errorMessage += '</ul>';

            // Afficher le message d'erreur
            showMessage('error', errorMessage);
            return;
        }

        // Fonction pour formater les dates au format ISO (YYYY-MM-DD)
        const formatDate = (dateStr) => {
            if (!dateStr) return null;
            return dateStr; // Les dates HTML input sont déjà au format YYYY-MM-DD
        };

        // Récupération des données du formulaire
        const formData = new FormData();
        const commandeData = {
            raisonSocialeFournisseur: document.getElementById('raisonSocialeFournisseur').value,
            numeroBC: document.getElementById('numeroBC').value,
            directionGBM: document.getElementById('directionGBM').value,
            typeDocument: document.getElementById('typeDocument').value,
            dateRelanceBR: formatDate(document.getElementById('dateRelanceBR').value),
            dateTransmission: formatDate(document.getElementById('dateTransmission').value),
            raisonSocialeGBM: document.getElementById('raisonSocialeGBM').value,
            souscripteur: document.getElementById('souscripteur').value,
            typeRelance: document.getElementById('typeRelance').value,
            personnesCollectrice: document.getElementById('personnesCollectrice').value,
            dossierComplet: document.getElementById('dossierComplet').checked,
            status: true
        };

        console.log('Données de commande à envoyer:', commandeData);

        // Ajouter les données de la commande au FormData
        formData.append('commandeData', JSON.stringify(commandeData));

        // Ajouter le fichier
        const fichierInput = document.getElementById('fichier');
        if (fichierInput.files.length > 0) {
            formData.append('file', fichierInput.files[0]);
        }

        // Récupérer l'ID utilisateur depuis la session
        const utilisateurId = getUserIdFromSession() || 1;
        formData.append('utilisateurId', utilisateurId);

        // Afficher les données qui seront envoyées
        console.log('FormData contenu:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + (pair[0] === 'file' ? pair[1].name : pair[1]));
        }

        // Afficher le loader pendant le traitement
        document.getElementById('loader').style.display = 'flex';

        // Envoi de la requête
        fetch('http://localhost:8082/BO/commandes', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        })
            .then(response => {
                console.log('Statut de réponse:', response.status);
                // Tenter de lire la réponse comme JSON même en cas d'erreur
                return response.json().then(data => {
                    if (!response.ok) {
                        // Si la réponse contient un message d'erreur, on le lance
                        throw new Error(data.message || `Erreur HTTP ${response.status}`);
                    }
                    return data;
                }).catch(e => {
                    // Si on ne peut pas lire la réponse comme JSON
                    if (!response.ok) {
                        throw new Error(`Erreur HTTP ${response.status}`);
                    }
                    throw e;
                });
            })
            .then(data => {
                console.log('Réponse du serveur:', data);
                // Masquer le loader
                document.getElementById('loader').style.display = 'none';

                // Afficher le message de succès
                showMessage('success', 'Commande créée avec succès!');

                // Rediriger après un court délai pour que l'utilisateur puisse voir le message
                setTimeout(() => {
                    window.location.href = '../templates/BO/commandes.html';
                }, 1500);
            })
            .catch(error => {
                console.error('Erreur détaillée:', error);
                // Masquer le loader
                document.getElementById('loader').style.display = 'none';

                // Afficher le message d'erreur
                showMessage('error', 'Erreur lors de la création de la commande: ' + error.message);
            });
    });

    // Ajouter un écouteur d'événement pour réinitialiser les validations lorsque l'utilisateur modifie un champ
    document.querySelectorAll('.form-control, .form-select').forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('is-invalid');
        });
    });

    // Fonction pour afficher les messages (succès ou erreur)
    function showMessage(type, message) {
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('messageModalTitle');
        const modalBody = document.getElementById('messageModalBody');
        const modalDialog = document.querySelector('#messageModal .modal-dialog');

        // Définir le titre et le contenu
        modalTitle.textContent = type === 'success' ? 'Succès' : 'Erreur';
        modalBody.innerHTML = message; // Utiliser innerHTML pour permettre le HTML dans le message

        // Définir la classe du modal selon le type de message
        modalDialog.classList.remove('modal-success', 'modal-danger');
        modalDialog.classList.add(type === 'success' ? 'modal-success' : 'modal-danger');

        // Afficher le modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }

    // Fonction pour récupérer l'ID utilisateur de la session
    function getUserIdFromSession() {
        // Récupérer l'ID utilisateur depuis le localStorage, sessionStorage, cookies, etc.
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const user = JSON.parse(userInfo);
                return user.id;
            } catch (e) {
                console.error('Erreur lors de la récupération de l\'ID utilisateur:', e);
            }
        }
        // Ajouter un message de journalisation si aucun utilisateur n'est trouvé
        console.warn('Aucun utilisateur trouvé dans la session, utilisation de l\'ID par défaut (1)');
        return null;
    }

    // Ajouter un élément div pour le loader s'il n'existe pas déjà
    if (!document.getElementById('loader')) {
        const loaderDiv = document.createElement('div');
        loaderDiv.id = 'loader';
        loaderDiv.style.display = 'none';
        loaderDiv.style.position = 'fixed';
        loaderDiv.style.top = '0';
        loaderDiv.style.left = '0';
        loaderDiv.style.width = '100%';
        loaderDiv.style.height = '100%';
        loaderDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
        loaderDiv.style.zIndex = '9999';
        loaderDiv.style.justifyContent = 'center';
        loaderDiv.style.alignItems = 'center';

        const spinner = document.createElement('div');
        spinner.className = 'spinner-border text-light';
        spinner.setAttribute('role', 'status');

        const spinnerText = document.createElement('span');
        spinnerText.className = 'visually-hidden';
        spinnerText.textContent = 'Chargement...';

        spinner.appendChild(spinnerText);
        loaderDiv.appendChild(spinner);
        document.body.appendChild(loaderDiv);
    }
});