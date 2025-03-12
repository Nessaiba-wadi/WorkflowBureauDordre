// src/main/resources/static/js/parametres.js

document.addEventListener('DOMContentLoaded', function() {
    // Récupérer les informations utilisateur depuis sessionStorage
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
    if (userInfo && userInfo.id) {
        // S'assurer que l'ID est disponible dans l'élément caché
        const userIdElement = document.getElementById('userId');
        if (userIdElement) {
            userIdElement.textContent = userInfo.id;
        }
    }

    // Initialiser le reste des fonctionnalités
    initToast();
    initPasswordChange();
    initPasswordVisibility();
    initPasswordStrength();
});

/**
 * Initialise le conteneur pour les notifications toast
 */
function initToast() {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(toastContainer);
}

/**
 * Affiche une notification toast personnalisée
 */
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

/**
 * Initialisation des fonctionnalités de changement de mot de passe
 */
function initPasswordChange() {
    const form = document.getElementById('changePasswordForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            showToast('Veuillez remplir correctement tous les champs', 'danger');
            return;
        }

        // Récupérer les valeurs
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Vérifier que les mots de passe correspondent
        if (newPassword !== confirmPassword) {
            showToast('Les mots de passe ne correspondent pas', 'danger');
            return;
        }

        try {
            // Récupérer l'ID utilisateur
            const utilisateurId = getUserId();

            // Vérifier explicitement si l'ID est valide
            if (!utilisateurId) {
                showToast('Impossible de récupérer votre identifiant. Veuillez vous reconnecter.', 'danger');
                return;
            }


            // Désactiver le bouton pendant le traitement
            const submitButton = document.getElementById('submitPasswordChange');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Traitement en cours...';
            }

            // Modifier le mot de passe
            await modifierMotDePasse(utilisateurId, currentPassword, newPassword);

            // Succès
            showToast('Votre mot de passe a été modifié avec succès', 'success');
            resetForm();

        } catch (error) {
            console.error('Erreur lors de la modification du mot de passe:', error);
            showToast(error.message || 'Une erreur est survenue lors de la modification du mot de passe', 'danger');
        } finally {
            // Réactiver le bouton
            const submitButton = document.getElementById('submitPasswordChange');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-save me-1"></i>Enregistrer les modifications';
            }
        }
    });
}

/**
 * Initialise les boutons de visibilité des mots de passe
 */
function initPasswordVisibility() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const target = document.getElementById(targetId);
            const icon = this.querySelector('i');

            if (target.type === 'password') {
                target.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                target.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

/**
 * Initialise l'évaluation de la force du mot de passe
 */
function initPasswordStrength() {
    const passwordInput = document.getElementById('newPassword');
    if (!passwordInput) return;

    passwordInput.addEventListener('input', function() {
        evaluatePasswordStrength(this.value);
    });
}

/**
 * Évalue la force du mot de passe et met à jour l'indicateur visuel
 */
function evaluatePasswordStrength(password) {
    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('passwordStrengthText');

    if (!strengthBar || !strengthText) return;

    if (!password) {
        updateStrength(0, 'Faible', 'bg-danger');
        return;
    }

    // Critères de force
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    const isLongEnough = password.length >= 8;

    // Calculer le score (0-100)
    let score = 0;
    if (hasLowercase) score += 20;
    if (hasUppercase) score += 20;
    if (hasDigit) score += 20;
    if (hasSpecial) score += 20;
    if (isLongEnough) score += 20;

    // Mise à jour de l'UI
    if (score < 40) {
        updateStrength(score, 'Faible', 'bg-danger');
    } else if (score < 80) {
        updateStrength(score, 'Moyen', 'bg-warning');
    } else {
        updateStrength(score, 'Fort', 'bg-success');
    }

    function updateStrength(value, label, colorClass) {
        strengthBar.style.width = `${value}%`;
        strengthBar.setAttribute('aria-valuenow', value);
        strengthText.textContent = `Force: ${label}`;

        // Mettre à jour la couleur
        strengthBar.className = '';
        strengthBar.classList.add('progress-bar', colorClass);
    }
}

/**
 * Réinitialise le formulaire
 */
function resetForm() {
    const form = document.getElementById('changePasswordForm');
    if (!form) return;

    form.reset();
    form.classList.remove('was-validated');

    // Réinitialiser la barre de force
    evaluatePasswordStrength('');
}

/**
 * Récupère l'ID de l'utilisateur depuis le localStorage ou la session
 */
function getUserId() {
    // 1. Récupérer depuis l'élément caché dans le DOM
    const userIdElement = document.getElementById('userId');
    if (userIdElement && userIdElement.textContent) {
        return userIdElement.textContent.trim();
    }

    // 2. Essayer de récupérer depuis le localStorage/sessionStorage si l'élément DOM n'existe pas
    try {
        // Essai 1: localStorage
        const userLocal = JSON.parse(localStorage.getItem('user') || '{}');
        if (userLocal.idUtilisateur) return userLocal.idUtilisateur;

        // Essai 2: sessionStorage - format user
        const userSession = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (userSession.idUtilisateur) return userSession.idUtilisateur;

        // Essai 3: sessionStorage - format userInfo (comme dans le code de paste-3.txt)
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
        if (userInfo.id) return userInfo.id;

        // Essai 4: ID stocké directement
        const directId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (directId) return directId;

        // Essai 5: utilisation de l'ID dans l'URL si disponible
        const urlParams = new URLSearchParams(window.location.search);
        const idFromUrl = urlParams.get('id');
        if (idFromUrl) return idFromUrl;

        // Si on arrive ici, impossible de trouver l'ID
        console.warn("Impossible de trouver l'ID utilisateur");
        showToast("Erreur: ID utilisateur non trouvé. Veuillez vous reconnecter.", "danger");
        return null;
    } catch (error) {
        console.error("Erreur lors de la récupération de l'ID utilisateur:", error);
        showToast("Erreur lors de la récupération de votre identifiant", "danger");
        return null;
    }
}

/**
 * Modifie le mot de passe de l'utilisateur
 */
async function modifierMotDePasse(utilisateurId, motDePasseActuel, nouveauMotDePasse) {
    try {
        const response = await fetch(`http://localhost:8082/utilisateurs/modifier-mot-de-passe/${utilisateurId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                motDePasseActuel,
                nouveauMotDePasse
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de la modification du mot de passe');
        }

        return data;
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}