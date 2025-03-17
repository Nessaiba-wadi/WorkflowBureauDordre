document.addEventListener('DOMContentLoaded', function() {
    chargerBonsDeCommande();
    setupFileUpload();

    document.getElementById('reglementForm').addEventListener('submit', function(e) {
        e.preventDefault();
        envoyerReglement();
    });

    const urlParams = new URLSearchParams(window.location.search);
    const commandeIdParam = urlParams.get('id');

    if (commandeIdParam) {
        try {
            const decodedParam = JSON.parse(atob(commandeIdParam));
            const commandeId = decodedParam.id;

            const checkSelect = setInterval(() => {
                const selectElement = document.getElementById('commandeSelect');
                if (selectElement.options.length > 1) {
                    clearInterval(checkSelect);

                    const optionFound = Array.from(selectElement.options)
                        .some(option => option.value == commandeId);

                    if (!optionFound) {
                        afficherToast('Attention', 'Cette commande a déjà été réglée ou n\'est pas disponible.', 'warning');
                    } else {
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
            afficherToast('Erreur', 'Impossible de décoder les paramètres de l\'URL', 'danger');
        }
    }
});

function chargerBonsDeCommande() {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    fetch('http://localhost:8082/api/reglements/commandes-a-regler', {
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

            while (selectElement.options.length > 1) {
                selectElement.remove(1);
            }

            const commandesNonReglees = data.filter(commande =>
                commande.reglementStatus !== 'valide' && commande.reglementStatus !== 'validé');

            commandesNonReglees.forEach(commande => {
                const option = document.createElement('option');
                option.value = commande.idCommande;
                option.textContent = `${commande.numeroBC} / ${commande.raisonSocialeFournisseur}`;
                selectElement.appendChild(option);
            });

            if (commandesNonReglees.length === 0) {
                const option = document.createElement('option');
                option.disabled = true;
                option.textContent = "Aucune commande disponible à régler";
                selectElement.appendChild(option);
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            afficherToast('Erreur', 'Impossible de charger les bons de commande. ' + error.message, 'danger');
        });
}

// Dans la fonction envoyerReglement()
function envoyerReglement() {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.email) {
        afficherToast('Erreur', 'Utilisateur non authentifié', 'danger');
        return;
    }

    const form = document.getElementById('reglementForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const commandeId = document.getElementById('commandeSelect').value;
    const datePreparation = document.getElementById('datePreparation').value;
    const modeReglement = document.getElementById('modeReglement').value;
    const numeroCheque = document.getElementById('numeroCheque').value;
    const dateTransmission = document.getElementById('dateTransmission').value;
    const commentaire = document.getElementById('commentaire').value;
    const fichier = document.getElementById('fichierJoint').files[0];

    // Modification: envoyer directement les champs au lieu d'utiliser un reglementDTO
    const formData = new FormData();
    formData.append('commandeId', commandeId);
    formData.append('datePreparation', datePreparation);
    formData.append('modeReglement', modeReglement);
    formData.append('numeroCheque', numeroCheque);
    formData.append('dateTransmission', dateTransmission);
    formData.append('commentaire', commentaire);
    // Ajout: utiliser 'valide' au lieu de 'validé'
    formData.append('etatEnCoursValideEtc', 'valide');

    if (fichier) {
        formData.append('fichier', fichier);
    }

    fetch('http://localhost:8082/api/reglements/nouveau', {
        method: 'POST',
        headers: {
            'Authorization': userInfo.email
        },
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    try {
                        const data = JSON.parse(text);
                        throw new Error(data.message || 'Une erreur est survenue');
                    } catch (e) {
                        throw new Error('Une erreur est survenue lors du traitement de la réponse');
                    }
                });
            }
            return response.json();
        })
        .then(data => {
            afficherToast('Succès', data.message || 'Règlement créé avec succès', 'success');
            setTimeout(() => {
                window.location.href = 'commandes_à_régler.html';
            }, 2000);
        })
        .catch(error => {
            console.error('Erreur complète:', error);
            afficherToast('Erreur', error.message, 'danger');
        });
}
function afficherToast(titre, message, type) {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
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

    toastContainer.appendChild(toastElement);

    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });

    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

function setupFileUpload() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fichierJoint');
    const browseButton = document.getElementById('browseButton');
    const fileInfo = document.getElementById('fileInfo');

    browseButton.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        updateFileInfo(this.files[0]);
    });

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
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validTypes.includes(file.type)) {
                fileInfo.innerHTML = `<span class="text-danger">Type de fichier non supporté: ${file.name}</span>`;
                fileInput.value = '';
                return;
            }

            fileInfo.innerHTML = `<span class="text-success"><i class="fas fa-file me-1"></i>${file.name}</span>`;
        } else {
            fileInfo.textContent = 'Aucun fichier sélectionné';
        }
    }
}