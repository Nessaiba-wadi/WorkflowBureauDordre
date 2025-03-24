// Fonction pour collecter et consolider les données des trois tables
async function exporterDonneesPDF() {
    // Vérifier l'authentification
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.email) {
        alert('Vous devez être connecté pour exporter les données');
        return;
    }

    // Afficher un indicateur de chargement
    const btnExport = document.querySelector('button.exporter-pdf');
    const btnTextOriginal = btnExport.innerHTML;
    btnExport.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération du PDF...';
    btnExport.disabled = true;

    try {
        // 1. Charger les données des trois onglets si elles ne sont pas déjà chargées
        if (!allCommandes || allCommandes.length === 0) {
            await chargerCommandesAvecPagination();
        }
        if (!allComptabilisations || allComptabilisations.length === 0) {
            await chargerComptabilisationsAvecPagination();
        }
        if (!allReglements || allReglements.length === 0) {
            await chargerReglementsAvecPagination();
        }

        // 2. Créer un objet de consolidation par numéro de BC
        const donneesPar_BC = {};

        // Parcourir les commandes
        allCommandes.forEach(commande => {
            if (commande.numeroBC) {
                // Créer une entrée pour ce BC s'il n'existe pas encore
                if (!donneesPar_BC[commande.numeroBC]) {
                    donneesPar_BC[commande.numeroBC] = {
                        reception: null,
                        comptabilite: null,
                        tresorerie: null
                    };
                }
                donneesPar_BC[commande.numeroBC].reception = commande;
            }
        });

        // Parcourir les comptabilisations
        allComptabilisations.forEach(compta => {
            if (compta.numeroBC) {
                // Créer une entrée pour ce BC s'il n'existe pas encore
                if (!donneesPar_BC[compta.numeroBC]) {
                    donneesPar_BC[compta.numeroBC] = {
                        reception: null,
                        comptabilite: null,
                        tresorerie: null
                    };
                }
                donneesPar_BC[compta.numeroBC].comptabilite = compta;
            }
        });

        // Parcourir les règlements
        allReglements.forEach(reglement => {
            // Récupérer le numéro de BC à partir de la commande associée
            const numeroBC = reglement.commande && reglement.commande.numeroBC
                ? reglement.commande.numeroBC
                : (reglement.numeroBC || null);

            if (numeroBC) {
                // Créer une entrée pour ce BC s'il n'existe pas encore
                if (!donneesPar_BC[numeroBC]) {
                    donneesPar_BC[numeroBC] = {
                        reception: null,
                        comptabilite: null,
                        tresorerie: null
                    };
                }
                donneesPar_BC[numeroBC].tresorerie = reglement;
            }
        });

        // 3. Générer le PDF avec les données consolidées
        genererPDF(donneesPar_BC);

    } catch (error) {
        console.error('Erreur lors de l\'exportation des données:', error);
        alert('Une erreur est survenue lors de l\'exportation: ' + error.message);
    } finally {
        // Restaurer l'état du bouton
        btnExport.innerHTML = btnTextOriginal;
        btnExport.disabled = false;
    }
}

// Fonction pour générer le PDF à partir des données consolidées
function genererPDF(donneesPar_BC) {
    // Créer un nouveau document jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Définir les propriétés du document
    const dateGeneration = new Date().toLocaleDateString('fr-FR');
    doc.setProperties({
        title: 'Suivi des commandes - ' + dateGeneration,
        subject: 'Rapport consolidé de suivi des commandes',
        author: 'Application GBM'
    });

    // Ajouter un titre
    doc.setFontSize(18);
    doc.text('Rapport consolidé de suivi des commandes', 150, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Date de génération: ' + dateGeneration, 150, 22, { align: 'center' });

    // Ajouter une ligne de séparation
    doc.setLineWidth(0.5);
    doc.line(10, 25, 287, 25);

    // Position de départ pour le contenu
    let y = 35;

    // Vérifier si des données sont disponibles
    const numerosBCs = Object.keys(donneesPar_BC);
    if (numerosBCs.length === 0) {
        doc.setFontSize(14);
        doc.text('Aucune donnée disponible pour l\'export', 150, y, { align: 'center' });
        doc.save('rapport-suivi-commandes.pdf');
        return;
    }

    // Parcourir chaque BC pour créer une section dans le PDF
    numerosBCs.forEach((numeroBC, index) => {
        const donnees = donneesPar_BC[numeroBC];

        // Vérifier s'il faut ajouter une nouvelle page
        if (y > 180) {
            doc.addPage();
            y = 15;
        }

        // Titre de la section - Numéro de BC
        doc.setFontSize(14);
        doc.setTextColor(66, 133, 244);
        doc.text(`Commande N° ${numeroBC}`, 10, y);
        y += 8;

        // Remise à la couleur normale
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);

        // Section Réception
        if (donnees.reception) {
            doc.setFontSize(12);
            doc.text('Informations de Réception:', 10, y);
            y += 6;
            doc.setFontSize(10);

            const receptionData = [
                [`Date de réception: ${formatDate(donnees.reception.dateReception) || '-'}`],
                [`Fournisseur: ${donnees.reception.raisonSocialeFournisseur || '-'}`],
                [`Société GBM: ${donnees.reception.raisonSocialeGBM || '-'}`],
                [`Direction GBM: ${donnees.reception.directionGBM || '-'}`],
                [`Type de document: ${donnees.reception.typeDocument || '-'}`],
                [`Dossier complet: ${getEtatDossier(donnees.reception.dossierComplet) || '-'}`],
                [`Date de transmission: ${formatDate(donnees.reception.dateTransmission) || '-'}`]
            ];

            // Utiliser autoTable pour un affichage plus propre
            doc.autoTable({
                startY: y,
                margin: { left: 15 },
                body: receptionData,
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 1 },
                columnStyles: { 0: { cellWidth: 'auto' } }
            });

            y = doc.lastAutoTable.finalY + 5;
        } else {
            doc.text('Aucune information de réception disponible', 10, y);
            y += 7;
        }

        // Section Comptabilité
        if (donnees.comptabilite) {
            doc.setFontSize(12);
            doc.text('Informations de Comptabilisation:', 10, y);
            y += 6;
            doc.setFontSize(10);

            const comptaData = [
                [`Date de comptabilisation: ${formatDate(donnees.comptabilite.dateComptabilisation) || '-'}`],
                [`Date de transmission: ${formatDate(donnees.comptabilite.dateTransmission) || '-'}`],
                [`Personne collectrice: ${donnees.comptabilite.personneCollectrice || '-'}`],
                [`Commentaire: ${donnees.comptabilite.commentaire || '-'}`]
            ];

            doc.autoTable({
                startY: y,
                margin: { left: 15 },
                body: comptaData,
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 1 },
                columnStyles: { 0: { cellWidth: 'auto' } }
            });

            y = doc.lastAutoTable.finalY + 5;
        } else {
            doc.text('Aucune information de comptabilisation disponible', 10, y);
            y += 7;
        }

        // Section Trésorerie
        if (donnees.tresorerie) {
            doc.setFontSize(12);
            doc.text('Informations de Règlement:', 10, y);
            y += 6;
            doc.setFontSize(10);

            const tresData = [
                [`Date de préparation: ${formatDate(donnees.tresorerie.datePreparation) || '-'}`],
                [`Mode de règlement: ${donnees.tresorerie.modeReglement || '-'}`],
                [`N° de chèque: ${donnees.tresorerie.numeroCheque || '-'}`],
                [`Date de transmission: ${formatDate(donnees.tresorerie.dateTransmission) || '-'}`],
                [`Commentaire: ${donnees.tresorerie.commentaire || '-'}`]
            ];

            doc.autoTable({
                startY: y,
                margin: { left: 15 },
                body: tresData,
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 1 },
                columnStyles: { 0: { cellWidth: 'auto' } }
            });

            y = doc.lastAutoTable.finalY + 5;
        } else {
            doc.text('Aucune information de règlement disponible', 10, y);
            y += 7;
        }

        // Ajouter une ligne de séparation entre les commandes (sauf pour la dernière)
        if (index < numerosBCs.length - 1) {
            doc.setLineWidth(0.2);
            doc.line(10, y, 287, y);
            y += 10;
        }
    });

    // Enregistrer le PDF
    doc.save('rapport-suivi-commandes.pdf');
}

// Fonction pour obtenir l'état du dossier formaté
function getEtatDossier(dossierComplet) {
    if (dossierComplet === true || dossierComplet === 'true' || dossierComplet === 'Validé') {
        return 'Validé';
    } else if (dossierComplet === false || dossierComplet === 'false' || dossierComplet === 'En cours') {
        return 'En cours';
    }
    return dossierComplet || '-';
}

// Initialisation de l'écouteur d'événements pour le bouton d'export
document.addEventListener('DOMContentLoaded', function() {
    // Attacher l'événement au bouton d'export
    const boutonExport = document.querySelector('button.exporter-pdf');
    if (boutonExport) {
        boutonExport.addEventListener('click', exporterDonneesPDF);
    }
});