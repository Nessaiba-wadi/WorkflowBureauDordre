document.addEventListener('DOMContentLoaded', function() {
    // Charger les statistiques au chargement de la page
    loadStatistiquesComptable();

    // Fonction pour actualiser les statistiques
    function loadStatistiquesComptable() {
        fetch('http://localhost:8082/comptabilisations/statistiques')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des statistiques');
                }
                return response.json();
            })
            .then(data => {
                // Mettre à jour les compteurs
                document.getElementById('commandesRecues').textContent = data.commandesRecues + ' Reçues';
                document.getElementById('commandesComptabilisees').textContent = data.commandesComptabilisees + ' Comptabilisées';
                document.getElementById('commandesNonComptabilisees').textContent = data.commandesNonComptabilisees + ' Non Comptabilisées';
                document.getElementById('commandesCloturees').textContent = data.commandesCloturees + ' Clôturées ';

                // Vérification de la cohérence (pour le débogage, peut être retiré en production)
                console.log("Vérification: commandesNonComptabilisees + commandesComptabilisees =",
                    data.commandesNonComptabilisees + data.commandesComptabilisees);
                console.log("commandesRecues =", data.commandesRecues);

                // Mettre à jour la dernière actualisation
                const maintenant = new Date();
                const heureActualisation = maintenant.getHours().toString().padStart(2, '0') + ':' +
                    maintenant.getMinutes().toString().padStart(2, '0');

                // Si vous avez un élément pour afficher l'heure de dernière actualisation
                if (document.getElementById('derniereActualisation')) {
                    document.getElementById('derniereActualisation').textContent = heureActualisation;
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                // Afficher un message d'erreur
                document.getElementById('commandesRecues').textContent = 'Erreur';
                document.getElementById('commandesComptabilisees').textContent = 'Erreur';
                document.getElementById('commandesNonComptabilisees').textContent = 'Erreur';
                document.getElementById('commandesCloturees').textContent = 'Erreur';
            });
    }

    // Ajouter un bouton de rafraîchissement si nécessaire
    const refreshButton = document.getElementById('refreshStats');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            // Réinitialiser les valeurs pendant le chargement
            document.getElementById('commandesRecues').textContent = 'Chargement...';
            document.getElementById('commandesComptabilisees').textContent = 'Chargement...';
            document.getElementById('commandesNonComptabilisees').textContent = 'Chargement...';
            document.getElementById('commandesCloturees').textContent = 'Chargement...';

            // Recharger les statistiques
            loadStatistiquesComptable();
        });
    }

    // Rafraîchir les statistiques toutes les 5 minutes
    setInterval(loadStatistiquesComptable, 300000);
});