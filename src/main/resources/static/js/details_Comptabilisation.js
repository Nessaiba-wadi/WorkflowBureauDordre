document.addEventListener('DOMContentLoaded', function() {

    // Initialise un conteneur pour les notifications toast
    function initToast() {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(container);
        }
    }

    // Affiche une notification toast personnalisée
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

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Formate une date au format français
    function formatDate(dateString) {
        if (!dateString) return 'Non renseigné';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Récupère et décode l'ID de la commande depuis l'URL
    function getCommandeIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedId = urlParams.get('id');

        if (!encodedId) return null;

        try {
            const data = JSON.parse(atob(encodedId));
            return data.id;
        } catch (error) {
            console.error('Erreur lors du décodage de l\'ID:', error);
            return null;
        }
    }

    // Fonction pour charger et afficher le fichier joint
// Fonction pour charger et afficher le fichier joint
    function afficherFichierJoint(fichierJointNom, containerId, messageId, previewId, contentId, isComptabilisation = false) {
        const fichierJointContainer = document.getElementById(containerId);
        const fichierJointMessage = document.getElementById(messageId);
        const fichierJointPreview = document.getElementById(previewId);
        const fichierJointContent = document.getElementById(contentId);

        // Si aucun fichier n'est joint
        if (!fichierJointNom) {
            fichierJointMessage.innerHTML = '<i class="fas fa-exclamation-circle text-warning"></i> Aucun fichier joint.';
            return;
        }

        // Construire l'URL du fichier en fonction du type (commande ou comptabilisation)
        const fichierUrl = isComptabilisation
            ? `http://localhost:8082/api/comptabilisations/fichier/${fichierJointNom}`
            : ``;

        // Déterminer le type de fichier par l'extension
        const extension = fichierJointNom.split('.').pop().toLowerCase();

        // Afficher le message de chargement
        fichierJointMessage.textContent = 'Chargement du fichier...';

        // Récupérer les informations utilisateur pour l'autorisation
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        const headers = {
            'Authorization': userInfo.email
        };

        // Créer les éléments en fonction du type de fichier
        if (extension === 'pdf') {
            // Pour les fichiers PDF, utiliser un iframe avec authentification
            fichierJointContent.innerHTML = `
            <div class="mb-3">
                <a href="${fichierUrl}" class="btn btn-primary" target="_blank">
                    <i class="fas fa-external-link-alt me-2"></i>Ouvrir dans un nouvel onglet
                </a>
            </div>
            <div class="embed-responsive embed-responsive-16by9">
                <iframe class="embed-responsive-item" src="${fichierUrl}" style="width: 100%; height: 500px; border: 1px solid #dee2e6;"></iframe>
            </div>
        `;
        } else if (extension === 'doc' || extension === 'docx') {
            // Pour les fichiers Word, proposer uniquement le téléchargement
            fichierJointContent.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>Les fichiers Word ne peuvent pas être prévisualisés directement.
            </div>
            <div>
                <a href="${fichierUrl}" class="btn btn-primary" download>
                    <i class="fas fa-download me-2"></i>Télécharger le fichier
                </a>
            </div>
        `;
        } else {
            // Pour les autres types de fichiers
            fichierJointContent.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>Ce type de fichier ne peut pas être prévisualisé.
            </div>
            <div>
                <a href="${fichierUrl}" class="btn btn-primary" download>
                    <i class="fas fa-download me-2"></i>Télécharger le fichier
                </a>
            </div>
        `;
        }

        // Afficher le contenu et masquer le message de chargement
        fichierJointMessage.classList.add('d-none');
        fichierJointPreview.classList.remove('d-none');
        fichierJointContent.classList.remove('d-none');
    }
    // Affiche les détails combinés de la commande et de la comptabilisation
// Affiche les détails combinés de la commande et de la comptabilisation
    function displayCombinedDetails(data) {
        console.log("Attempting to display data:", data);

        // Fonction utilitaire pour mettre à jour un élément s'il existe
        function updateElementIfExists(id, value, defaultValue = 'Non renseigné') {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || defaultValue;
            } else {
                console.warn(`Element with ID "${id}" not found in the DOM`);
            }
        }

        // État de la commande
        const commandeEtat = document.getElementById('commandeEtat');
        if (commandeEtat) {
            if (data.etat === 'validé') {
                commandeEtat.className = 'badge bg-success fs-6 p-2';
                commandeEtat.textContent = 'Validé';
            } else {
                commandeEtat.className = 'badge bg-warning fs-6 p-2';
                commandeEtat.textContent = 'En cours';
            }
            commandeEtat.style.visibility = 'visible';
        } else {
            console.warn('Element "commandeEtat" not found');
        }

        // Afficher le fichier joint de la commande
        if (document.getElementById('fichierJointContainer')) {
            afficherFichierJoint(data.fichierJointBO || data.fichierJoint, 'fichierJointContainer', 'fichierJointMessage', 'fichierJointPreview', 'fichierJointContent');
        } else {
            console.warn('Container for file attachment not found');
        }

        // Vérifier si la section de comptabilisation existe
        const sectionComptabilisation = document.getElementById('sectionComptabilisation');
        if (!sectionComptabilisation) {
            console.warn('Section comptabilisation not found');
            return;
        }

        // Si nous avons des données de comptabilisation
        if (data.idComptabilisation) {
            // Date de comptabilisation
            updateElementIfExists('dateComptabilisation', formatDate(data.dateComptabilisation));

            // État de la comptabilisation
            const etatComptabilisationElement = document.getElementById('etatComptabilisation');
            if (etatComptabilisationElement) {
                let badgeClass = 'bg-secondary';

                switch (data.etat) {
                    case 'validé':
                        badgeClass = 'bg-success';
                        break;
                    case 'en_attente':
                        badgeClass = 'bg-warning';
                        break;
                    case 'rejeté':
                        badgeClass = 'bg-danger';
                        break;
                }

                etatComptabilisationElement.className = `badge ${badgeClass}`;
                etatComptabilisationElement.textContent = data.etat || 'Non défini';
            }

            // Date de transmission comptabilisation
            updateElementIfExists('dateTransmissionCompta', formatDate(data.dateTransmission));

            // Commentaire
            updateElementIfExists('commentaireComptabilisation', data.commentaire, 'Aucun commentaire');

            // Personne collectrice comptabilisation
            updateElementIfExists('personneCollectriceCompta', data.personnesCollectriceComptable || data.personnesCollectrice);

            // Afficher le fichier joint de la comptabilisation
            if (document.getElementById('fichierJointComptaContainer')) {
                afficherFichierJoint(
                    data.fichierJointComptabilisation,
                    'fichierJointComptaContainer',
                    'fichierJointComptaMessage',
                    'fichierJointComptaPreview',
                    'fichierJointComptaContent',
                    true // Paramètre indiquant qu'il s'agit d'un fichier de comptabilisation
                );
            }
        } else {
            // Si pas de comptabilisation, masquer la section
            sectionComptabilisation.style.display = 'none';

            const fichierJointComptaContainer = document.getElementById('fichierJointComptaContainer');
            if (fichierJointComptaContainer) {
                fichierJointComptaContainer.innerHTML = '<div class="alert alert-info">Aucune comptabilisation associée à cette commande.</div>';
            }
        }
    }
    // Charge les détails combinés de la commande et de la comptabilisation depuis l'API
    async function chargerDetailsCombines() {
        try {
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));

            if (!userInfo || !userInfo.email) {
                throw new Error('Utilisateur non authentifié');
            }

            const commandeId = getCommandeIdFromUrl();
            if (!commandeId) {
                throw new Error('ID de commande non spécifié');
            }

            // Utiliser la nouvelle API pour récupérer les données combinées
            const response = await fetch(`http://localhost:8082/comptabilisations/commande/${commandeId}`, {
                method: 'GET',
                headers: {
                    'Authorization': userInfo.email
                }
            });

            if (!response.ok) {
                throw new Error(`Erreur lors du chargement des données: ${response.status}`);
            }

            const data = await response.json();
            console.log('Données combinées reçues:', data);
            displayCombinedDetails(data);

        } catch (error) {
            console.error('Erreur lors du chargement des détails:', error);
            showToast(error.message, 'danger');

            // Afficher un message d'erreur à la place des champs
            document.querySelectorAll('[id^="dateReception"], [id^="raisonSociale"], [id^="numeroBC"], [id^="direction"], [id^="souscripteur"], [id^="typeDocument"], [id^="dateRelance"], [id^="typeRelance"], [id^="dateComposition"], [id^="dateTransmission"], [id^="personne"], [id^="commentaire"], [id^="etat"]').forEach(el => {
                el.textContent = 'Erreur de chargement';
            });
        }
    }

    // Récupère et affiche le nom de l'utilisateur
    function afficherNomUtilisateur() {
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        if (userInfo) {
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = userInfo.prenom + ' ' + userInfo.nom;
            }
        }
    }

    // Initialisation
    initToast();
    afficherNomUtilisateur();
    chargerDetailsCombines();
});