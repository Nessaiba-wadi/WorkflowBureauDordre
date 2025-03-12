// Fonction pour récupérer les statistiques des commandes
function chargerStatistiquesCommandes() {
    // Récupération des données depuis l'API
    fetch('http://localhost:8082/BO/commandes/statistiques')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des statistiques');
            }
            return response.json();
        })
        .then(data => {
            console.log("Données reçues:", data); // Pour déboguer

            // Mise à jour des compteurs en utilisant les clés exactes de la réponse
            document.getElementById('totalCommandes').textContent = data.totalCommandes + ' commandes';
            document.getElementById('commandesEnAttente').textContent = data.commandesEnAttente + ' en attente';
            document.getElementById('commandesValidees').textContent = data.commandesValidees + ' envoyées';
            document.getElementById('commandesCloturees').textContent = data.commandesCloturees + ' clôturées';
        })
        .catch(error => {
            console.error('Erreur:', error);

            // En cas d'erreur, afficher un message
            document.getElementById('totalCommandes').textContent = 'Erreur de chargement';
            document.getElementById('commandesEnAttente').textContent = 'Erreur de chargement';
            document.getElementById('commandesValidees').textContent = 'Erreur de chargement';
            document.getElementById('commandesCloturees').textContent = 'Erreur de chargement';
        });
}

// Charger les statistiques au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log("Page chargée, chargement des statistiques..."); // Pour déboguer
    chargerStatistiquesCommandes();

    // Actualiser les données toutes les 5 minutes
    setInterval(chargerStatistiquesCommandes, 300000);
});