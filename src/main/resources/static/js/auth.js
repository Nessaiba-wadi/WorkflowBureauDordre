// Fonction pour vérifier si l'utilisateur est connecté
function estConnecte() {
    const userInfo = sessionStorage.getItem('userInfo');
    return userInfo !== null && userInfo !== undefined;
}

// Fonction de déconnexion
async function deconnexion() {
    try {
        // Appel au backend pour enregistrer la déconnexion
        const response = await fetch('http://localhost:8082/utilisateurs/deconnecter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Que la requête réussisse ou échoue, on vide quand même le sessionStorage
        sessionStorage.removeItem('userInfo');

        // Redirection vers la page de connexion
        window.location.href = '../../templates/login.html';
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);

        // En cas d'erreur, on force quand même la déconnexion
        sessionStorage.removeItem('userInfo');
        window.location.href = '../../templates/login.html';
    }
}

// Fonction de protection des pages
function verifierAuthentification() {
    if (!estConnecte()) {
        // Si l'utilisateur n'est pas connecté, redirection vers la page de connexion
        window.location.href = '../../templates/login.html';
        return false;
    }
    return true;
}

// Fonction pour obtenir les informations de l'utilisateur connecté
function getUtilisateurConnecte() {
    if (!estConnecte()) {
        return null;
    }
    return JSON.parse(sessionStorage.getItem('userInfo'));
}

// Exécution automatique à chaque chargement de page
document.addEventListener('DOMContentLoaded', function() {
    // Ne pas vérifier l'authentification sur la page de login
    if (window.location.pathname.includes('../../templates/login.html')) {
        return;
    }

    // Vérifier l'authentification pour toutes les autres pages
    if (!verifierAuthentification()) {
        return; // La redirection est gérée dans verifierAuthentification()
    }

    // Si un élément avec l'ID 'userName' existe, on le remplit avec le nom et prénom de l'utilisateur
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        const utilisateur = getUtilisateurConnecte();
        userNameElement.textContent = `${utilisateur.prenom} ${utilisateur.nom}`;
    }
});