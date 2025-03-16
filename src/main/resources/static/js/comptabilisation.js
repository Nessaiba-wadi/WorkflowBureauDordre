document.addEventListener('DOMContentLoaded', function() {
    // Charger les bons de commande disponibles
    chargerBonsDeCommande();

    // Configuration du drag & drop pour le fichier
    setupFileUpload();

    // Gestion du formulaire
    document.getElementById('comptabilisationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        envoyerComptabilisation();
    });
});

function chargerBonsDeCommande() {
    // Récupérer les bons de commandes depuis l'API
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    fetch('http://localhost:8082/comptabilisations/commandes-validees', {
        method: 'GET',
        headers: {
            'Authorization': userInfo.email
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const selectElement = document.getElementById('commandeSelect');

            // Vider les options existantes sauf la première
            while (selectElement.options.length > 1) {
                selectElement.remove(1);
            }

            // Filtrer pour ne garder que les commandes non comptabilisées
            const commandesNonComptabilisees = data.filter(commande => !commande.comptabilise);

            // Ajouter les nouvelles options
            commandesNonComptabilisees.forEach(commande => {
                const option = document.createElement('option');
                option.value = commande.idCommande;
                option.textContent = `BC-${commande.idCommande} - ${commande.reference || 'Sans référence'}`;
                selectElement.appendChild(option);
            });

            // Si aucune commande n'est disponible
            if (commandesNonComptabilisees.length === 0) {
                const option = document.createElement('option');
                option.disabled = true;
                option.textContent = "Aucune commande disponible à comptabiliser";
                selectElement.appendChild(option);
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            afficherToast('Erreur', 'Impossible de charger les bons de commande. ' + error.message, 'danger');
        });
}

function setupFileUpload() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fichierJoint');
    const browseButton = document.getElementById('browseButton');
    const fileInfo = document.getElementById('fileInfo');

    // Ouvrir le sélecteur de fichier en cliquant sur le bouton
    browseButton.addEventListener('click', function() {
        fileInput.click();
    });

    // Afficher le nom du fichier sélectionné
    fileInput.addEventListener('change', function() {
        updateFileInfo(this.files[0]);
    });

    // Gestion du drag & drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('highlight');
    }

    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            fileInput.files = files;
            updateFileInfo(files[0]);
        }
    }

    function updateFileInfo(file) {
        if (file) {
            // Vérifier le type de fichier
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validTypes.includes(file.type)) {
                fileInfo.innerHTML = `<span class="text-danger">Type de fichier non supporté: ${file.name}</span>`;
                fileInput.value = '';
                return;
            }

            // Afficher le nom du fichier
            fileInfo.innerHTML = `<span class="text-success"><i class="fas fa-file me-1"></i>${file.name}</span>`;
        } else {
            fileInfo.textContent = 'Aucun fichier sélectionné';
        }
    }
}

function envoyerComptabilisation() {
    // Récupérer l'ID utilisateur depuis la session
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.id) {
        afficherToast('Erreur', 'Utilisateur non authentifié', 'danger');
        return;
    }

    // Validation du formulaire
    const form = document.getElementById('comptabilisationForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    // Récupérer les valeurs du formulaire
    const commandeId = document.getElementById('commandeSelect').value;

    // Vérifier si une commande est sélectionnée
    if (!commandeId) {
        afficherToast('Erreur', 'Veuillez sélectionner un bon de commande valide', 'danger');
        return;
    }

    const dateTransmission = document.getElementById('dateTransmission').value;
    const personnesCollectrice = document.getElementById('personnesCollectrice').value;
    const commentaire = document.getElementById('commentaire').value;
    const fichier = document.getElementById('fichierJoint').files[0];

    // Créer l'objet comptabilisation avec la structure correcte
    const comptabilisationData = {
        dateTransmission: dateTransmission,
        personnesCollectrice: personnesCollectrice,
        commentaire: commentaire,
        commande: {
            idCommande: parseInt(commandeId)
        }
    };

    // Créer un FormData pour l'envoi multipart
    const formData = new FormData();
    formData.append('comptabilisationData', JSON.stringify(comptabilisationData));
    formData.append('utilisateurId', userInfo.id);

    if (fichier) {
        formData.append('file', fichier);
    }

    // Envoi de la requête
    fetch('http://localhost:8082/comptabilisations', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text || 'Une erreur est survenue');
                });
            }
            return response.text();
        })
        .then(data => {
            // Suppression de tous les messages d'erreur existants
            const alertsToRemove = document.querySelectorAll('.alert');
            alertsToRemove.forEach(alert => alert.remove());
            afficherToast('Succès', data, 'success');
            // Redirection vers la page des comptabilisations après succès
            setTimeout(() => {
                window.location.href = '/../../templates/comptable/commandes_à_comptabilisées.html';
            }, 2000);
        })
        .catch(error => {
            // Gestion spécifique pour l'erreur de commande déjà comptabilisée
            if (error.message.includes('déjà été comptabilisée')) {
                afficherToast('Erreur', 'Cette commande a déjà été comptabilisée. Une seule comptabilisation par commande est autorisée.', 'danger');
            } else {
                afficherToast('Erreur', error.message, 'danger');
            }
        });
}

function afficherToast(titre, message, type) {
    // Supprimer d'abord les toasts existants
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => {
        const bsToast = bootstrap.Toast.getInstance(toast);
        if (bsToast) {
            bsToast.hide();
        }
        toast.remove();
    });

    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        // Créer le conteneur s'il n'existe pas
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(container);
    }

    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center text-white bg-${type} border-0`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');

    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>${titre}:</strong> ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    const container = document.getElementById('toastContainer');
    container.appendChild(toastElement);

    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });

    toast.show();

    // Supprimer le toast du DOM après qu'il a été caché
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Récupérer l'ID de la commande depuis l'URL si disponible
    const urlParams = new URLSearchParams(window.location.search);
    const commandeIdParam = urlParams.get('id');

    // Dans le gestionnaire d'événement qui traite le paramètre d'URL
    if (commandeIdParam) {
        try {
            const decodedParam = JSON.parse(atob(commandeIdParam));
            const commandeId = decodedParam.id;

            // Attendre que les commandes soient chargées
            const checkSelect = setInterval(() => {
                const selectElement = document.getElementById('commandeSelect');
                if (selectElement.options.length > 1) {
                    clearInterval(checkSelect);

                    // Chercher l'option correspondante
                    const optionFound = Array.from(selectElement.options)
                        .some(option => option.value == commandeId);

                    // Si l'option n'est pas trouvée (probablement car déjà comptabilisée)
                    if (!optionFound) {
                        afficherToast('Attention', 'Cette commande a déjà été comptabilisée ou n\'est pas disponible.', 'warning');
                    } else {
                        // Sélectionner l'option
                        for (let i = 0; i < selectElement.options.length; i++) {
                            if (selectElement.options[i].value == commandeId) {
                                selectElement.selectedIndex = i;
                                break;
                            }
                        }
                    }
                }
            }, 100);
        } catch (error) {
            console.error('Erreur de décodage du paramètre:', error);
        }
    }
});