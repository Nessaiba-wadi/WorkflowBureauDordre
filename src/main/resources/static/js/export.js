// Variables globales pour le rapport
let allDataForExport = [];
let currentlyFilteredDataForExport = [];

// Fonction pour initialiser les boutons d'export
function initExportButtons() {
    // Créer les boutons d'export pour chaque onglet
    const tabs = ['reception', 'comptabilite', 'tresorerie'];

    tabs.forEach(tab => {
        const containerSelector = tab === 'reception' ? '.row.mb-3.align-items-end' : `#${tab} .row.mb-3.align-items-end`;
        const container = document.querySelector(containerSelector);

        if (container) {
            // Créer un div pour le bouton d'export
            const exportBtnDiv = document.createElement('div');
            exportBtnDiv.className = 'col-md-2 mt-2';

            // Créer le bouton d'export
            const exportBtn = document.createElement('button');
            exportBtn.id = `export${tab.charAt(0).toUpperCase() + tab.slice(1)}Btn`;
            exportBtn.className = 'btn btn-primary w-100';
            exportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Extracter PDF';
            exportBtn.addEventListener('click', () => exportToPDF(tab));

            exportBtnDiv.appendChild(exportBtn);
            container.appendChild(exportBtnDiv);
        }
    });
}

// Fonction pour collecter les données à exporter
async function collectDataForExport(tab) {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.email) {
        throw new Error('Utilisateur non authentifié');
    }

    // Déterminer les données à exporter en fonction de l'onglet actif
    let commandesData = [];
    let comptaData = [];
    let reglementData = [];

    switch(tab) {
        case 'reception':
            // Utiliser les commandes actuellement filtrées
            commandesData = [...filteredCommandes];

            // Récupérer les données de comptabilisation et règlement pour chaque commande
            for (const commande of commandesData) {
                const numeroBC = commande.numeroBC;
                if (numeroBC) {
                    // Récupérer les comptabilisations pour ce numéro BC
                    const comptaForBC = allComptabilisations ?
                        allComptabilisations.filter(c => c.numeroBC === numeroBC) : [];

                    // Récupérer les règlements pour ce numéro BC
                    const reglementForBC = allReglements ?
                        allReglements.filter(r => r.numeroBC === numeroBC) : [];

                    // Associer ces données à la commande
                    commande.comptabilisations = comptaForBC;
                    commande.reglements = reglementForBC;
                }
            }
            break;

        case 'comptabilite':
            // Utiliser les comptabilisations actuellement filtrées
            comptaData = [...filteredComptabilisations];

            // Récupérer les commandes et règlements pour chaque comptabilisation
            for (const compta of comptaData) {
                const numeroBC = compta.numeroBC;
                if (numeroBC) {
                    // Récupérer la commande pour ce numéro BC
                    const commandeForBC = allCommandes ?
                        allCommandes.find(c => c.numeroBC === numeroBC) : null;

                    // Récupérer les règlements pour ce numéro BC
                    const reglementForBC = allReglements ?
                        allReglements.filter(r => r.numeroBC === numeroBC) : [];

                    // Associer ces données à la comptabilisation
                    compta.commande = commandeForBC;
                    compta.reglements = reglementForBC;
                }
            }
            break;

        case 'tresorerie':
            // Utiliser les règlements actuellement filtrés
            reglementData = [...filteredReglements];

            // Récupérer les commandes et comptabilisations pour chaque règlement
            for (const reglement of reglementData) {
                const numeroBC = reglement.numeroBC;
                if (numeroBC) {
                    // Récupérer la commande pour ce numéro BC
                    const commandeForBC = allCommandes ?
                        allCommandes.find(c => c.numeroBC === numeroBC) : null;

                    // Récupérer les comptabilisations pour ce numéro BC
                    const comptaForBC = allComptabilisations ?
                        allComptabilisations.filter(c => c.numeroBC === numeroBC) : [];

                    // Associer ces données au règlement
                    reglement.commande = commandeForBC;
                    reglement.comptabilisations = comptaForBC;
                }
            }
            break;
    }

    // Construire un objet contenant toutes les données nécessaires
    return {
        tabSource: tab,
        commandes: commandesData,
        comptabilisations: comptaData,
        reglements: reglementData
    };
}

// Fonction principale pour exporter en PDF
async function exportToPDF(tab) {
    try {
        // Récupérer les données à exporter
        const exportData = await collectDataForExport(tab);

        // Créer un élément temporaire pour construire le contenu du PDF
        const tempDiv = document.createElement('div');
        tempDiv.className = 'pdf-export-container';

        // Titre du rapport
        const title = document.createElement('h2');
        title.textContent = 'Rapport de suivi des commandes';
        title.className = 'text-center mb-4';
        tempDiv.appendChild(title);

        // Date d'extraction
        const extractionDate = document.createElement('p');
        extractionDate.textContent = `Date d'extraction : ${new Date().toLocaleDateString('fr-FR')}`;
        extractionDate.className = 'text-right mb-4';
        tempDiv.appendChild(extractionDate);

        // Construire le tableau consolidé en fonction de l'onglet source
        const mainTable = document.createElement('table');
        mainTable.className = 'table table-bordered';

        // En-têtes du tableau
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th colspan="5" class="text-center bg-light">Informations commande</th>
                <th colspan="3" class="text-center bg-light">Informations comptabilisation</th>
                <th colspan="4" class="text-center bg-light">Informations règlement</th>
            </tr>
            <tr>
                <th>N° BC</th>
                <th>Date réception</th>
                <th>Fournisseur</th>
                <th>Direction GBM</th>
                <th>Type document</th>
                
                <th>Date comptabilisation</th>
                <th>Date transmission</th>
                <th>Personne collectrice</th>
                
                <th>Date préparation</th>
                <th>Mode règlement</th>
                <th>N° chèque</th>
                <th>Date transmission</th>
            </tr>
        `;
        mainTable.appendChild(thead);

        // Corps du tableau
        const tbody = document.createElement('tbody');

        // Remplir le tableau en fonction de l'onglet source
        switch(tab) {
            case 'reception':
                exportData.commandes.forEach(commande => {
                    // Pour chaque commande, afficher ses infos + comptabilisations + règlements associés
                    if (!commande.comptabilisations || commande.comptabilisations.length === 0) {
                        // Cas où il n'y a pas de comptabilisation ni règlement
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${commande.numeroBC || '-'}</td>
                            <td>${formatDate(commande.dateReception) || '-'}</td>
                            <td>${commande.raisonSocialeFournisseur || '-'}</td>
                            <td>${commande.directionGBM || '-'}</td>
                            <td>${commande.typeDocument || '-'}</td>
                            <td colspan="3" class="text-center">Aucune comptabilisation</td>
                            <td colspan="4" class="text-center">Aucun règlement</td>
                        `;
                        tbody.appendChild(row);
                    } else {
                        // Pour chaque comptabilisation liée à cette commande
                        commande.comptabilisations.forEach((compta, idx) => {
                            const reglements = commande.reglements && commande.reglements.length > 0 ?
                                commande.reglements : [];

                            // Si pas de règlement ou première itération
                            if (reglements.length === 0 || idx === 0) {
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td>${commande.numeroBC || '-'}</td>
                                    <td>${formatDate(commande.dateReception) || '-'}</td>
                                    <td>${commande.raisonSocialeFournisseur || '-'}</td>
                                    <td>${commande.directionGBM || '-'}</td>
                                    <td>${commande.typeDocument || '-'}</td>
                                    <td>${formatDate(compta.dateComptabilisation) || '-'}</td>
                                    <td>${formatDate(compta.dateTransmission) || '-'}</td>
                                    <td>${compta.personneCollectrice || '-'}</td>
                                    ${reglements.length === 0 ?
                                    '<td colspan="4" class="text-center">Aucun règlement</td>' :
                                    `<td>${formatDate(reglements[0].datePreparation) || '-'}</td>
                                         <td>${reglements[0].modeReglement || '-'}</td>
                                         <td>${reglements[0].numeroCheque || '-'}</td>
                                         <td>${formatDate(reglements[0].dateTransmission) || '-'}</td>`
                                }
                                `;
                                tbody.appendChild(row);

                                // Ajouter des lignes pour les règlements restants
                                if (reglements.length > 1) {
                                    for (let i = 1; i < reglements.length; i++) {
                                        const regRow = document.createElement('tr');
                                        regRow.innerHTML = `
                                            <td colspan="8" class="border-0"></td>
                                            <td>${formatDate(reglements[i].datePreparation) || '-'}</td>
                                            <td>${reglements[i].modeReglement || '-'}</td>
                                            <td>${reglements[i].numeroCheque || '-'}</td>
                                            <td>${formatDate(reglements[i].dateTransmission) || '-'}</td>
                                        `;
                                        tbody.appendChild(regRow);
                                    }
                                }
                            } else {
                                // Lignes supplémentaires pour les comptabilisations additionnelles
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td colspan="5" class="border-0"></td>
                                    <td>${formatDate(compta.dateComptabilisation) || '-'}</td>
                                    <td>${formatDate(compta.dateTransmission) || '-'}</td>
                                    <td>${compta.personneCollectrice || '-'}</td>
                                    <td colspan="4" class="border-0"></td>
                                `;
                                tbody.appendChild(row);
                            }
                        });
                    }
                });
                break;

            case 'comptabilite':
                // Logique similaire mais en partant des comptabilisations
                exportData.comptabilisations.forEach(compta => {
                    const commande = compta.commande;
                    const reglements = compta.reglements || [];

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        ${commande ?
                        `<td>${commande.numeroBC || '-'}</td>
                             <td>${formatDate(commande.dateReception) || '-'}</td>
                             <td>${commande.raisonSocialeFournisseur || '-'}</td>
                             <td>${commande.directionGBM || '-'}</td>
                             <td>${commande.typeDocument || '-'}</td>` :
                        `<td>${compta.numeroBC || '-'}</td>
                             <td colspan="4" class="text-center">Détails commande non disponibles</td>`
                    }
                        <td>${formatDate(compta.dateComptabilisation) || '-'}</td>
                        <td>${formatDate(compta.dateTransmission) || '-'}</td>
                        <td>${compta.personneCollectrice || '-'}</td>
                        ${reglements.length === 0 ?
                        '<td colspan="4" class="text-center">Aucun règlement</td>' :
                        `<td>${formatDate(reglements[0].datePreparation) || '-'}</td>
                             <td>${reglements[0].modeReglement || '-'}</td>
                             <td>${reglements[0].numeroCheque || '-'}</td>
                             <td>${formatDate(reglements[0].dateTransmission) || '-'}</td>`
                    }
                    `;
                    tbody.appendChild(row);

                    // Ajouter des lignes pour les règlements restants
                    if (reglements.length > 1) {
                        for (let i = 1; i < reglements.length; i++) {
                            const regRow = document.createElement('tr');
                            regRow.innerHTML = `
                                <td colspan="8" class="border-0"></td>
                                <td>${formatDate(reglements[i].datePreparation) || '-'}</td>
                                <td>${reglements[i].modeReglement || '-'}</td>
                                <td>${reglements[i].numeroCheque || '-'}</td>
                                <td>${formatDate(reglements[i].dateTransmission) || '-'}</td>
                            `;
                            tbody.appendChild(regRow);
                        }
                    }
                });
                break;

            case 'tresorerie':
                // Logique similaire mais en partant des règlements
                exportData.reglements.forEach(reglement => {
                    const commande = reglement.commande;
                    const comptas = reglement.comptabilisations || [];

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        ${commande ?
                        `<td>${commande.numeroBC || '-'}</td>
                             <td>${formatDate(commande.dateReception) || '-'}</td>
                             <td>${commande.raisonSocialeFournisseur || '-'}</td>
                             <td>${commande.directionGBM || '-'}</td>
                             <td>${commande.typeDocument || '-'}</td>` :
                        `<td>${reglement.numeroBC || '-'}</td>
                             <td colspan="4" class="text-center">Détails commande non disponibles</td>`
                    }
                        ${comptas.length === 0 ?
                        '<td colspan="3" class="text-center">Aucune comptabilisation</td>' :
                        `<td>${formatDate(comptas[0].dateComptabilisation) || '-'}</td>
                             <td>${formatDate(comptas[0].dateTransmission) || '-'}</td>
                             <td>${comptas[0].personneCollectrice || '-'}</td>`
                    }
                        <td>${formatDate(reglement.datePreparation) || '-'}</td>
                        <td>${reglement.modeReglement || '-'}</td>
                        <td>${reglement.numeroCheque || '-'}</td>
                        <td>${formatDate(reglement.dateTransmission) || '-'}</td>
                    `;
                    tbody.appendChild(row);

                    // Ajouter des lignes pour les comptabilisations restantes
                    if (comptas.length > 1) {
                        for (let i = 1; i < comptas.length; i++) {
                            const comptaRow = document.createElement('tr');
                            comptaRow.innerHTML = `
                                <td colspan="5" class="border-0"></td>
                                <td>${formatDate(comptas[i].dateComptabilisation) || '-'}</td>
                                <td>${formatDate(comptas[i].dateTransmission) || '-'}</td>
                                <td>${comptas[i].personneCollectrice || '-'}</td>
                                <td colspan="4" class="border-0"></td>
                            `;
                            tbody.appendChild(comptaRow);
                        }
                    }
                });
                break;
        }

        mainTable.appendChild(tbody);
        tempDiv.appendChild(mainTable);

        // Récupérer le contenu HTML
        const content = tempDiv.innerHTML;

        // Générer le PDF avec html2pdf
        const filename = `rapport_commandes_${new Date().toISOString().split('T')[0]}.pdf`;

        // Définir les options du PDF
        const options = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }
        };

        // Créer un style temporaire pour l'export PDF
        const style = document.createElement('style');
        style.textContent = `
            .pdf-export-container { font-family: Arial, sans-serif; }
            .pdf-export-container table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .pdf-export-container th, .pdf-export-container td { padding: 8px; text-align: left; font-size: 9px; }
            .pdf-export-container th { background-color: #f2f2f2; }
            .pdf-export-container .text-center { text-align: center; }
            .pdf-export-container .text-right { text-align: right; }
            .pdf-export-container .border-0 { border: none; }
            .pdf-export-container .bg-light { background-color: #f8f9fa; }
        `;
        document.head.appendChild(style);

        // Ajouter le contenu à la page temporairement
        document.body.appendChild(tempDiv);

        // Utiliser html2pdf (doit être importé dans le HTML)
        // Note: html2pdf doit être ajouté avec une balise script dans le HTML principal
        if (typeof html2pdf === 'undefined') {
            throw new Error("La bibliothèque html2pdf n'est pas chargée. Veuillez l'ajouter dans le fichier HTML.");
        }

        html2pdf().from(tempDiv).set(options).save().then(() => {
            // Nettoyer après la génération
            document.body.removeChild(tempDiv);
            document.head.removeChild(style);
        });

    } catch (error) {
        console.error('Erreur lors de l\'export en PDF:', error);
        alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
}

// Initialiser les boutons d'export au chargement du document
document.addEventListener('DOMContentLoaded', function() {
    // S'assurer que toutes les données sont chargées
    const checkDataLoaded = setInterval(() => {
        // Vérifier si les variables globales existent
        if (typeof allCommandes !== 'undefined' &&
            typeof allComptabilisations !== 'undefined' &&
            typeof allReglements !== 'undefined') {

            // Initialiser les boutons d'export
            initExportButtons();
            clearInterval(checkDataLoaded);
        }
    }, 500);

    // Définir un timeout pour éviter une boucle infinie
    setTimeout(() => clearInterval(checkDataLoaded), 10000);
});