document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour initialiser le conteneur de toasts
    function initToast() {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(container);
        }
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

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Fonction pour formater la date
    function formatDate(dateString) {
        if (!dateString) return 'Non renseigné';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Récupère l'ID de la commande depuis l'URL
    function getCommandeIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // Fonction pour charger et afficher le fichier joint
    function afficherFichierJoint(fichierJointNom) {
        const fichierJointContainer = document.getElementById('fichierJointContainer');
        const fichierJointMessage = document.getElementById('fichierJointMessage');
        const fichierJointPreview = document.getElementById('fichierJointPreview');
        const fichierJointContent = document.getElementById('fichierJointContent');

        // Si aucun fichier n'est joint
        if (!fichierJointNom) {
            fichierJointMessage.innerHTML = '<i class="fas fa-exclamation-circle text-warning"></i> Aucun fichier joint pour cette commande.';
            return;
        }

        // Construire l'URL du fichier
        const fichierUrl = `http://localhost:8082/api/files/${fichierJointNom}`;

        // Déterminer le type de fichier par l'extension
        const extension = fichierJointNom.split('.').pop().toLowerCase();

        // Afficher le message de chargement
        fichierJointMessage.textContent = 'Chargement du fichier...';

        // Créer les éléments en fonction du type de fichier
        if (extension === 'pdf') {
            // Pour les fichiers PDF, utiliser un iframe
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
                <a href="${fichierUrl}" class="btn btn-primary" target="_blank">
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
                <a href="${fichierUrl}" class="btn btn-primary" target="_blank">
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
    // Fonction pour afficher les détails de la commande dans les champs appropriés
    function displayCommandeDetails(commande) {
        // Informations générales
        document.getElementById('idCommande').textContent = commande.idCommande || 'N/A';

        // État de la commande
        const commandeEtat = document.getElementById('commandeEtat');
        if (commande.dossierComplet) {
            commandeEtat.className = 'badge bg-success fs-6 p-2';
            commandeEtat.textContent = 'Complet';
        } else {
            commandeEtat.className = 'badge bg-warning fs-6 p-2';
            commandeEtat.textContent = 'En cours';
        }

        // Section Réception
        document.getElementById('dateReception').textContent = formatDate(commande.dateReception);
        document.getElementById('raisonSocialeFournisseur').textContent = commande.raisonSocialeFournisseur || 'Non renseigné';
        document.getElementById('raisonSocialeGBM').textContent = commande.raisonSocialeGBM || 'Non renseigné';
        document.getElementById('numeroBC').textContent = commande.numeroBC || 'N/A';
        document.getElementById('directionGBM').textContent = commande.directionGBM || 'Non renseigné';
        document.getElementById('souscripteur').textContent = commande.souscripteur || 'Non renseigné';
        document.getElementById('typeDocument').textContent = commande.typeDocument || 'Non renseigné';

        // Section Suivi Souscripteur
        document.getElementById('dateRelanceBR').textContent = formatDate(commande.dateRelanceBR);
        document.getElementById('typeRelance').textContent = commande.typeRelance || 'Non renseigné';


        // Afficher le fichier joint s'il existe
        afficherFichierJoint(commande.fichierJoint);

        // Modification pour afficher l'état du dossier selon l'état de la commande
        const dateCompositionElement = document.getElementById('dateCompositionDossier');
        if (commande.dossierComplet) {
            dateCompositionElement.textContent = 'DOSSIER COMPLET';
            dateCompositionElement.className = 'border-bottom pb-2';
        } else {
            dateCompositionElement.textContent = 'EN COURS';
            dateCompositionElement.className = 'border-bottom pb-2 text-warning fw-bold';
        }

        // Section Transmission DCF
        document.getElementById('dateTransmission').textContent = formatDate(commande.dateTransmission);

        // Correction pour afficher la personne collectrice correctement
        const personneCollectriceElement = document.getElementById('personneCollectrice');
        if (commande.personnesCollectrice) {
            personneCollectriceElement.textContent = commande.personnesCollectrice;
        } else {
            personneCollectriceElement.textContent = 'Non renseigné';
        }
    }

    // Charge les détails de la commande depuis l'API
    async function chargerDetailsCommande() {
        try {
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));

            if (!userInfo || !userInfo.email) {
                throw new Error('Utilisateur non authentifié');
            }

            const commandeId = getCommandeIdFromUrl();

            if (!commandeId) {
                throw new Error('ID de commande non spécifié');
            }


            // Afficher un état de chargement
            document.querySelectorAll('[id^="chargement"]').forEach(el => {
                el.textContent = 'Chargement en cours...';
            });

            const response = await fetch(`http://localhost:8082/BO/commandes/${commandeId}`, {
                method: 'GET',
                headers: {
                    'Authorization': userInfo.email
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Réponse API non OK:', response.status, errorText);
                throw new Error(`Erreur ${response.status}: Impossible de récupérer les détails de la commande`);
            }

            const commande = await response.json();
            console.log('Données reçues:', commande);  // Log pour débogage
            displayCommandeDetails(commande);

        } catch (error) {
            console.error('Erreur lors du chargement des détails de la commande:', error);

            // Afficher un message d'erreur à la place des champs
            document.querySelectorAll('[id^="chargement"]').forEach(el => {
                el.textContent = 'Erreur de chargement';
            });

            // Afficher le toast d'erreur
            showToast(error.message, 'danger');
        }
    }

    // Récupère et affiche le nom de l'utilisateur
    function afficherNomUtilisateur() {
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
        if (userInfo) {
            const userNameElement = document.getElementById('userName');
            userNameElement.textContent = userInfo.prenom + ' ' + userInfo.nom;
        }
    }

    // Initialisation
    initToast();
    afficherNomUtilisateur();
    chargerDetailsCommande();



    //voir le fichier joint
    // Fonction pour afficher le fichier joint

});