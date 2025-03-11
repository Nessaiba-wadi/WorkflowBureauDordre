document.addEventListener('DOMContentLoaded', function() {
    // Initialise un conteneur pour les notifications toast
    function initToast() {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Affiche une notification toast personnalisée
    function showToast(message, type = 'success') {
        // Crée l'élément toast avec le type et le message spécifiés
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');

        // Structure HTML du toast avec message et bouton de fermeture
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        // Ajoute et affiche le toast
        const toastContainer = document.getElementById('toastContainer');
        toastContainer.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Supprime le toast après sa fermeture
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Formate une date au format français
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Formate une date ISO pour les champs de formulaire date
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    // Détermine l'état visuel d'une commande
    function getEtatCommande(commande) {
        // Génère un badge de couleur basé sur l'état du dossier
        if (commande.dossierComplet) {
            return '<span class="badge bg-success">Complet</span>';
        }
        return '<span class="badge bg-warning">En cours</span>';
    }

    // Stocke toutes les commandes pour le filtrage
    let allCommandes = [];

    // Configuration de la pagination
    let currentPage = 1;
    const rowsPerPage = 10;
    let totalPages = 0;
    let filteredCommandes = [];

    // Filtre dynamique des commandes
    function filterCommandes() {
        // Récupère les valeurs des filtres
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const directionFilter = document.getElementById('directionFilter').value;
        const etatFilter = document.getElementById('etatFilter').value;

        // Applique les filtres multi-critères
        filteredCommandes = allCommandes.filter(commande => {
            // Recherche globale sur toutes les colonnes
            const searchMatch = searchTerm ? Object.values(commande).some(value =>
                String(value).toLowerCase().includes(searchTerm)
            ) : true;

            // Filtre par direction
            const directionMatch = directionFilter ?
                commande.directionGBM === directionFilter : true;

            // Filtre par état (Complet/En cours)
            const etatMatch = etatFilter ?
                (etatFilter === 'Complet' ? commande.dossierComplet : !commande.dossierComplet) : true;

            // Combine tous les filtres
            return searchMatch && directionMatch && etatMatch;
        });

        // Réinitialise la pagination à la première page quand on filtre
        currentPage = 1;
        totalPages = Math.ceil(filteredCommandes.length / rowsPerPage);

        // Affiche les commandes filtrées pour la page courante
        renderCommandesPage();
    }

    // Peuple le menu déroulant des directions
    function populateDirectionFilter(commandes) {
        const directionFilter = document.getElementById('directionFilter');

        // Extrait les directions uniques
        const directions = [...new Set(commandes.map(c => c.directionGBM).filter(Boolean))];

        // Ajoute chaque direction comme option
        directions.forEach(direction => {
            const option = document.createElement('option');
            option.value = direction;
            option.textContent = direction;
            directionFilter.appendChild(option);
        });
    }

    // Affiche les commandes de la page courante
    function renderCommandesPage() {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const currentPageCommandes = filteredCommandes.slice(startIndex, endIndex);

        renderCommandes(currentPageCommandes);
        updatePaginationControls();
    }

    // Met à jour les contrôles de pagination
    function updatePaginationControls() {
        const paginationContainer = document.getElementById('paginationContainer');
        totalPages = Math.ceil(filteredCommandes.length / rowsPerPage);

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        // Crée la structure HTML de la pagination
        let paginationHTML = `
            <nav aria-label="Navigation des pages de commandes">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="prev" aria-label="Précédent">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
        `;

        // Affiche les numéros de page
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        paginationHTML += `
                    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="next" aria-label="Suivant">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                </ul>
            </nav>
            <div class="text-center text-muted">
                <small>Affichage de ${(currentPage - 1) * rowsPerPage + 1} à ${Math.min(currentPage * rowsPerPage, filteredCommandes.length)} sur ${filteredCommandes.length} commandes</small>
            </div>
        `;

        paginationContainer.innerHTML = paginationHTML;

        // Ajoute les gestionnaires d'événements pour les liens de pagination
        document.querySelectorAll('.pagination .page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.getAttribute('data-page');

                if (page === 'prev') {
                    if (currentPage > 1) currentPage--;
                } else if (page === 'next') {
                    if (currentPage < totalPages) currentPage++;
                } else {
                    currentPage = parseInt(page);
                }

                renderCommandesPage();
            });
        });
    }

    // Génère le tableau des commandes
    function renderCommandes(commandes) {
        const commandesBody = document.getElementById('commandesBody');
        commandesBody.innerHTML = '';


        // Filtrer pour n'afficher que les commandes avec status = true
        const commandesActives = commandes.filter(commande => commande.status === true);

        // Gère le cas où aucune commande n'est trouvée
        if (commandes.length === 0) {
            commandesBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted py-4">
                        Aucune commande trouvée
                    </td>
                </tr>
            `;
            return;
        }

        // Crée les lignes du tableau pour chaque commande
        const rows = commandes.map(commande => {
            // N'affiche le bouton de modification que pour les commandes "En cours"
            const actionButtons = commande.dossierComplet ?
                `<button class="btn btn-sm btn-info" onclick="voirDetailsCommande(${commande.idCommande})">
                    <i class="fas fa-eye"></i>
                </button>` :
                `<div class="btn-group" role="group">
                    <button class="btn btn-sm btn-info" onclick="voirDetailsCommande(${commande.idCommande})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="modifierCommande(${commande.idCommande})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>`;

            return `
                <tr>
                    <td>${formatDate(commande.dateModification)}</td>
                    <td>${commande.raisonSocialeFournisseur || 'N/A'}</td>
                    <td>${commande.raisonSocialeGBM || 'N/A'}</td>
                    <td>${commande.numeroBC || 'N/A'}</td>
                    <td>${commande.directionGBM || 'N/A'}</td>
                    <td>${commande.souscripteur || 'N/A'}</td>
                    <td>${commande.typeDocument || 'N/A'}</td>
                    <td>${getEtatCommande(commande)}</td>
                    <td>${actionButtons}</td>
                </tr>
            `;
        }).join('');

        // Insère les lignes dans le tableau
        commandesBody.innerHTML = rows;
    }

    // Charge les commandes depuis l'API
    async function chargerCommandes() {
        try {
            // Vérifie l'authentification de l'utilisateur
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
            if (!userInfo || !userInfo.email) {
                throw new Error('Utilisateur non authentifié');
            }

            // Requête API pour récupérer les commandes
            const response = await fetch('http://localhost:8082/BO/commandes', {
                method: 'GET',
                headers: {
                    'Authorization': userInfo.email
                }
            });

            // Stocke toutes les commandes
            allCommandes = await response.json();

            // Trier les commandes par date de modification décroissante (plus récentes en premier)
            allCommandes.sort((a, b) => {
                const dateA = a.dateModification ? new Date(a.dateModification) : new Date(0);
                const dateB = b.dateModification ? new Date(b.dateModification) : new Date(0);
                return dateB - dateA; // Ordre décroissant
            });
            filteredCommandes = [...allCommandes];
            totalPages = Math.ceil(filteredCommandes.length / rowsPerPage);

            // Supprime l'indicateur de chargement
            const loadingRow = document.getElementById('loadingRow');
            if (loadingRow) {
                loadingRow.remove();
            }

            // Prépare l'interface de filtrage
            populateDirectionFilter(allCommandes);
            renderCommandesPage();

            // Configure les écouteurs d'événements pour le filtrage
            document.getElementById('searchInput').addEventListener('input', _.debounce(filterCommandes, 300));
            document.getElementById('directionFilter').addEventListener('change', filterCommandes);
            document.getElementById('etatFilter').addEventListener('change', filterCommandes);

            // Gère la réinitialisation des filtres
            document.getElementById('resetFilters').addEventListener('click', () => {
                document.getElementById('searchInput').value = '';
                document.getElementById('directionFilter').value = '';
                document.getElementById('etatFilter').value = '';
                filteredCommandes = [...allCommandes];
                currentPage = 1;
                totalPages = Math.ceil(filteredCommandes.length / rowsPerPage);
                renderCommandesPage();
            });

        } catch (error) {
            // Gestion des erreurs de chargement
            console.error('Erreur lors du chargement des commandes:', error);
            showToast(error.message, 'danger');
        }
    }

    // Fonctions globales pour les actions sur les commandes

    window.voirDetailsCommande = function(idCommande) {
        window.location.href = `details.html?id=${idCommande}`;
    }



    // Initialisation de l'interface
    initToast();
    chargerCommandes();

    // Affiche le nom de l'utilisateur connecté
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (userInfo) {
        const userNameElement = document.getElementById('userName');
        userNameElement.textContent = userInfo.prenom + ' ' + userInfo.nom;
    }

    //modifier une commande :
    // Fonction globale pour modifier une commande
    window.modifierCommande = async function(idCommande) {
        try {
            // Récupérer les informations de l'utilisateur connecté
            const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
            if (!userInfo || !userInfo.email) {
                throw new Error('Utilisateur non authentifié');
            }

            // Récupérer les détails de la commande depuis l'API
            const response = await fetch(`http://localhost:8082/BO/commandes/${idCommande}`, {
                method: 'GET',
                headers: {
                    'Authorization': userInfo.email
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la récupération des détails de la commande');
            }

            const commande = await response.json();

            // Pré-remplir le formulaire avec les données existantes
            document.getElementById('modif-raisonSocialeFournisseur').value = commande.raisonSocialeFournisseur || '';
            document.getElementById('modif-numeroBC').value = commande.numeroBC || '';
            document.getElementById('modif-raisonSocialeGBM').value = commande.raisonSocialeGBM || '';
            document.getElementById('modif-directionGBM').value = commande.directionGBM || '';
            document.getElementById('modif-souscripteur').value = commande.souscripteur || '';
            document.getElementById('modif-typeDocument').value = commande.typeDocument || '';
            document.getElementById('modif-dateTransmission').value = formatDateForInput(commande.dateTransmission);
            document.getElementById('modif-dateRelanceBR').value = formatDateForInput(commande.dateRelanceBR);
            document.getElementById('modif-typeRelance').value = commande.typeRelance || '';
            document.getElementById('modif-personnesCollectrice').value = commande.personnesCollectrice || '';
            document.getElementById('modif-dossierComplet').checked = commande.dossierComplet;

            // Afficher le lien vers le fichier joint existant s'il existe
            if (commande.fichierJoint) {
                // Créer un élément pour afficher le fichier existant
                const fichierExistantContainer = document.createElement('div');
                fichierExistantContainer.className = 'mt-2 mb-2';
                fichierExistantContainer.innerHTML = `
            <div class="alert alert-info d-flex align-items-center">
                <i class="fas fa-file-alt me-2"></i>
                <div>
                    Fichier actuel:
                    <a href="http://localhost:8082/api/files/${commande.fichierJoint}"
                       class="ms-2 btn btn-sm btn-outline-primary" 
                       target="_blank">
                        <i class="fas fa-eye"></i> Voir
                    </a>
                </div>
            </div>
        `;
                const fichierInput = document.getElementById('modif-fichier');
                fichierInput.parentNode.insertBefore(fichierExistantContainer, fichierInput.nextSibling);
            } else {
                // Afficher une information qu'aucun fichier n'est attaché
                const fichierExistantContainer = document.createElement('div');
                fichierExistantContainer.className = 'mt-2 mb-2';
                fichierExistantContainer.innerHTML = `
            <div class="alert alert-warning d-flex align-items-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <div>
                    Aucun fichier actuellement attaché à cette commande.
                </div>
            </div>
        `;
                const fichierInput = document.getElementById('modif-fichier');
                fichierInput.parentNode.insertBefore(fichierExistantContainer, fichierInput.nextSibling);
            }

            // Ajouter une validation pour n'accepter que les fichiers PDF et Word
            document.getElementById('modif-fichier').accept = ".pdf,.doc,.docx";

            // Configurer la soumission du formulaire
            const form = document.getElementById('formModifierCommande');
            form.onsubmit = async function(e) {
                e.preventDefault();

                // Vérifier la validité du formulaire
                if (!form.checkValidity()) {
                    e.stopPropagation();
                    form.classList.add('was-validated');
                    return;
                }

                // Vérifier si l'utilisateur a coché "dossier complet" et confirmer une dernière fois
                const dossierCompletCheckbox = document.getElementById('modif-dossierComplet');
                if (dossierCompletCheckbox && dossierCompletCheckbox.checked) {
                    if (!confirm("ATTENTION : En validant ce formulaire avec l'option 'Dossier complet' cochée, vous ne pourrez plus modifier cette commande ultérieurement. Confirmez-vous cette action ?")) {
                        return; // Arrêter la soumission si l'utilisateur annule
                    }
                }

                // Vérifier si un fichier est sélectionné et valider son extension
                const fichierInput = document.getElementById('modif-fichier');
                if (fichierInput.files.length > 0) {
                    const fichier = fichierInput.files[0];
                    const extensionsAutorisees = ['.pdf', '.doc', '.docx'];
                    const extension = '.' + fichier.name.split('.').pop().toLowerCase();

                    if (!extensionsAutorisees.includes(extension)) {
                        showToast("Type de fichier non autorisé. Seuls les fichiers PDF et Word sont acceptés.", "danger");
                        return;
                    }
                }

                try {
                    // Créer FormData pour envoyer les données du formulaire
                    const formData = new FormData(form);

                    // Afficher un indicateur de chargement
                    const submitBtn = form.querySelector('button[type="submit"]');
                    const originalBtnText = submitBtn.innerHTML;
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Traitement...';

                    // Envoyer la requête de mise à jour
                    const response = await fetch(`http://localhost:8082/BO/commandes/${idCommande}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': userInfo.email
                        },
                        body: formData
                    });

                    // Restaurer le bouton
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Erreur lors de la mise à jour de la commande');
                    }

                    const result = await response.json();

                    // Fermer le modal et afficher un message de succès
                    const modalElement = document.getElementById('modalModifierCommande');
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    modal.hide();

                    // Nettoyer le formulaire et les éléments ajoutés
                    form.reset();
                    form.classList.remove('was-validated');
                    const fichierExistantContainer = form.querySelector('.alert');
                    if (fichierExistantContainer) {
                        fichierExistantContainer.remove();
                    }

                    // Afficher un message de succès et recharger les commandes
                    showToast('Commande mise à jour avec succès', 'success');
                    chargerCommandes();

                } catch (error) {
                    // Afficher un message d'erreur
                    showToast(error.message || "Une erreur est survenue", "danger");
                }
            };

            // Afficher le modal
            const modalElement = document.getElementById('modalModifierCommande');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            // Gérer le nettoyage lorsque le modal est fermé
            modalElement.addEventListener('hidden.bs.modal', function() {
                form.reset();
                form.classList.remove('was-validated');
                const fichierExistantContainer = form.querySelector('.alert');
                if (fichierExistantContainer) {
                    fichierExistantContainer.remove();
                }
            });

        } catch (error) {
            console.error('Erreur lors de la modification de la commande:', error);
            showToast(error.message || "Une erreur est survenue", 'danger');
        }
    };

    document.addEventListener('DOMContentLoaded', function() {
        // Pour le formulaire de création
        const nouveauFichierInput = document.getElementById('nouveau-fichier');
        if (nouveauFichierInput) {
            nouveauFichierInput.accept = ".pdf,.doc,.docx";
            nouveauFichierInput.addEventListener('change', validateFileExtension);
        }

        // Pour le formulaire de modification (ajout dynamique d'écouteur)
        document.body.addEventListener('change', function(event) {
            if (event.target.id === 'modif-fichier') {
                validateFileExtension.call(event.target);
            }
        });
    });

    function validateFileExtension() {
        if (this.files.length > 0) {
            const fichier = this.files[0];
            const extensionsAutorisees = ['.pdf', '.doc', '.docx'];
            const extension = '.' + fichier.name.split('.').pop().toLowerCase();

            if (!extensionsAutorisees.includes(extension)) {
                showToast("Type de fichier non autorisé. Seuls les fichiers PDF et Word sont acceptés.", "danger");
                this.value = ''; // Réinitialiser l'input
                return false;
            }
            return true;
        }
        return true; // Si aucun fichier n'est sélectionné, c'est valide
    }


    // Gestionnaire d'événement pour la case à cocher "dossier complet"
    // Fonction pour confirmer la validation du dossier avec un toast
    function confirmDossierComplet() {
        if (this.checked) {
            // Stocker une référence à l'élément checkbox
            const checkbox = this;

            // Créer le toast de manière dynamique
            const toastElement = document.createElement('div');
            toastElement.className = 'toast align-items-center';
            toastElement.setAttribute('role', 'alert');
            toastElement.setAttribute('aria-live', 'assertive');
            toastElement.setAttribute('aria-atomic', 'true');

            toastElement.innerHTML = `
            <div class="toast-header bg-warning text-dark">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong class="me-auto">Confirmation requise</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                <p>En marquant ce dossier comme complet, vous ne pourrez plus le modifier ultérieurement. Souhaitez-vous continuer ?</p>
                <div class="mt-2 pt-2 border-top d-flex justify-content-end gap-2">
                    <button type="button" class="btn btn-outline-secondary btn-sm" id="toastCancelBtn">Annuler</button>
                    <button type="button" class="btn btn-warning btn-sm" id="toastConfirmBtn">Confirmer</button>
                </div>
            </div>
        `;

            // Ajouter le toast au conteneur (créer un conteneur s'il n'existe pas)
            let toastContainer = document.querySelector('.toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
                document.body.appendChild(toastContainer);
            }
            toastContainer.appendChild(toastElement);

            // Initialiser le toast
            const toastInstance = new bootstrap.Toast(toastElement, {
                autohide: false
            });

            // Décocher la case jusqu'à confirmation
            checkbox.checked = false;

            // Montrer le toast
            toastInstance.show();

            // Ajouter les écouteurs d'événements pour les boutons
            document.getElementById('toastCancelBtn').addEventListener('click', function() {
                toastInstance.hide();
                // Suppression du toast après fermeture
                toastElement.addEventListener('hidden.bs.toast', function() {
                    toastElement.remove();
                });
            });

            document.getElementById('toastConfirmBtn').addEventListener('click', function() {
                checkbox.checked = true;
                toastInstance.hide();
                // Suppression du toast après fermeture
                toastElement.addEventListener('hidden.bs.toast', function() {
                    toastElement.remove();
                });
            });
        }
    }

    function setupDossierCompletCheckbox() {
        // Pour le formulaire de création
        const nouveauDossierComplet = document.getElementById('nouveau-dossierComplet');
        if (nouveauDossierComplet) {
            nouveauDossierComplet.addEventListener('change', confirmDossierComplet);
        }

        // Pour le formulaire de modification
        const modifDossierComplet = document.getElementById('modif-dossierComplet');
        if (modifDossierComplet) {
            modifDossierComplet.addEventListener('change', confirmDossierComplet);
        }

        // Délégation d'événements pour les cases à cocher ajoutées dynamiquement
        document.body.addEventListener('change', function(event) {
            if (event.target.id === 'modif-dossierComplet' || event.target.id === 'nouveau-dossierComplet') {
                confirmDossierComplet.call(event.target);
            }
        });
    }

    // Ajouter cette fonction à l'initialisation
    document.addEventListener('DOMContentLoaded', function() {
        setupDossierCompletCheckbox();
    });


sta
    // Ajouter cette fonction à l'initialisation
    setupDossierCompletCheckbox();
    // Dans commandes.js
    function afficherErreurMiseAJour(message) {
        const alertElement = document.getElementById('updateErrorAlert');
        const messageElement = document.getElementById('updateErrorMessage');

        messageElement.textContent = message;
        alertElement.classList.add('show');
        alertElement.style.display = 'block';

        // Masquer après 5 secondes
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => {
                alertElement.style.display = 'none';
            }, 300);
        }, 5000);
    }

    afficherErreurMiseAJour();
    // Initialisation des tooltips Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

});