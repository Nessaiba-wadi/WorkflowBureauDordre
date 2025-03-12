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

            // Mise à jour des compteurs avec le format "X/Total"
            document.getElementById('commandesComptabilisees').textContent = data.commandesComptabilisees + ' comptabilisées';
            document.getElementById('commandesEnAttente').textContent = 'En attente ' + data.commandesEnAttente + '/' + data.totalCommandes;
            document.getElementById('commandesValidees').textContent = 'Envoyées ' + data.commandesValidees + '/' + data.totalCommandes;
            document.getElementById('commandesCloturees').textContent = 'Clôturées ' + data.commandesCloturees + '/' + data.totalCommandes;
        })
        .catch(error => {
            console.error('Erreur:', error);

            // En cas d'erreur, afficher un message
            document.getElementById('commandesComptabilisees').textContent = 'Erreur de chargement';
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