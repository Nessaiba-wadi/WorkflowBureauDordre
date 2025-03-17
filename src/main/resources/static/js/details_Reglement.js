// Variables globales
let commandeId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si la fonction d'authentification existe
    if (typeof isAuthenticated !== 'function') {
        // Définir une fonction d'authentification basique si elle n'existe pas
        window.isAuthenticated = function() {
            return sessionStorage.getItem('userInfo') !== null;
        };
    }

    // Vérifier l'authentification
    if (!isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    // Récupérer l'ID de la commande depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const commandeEncodee = urlParams.get('id');

    if (!commandeEncodee) {
        showToast('Identifiant de commande manquant', 'danger');
        return;
    }

    try {
        // Décoder l'ID de la commande
        const commandeData = JSON.parse(atob(commandeEncodee));
        commandeId = commandeData.id;

        // Charger les détails de la commande
        loadCommandeDetails(commandeId);

        // Charger les détails de la comptabilisation
        loadComptabilisationDetails(commandeId);

        // Vérifier si un règlement existe pour cette commande
        checkReglementExists(commandeId);
    } catch (error) {
        console.error('Erreur lors du décodage de l\'ID de la commande:', error);
        showToast('Format d\'identifiant invalide', 'danger');
    }
});

// Charger les détails de la commande
function loadCommandeDetails(commandeId) {
    fetch(`http://localhost:8082/BO/commandes/${commandeId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des détails de la commande');
            }
            return response.json();
        })
        .then(data => {
            // Afficher les détails de base de la commande si nécessaire
            // Cette fonction peut être étendue selon vos besoins
            console.log('Détails de la commande chargés avec succès:', data);
        })
        .catch(error => {
            console.error('Erreur:', error);
            //showToast('Erreur lors du chargement des détails de la commande', 'danger');
        });
}

// Charger les détails de comptabilisation
function loadComptabilisationDetails(commandeId) {
    fetch(`http://localhost:8082/comptabilisations/commandeTre/${commandeId}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Aucune comptabilisation trouvée pour cette commande');
                }
                throw new Error('Erreur lors de la récupération des détails de comptabilisation');
            }
            return response.json();
        })
        .then(data => {
            // Afficher les détails de comptabilisation
            document.getElementById('dateComptabilisation').textContent =
                data.dateComptabilisation ? new Date(data.dateComptabilisation).toLocaleDateString('fr-FR') : 'Non spécifiée';
            document.getElementById('dateTransmissionCompta').textContent =
                data.dateTransmission ? new Date(data.dateTransmission).toLocaleDateString('fr-FR') : 'Non spécifiée';
            document.getElementById('personneCollectriceCompta').textContent = data.personnesCollectriceComptable || 'Non spécifiée';
            document.getElementById('commentaireComptabilisation').textContent = data.commentaire || 'Aucun commentaire';

            // Traiter le fichier joint de comptabilisation
            if (data.fichierJointComptabilisation) {
                document.getElementById('fichierJointComptaMessage').innerHTML = `
                    <a href="http://localhost:8082/api/comptabilisations/fichier/${data.fichierJointComptabilisation}" class="btn btn-primary" target="_blank">
                        <i class="fas fa-download me-2"></i>Télécharger le fichier
                    </a>`;
            } else {
                document.getElementById('fichierJointComptaMessage').textContent = 'Aucun fichier joint';
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            document.getElementById('dateComptabilisation').textContent = 'N/A';
            document.getElementById('dateTransmissionCompta').textContent = 'N/A';
            document.getElementById('personneCollectriceCompta').textContent = 'N/A';
            document.getElementById('commentaireComptabilisation').textContent = 'N/A';
            document.getElementById('fichierJointComptaMessage').textContent = 'Aucun fichier disponible';

            showToast(error.message, 'warning');
        });
}

// Vérifier si un règlement existe pour la commande
function checkReglementExists(commandeId) {
    fetch(`http://localhost:8082/api/reglements/commande/${commandeId}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    // Aucun règlement trouvé - masquer les sections de règlement
                    document.getElementById('sectionReglement').style.display = 'none';
                    document.getElementById('sectionFichierReglement').style.display = 'none';

                    // Afficher l'état de la commande
                    document.getElementById('commandeEtat').textContent = 'En attente de règlement';
                    document.getElementById('commandeEtat').className = 'badge bg-warning fs-6 p-2 me-3';
                    document.getElementById('commandeEtat').style.visibility = 'visible';

                    return null;
                }
                throw new Error('Erreur lors de la vérification du règlement');
            }
            return response.json();
        })
        .then(data => {
            if (data) {
                // Si un règlement existe, charger ses détails
                const reglementId = data;
                loadReglementDetails(reglementId);

                // Afficher l'état de la commande
                document.getElementById('commandeEtat').textContent = 'Règlement effectué';
                document.getElementById('commandeEtat').className = 'badge bg-success fs-6 p-2 me-3';
                document.getElementById('commandeEtat').style.visibility = 'visible';
            }
        })
        .catch(error => {
            console.error('Erreur lors de la vérification du règlement:', error);
            showToast('Erreur lors de la vérification du règlement', 'danger');
        });
}

// Charger les détails du règlement
function loadReglementDetails(reglementId) {
    fetch(`http://localhost:8082/api/reglements/details/${reglementId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des détails du règlement');
            }
            return response.json();
        })
        .then(data => {
            // Afficher les sections de règlement
            document.getElementById('sectionReglement').style.display = 'block';
            document.getElementById('sectionFichierReglement').style.display = 'block';

            // Afficher les détails du règlement
            document.getElementById('datePreparation').textContent =
                data.datePreparation ? new Date(data.datePreparation).toLocaleDateString('fr-FR') : 'Non spécifiée';
            document.getElementById('dateTransmissionReglement').textContent =
                data.dateTransmission ? new Date(data.dateTransmission).toLocaleDateString('fr-FR') : 'Non spécifiée';
            document.getElementById('modeReglement').textContent = data.modeReglement || 'Non spécifié';
            document.getElementById('numeroCheque').textContent = data.numeroCheque || 'Non spécifié';
            document.getElementById('commentaireReglement').textContent = data.commentaire || 'Aucun commentaire';

            // Afficher l'utilisateur qui a préparé le règlement
            if (data.utilisateur) {
                document.getElementById('utilisateurReglement').textContent = data.utilisateur.email || 'Non spécifié';
            } else {
                document.getElementById('utilisateurReglement').textContent = 'Non spécifié';
            }

            // Normaliser l'état du règlement (convertir "validé" en "valide" si nécessaire)
            let etatReglement = data.etatEnCoursValideEtc || 'Non spécifié';
            if (etatReglement === 'validé') {
                etatReglement = 'valide';
            }

            // Afficher l'état du règlement avec un badge coloré
            const etatReglementBadge = document.getElementById('etatReglementBadge');
            etatReglementBadge.textContent = etatReglement;

            // Définir la classe du badge en fonction de l'état
            if (etatReglement === 'valide') {
                etatReglementBadge.className = 'badge bg-success';
            } else if (etatReglement === 'en cours') {
                etatReglementBadge.className = 'badge bg-warning text-dark';
            } else {
                etatReglementBadge.className = 'badge bg-secondary';
            }

            // Traiter le fichier joint du règlement
            if (data.fichierJoint) {
                document.getElementById('fichierJointReglementMessage').innerHTML = '';
                document.getElementById('fichierJointReglementPreview').classList.remove('d-none');
                document.getElementById('fichierJointReglementLink').href = `http://localhost:8082/api/reglements/fichier/${reglementId}`;
            } else {
                document.getElementById('fichierJointReglementMessage').textContent = 'Aucun fichier joint';
                document.getElementById('fichierJointReglementPreview').classList.add('d-none');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showToast('Erreur lors du chargement des détails du règlement', 'danger');
        });
}

// Afficher un toast (notification)
function showToast(message, type = 'primary') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = 'toast-' + Date.now();

    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
            <div class="toast-header">
                <strong class="me-auto">Notification</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Fermer"></button>
            </div>
            <div class="toast-body bg-${type} text-${type === 'warning' || type === 'info' ? 'dark' : 'white'}">
                ${message}
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();

    // Supprimer le toast après qu'il disparaît
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}