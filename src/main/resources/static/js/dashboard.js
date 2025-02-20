document.addEventListener('DOMContentLoaded', function() {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    console.log('UserInfo:', userInfo);
    if (!userInfo) {
        window.location.href = '../../templates/login.html';
        return;
    }

    // Affichage du nom de l'utilisateur
    document.getElementById('userName').textContent = `${userInfo.prenom} ${userInfo.nom}`;
});

function deconnexion() {
    sessionStorage.clear();
    window.location.href = '../../templates/login.html';
}