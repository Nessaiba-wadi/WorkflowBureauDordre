/**
 * Fonctions d'exportation PDF pour la vision globale
 */

// Fonction principale pour l'exportation PDF
function exportTableToPDF() {
    // Informations d'en-tête
    const title = "Export des données de suivi GBM";
    const date = new Date().toLocaleDateString('fr-FR');

    // Déterminer quelles données exporter (filtrées ou toutes)
    const dataToExport = filteredGlobalData.length > 0 ? filteredGlobalData : allGlobalData;
    const { jsPDF } = window.jspdf;
    // Créer un nouvel objet jsPDF
    const doc = new jsPDF('l', 'mm', 'a3'); // Format paysage (landscape) en A3

    // Ajouter l'en-tête
    doc.setFontSize(18);
    doc.text(title, 20, 20);

    doc.setFontSize(12);
    doc.text(`Date d'exportation: ${date}`, 20, 30);
    doc.text(`Nombre d'éléments: ${dataToExport.length}`, 20, 37);

    // Information sur le filtrage
    if (filteredGlobalData.length < allGlobalData.length && filteredGlobalData.length > 0) {
        const searchTerm = document.getElementById('searchInputGlobal').value;
        const dateExacte = document.getElementById('dateExacteFilterGlobal').value;
        const typeDate = document.getElementById('typeDateFilterGlobal').value;

        let filterInfo = "Filtres appliqués: ";
        if (searchTerm) filterInfo += `Recherche: "${searchTerm}" `;
        if (dateExacte) filterInfo += `Date ${typeDate.replace('date', '')}: ${formatDate(dateExacte)} `;

        doc.text(filterInfo, 20, 44);
    }

    // Configuration des colonnes pour le tableau PDF
    const columns = [
        // Réception
        { header: 'N° BC', dataKey: 'numeroBC' },
        { header: 'Date réception', dataKey: 'dateReception' },
        { header: 'Fournisseur', dataKey: 'raisonSocialeFournisseur' },
        { header: 'Société GBM', dataKey: 'raisonSocialeGBM' },
        { header: 'Direction', dataKey: 'directionGBM' },
        { header: 'Souscripteur', dataKey: 'souscripteur' },
        { header: 'Type doc.', dataKey: 'typeDocument' },
        { header: 'Date relance', dataKey: 'dateRelanceBR' },
        { header: 'Type relance', dataKey: 'typeRelance' },
        { header: 'Dossier', dataKey: 'dossierComplet' },
        { header: 'Date trans. BO', dataKey: 'dateTransmissionBO' },
        { header: 'Collecteur BO', dataKey: 'personneCollectriceBO' },

        // Comptabilité
        { header: 'Date compta.', dataKey: 'dateComptabilisation' },
        { header: 'Date trans. compta', dataKey: 'dateTransmissionCompta' },
        { header: 'Collecteur compta', dataKey: 'personneCollectriceCompta' },
        { header: 'Commentaire', dataKey: 'commentaireCompta' },

        // Trésorerie
        { header: 'Date préparation', dataKey: 'datePreparation' },
        { header: 'Mode règl.', dataKey: 'modeReglement' },
        { header: 'N° chèque', dataKey: 'numeroCheque' },
        { header: 'Date trans. règl.', dataKey: 'dateTransmissionRegl' },
        { header: 'Commentaire', dataKey: 'commentaireRegl' }
    ];

    // Formater les données pour le tableau PDF
    const tableData = dataToExport.map(item => {
        return {
            numeroBC: item.numeroBC || '-',
            dateReception: formatDateForPDF(item.dateReception),
            raisonSocialeFournisseur: (item.raisonSocialeFournisseur || '-').substring(0, 15),
            raisonSocialeGBM: (item.raisonSocialeGBM || '-').substring(0, 15),
            directionGBM: (item.directionGBM || '-').substring(0, 15),
            souscripteur: (item.souscripteur || '-').substring(0, 15),
            typeDocument: (item.typeDocument || '-').substring(0, 10),
            dateRelanceBR: formatDateForPDF(item.dateRelanceBR),
            typeRelance: (item.typeRelance || '-').substring(0, 10),
            dossierComplet: item.dossierComplet === true ? 'Complet' :
                item.dossierComplet === false ? 'Incomplet' : '-',
            dateTransmissionBO: formatDateForPDF(item.dateTransmissionBO),
            personneCollectriceBO: (item.personneCollectriceBO || '-').substring(0, 15),

            dateComptabilisation: formatDateForPDF(item.dateComptabilisation),
            dateTransmissionCompta: formatDateForPDF(item.dateTransmissionCompta),
            personneCollectriceCompta: (item.personneCollectriceCompta || '-').substring(0, 15),
            commentaireCompta: (item.commentaireCompta || '-').substring(0, 15),

            datePreparation: formatDateForPDF(item.datePreparation),
            modeReglement: (item.modeReglement || '-').substring(0, 10),
            numeroCheque: (item.numeroCheque || '-').substring(0, 10),
            dateTransmissionRegl: formatDateForPDF(item.dateTransmissionRegl),
            commentaireRegl: (item.commentaireRegl || '-').substring(0, 15)
        };
    });

    // Définir les en-têtes pour les secteurs (BO, Comptabilité, Trésorerie)
    // Couleurs exactes comme dans le PDF
    const couleurReception = [41, 128, 185];    // Bleu
    const couleurComptabilite = [46, 204, 113]; // Vert
    const couleurTresorerie = [155, 89, 182];   // Violet

    const headers = [
        // Première ligne avec les titres de section
        [
            {
                content: 'Réception (BO)',
                colSpan: 12,
                styles: {
                    fillColor: couleurReception,
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                }
            },
            {
                content: 'Comptabilité',
                colSpan: 4,
                styles: {
                    fillColor: couleurComptabilite,
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                }
            },
            {
                content: 'Trésorerie',
                colSpan: 5,
                styles: {
                    fillColor: couleurTresorerie,
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                }
            }
        ],
        // Deuxième ligne avec les en-têtes de colonnes
        columns.map((column, index) => {
            // Déterminer la couleur de fond selon la section
            let fillColor;
            if (index < 12) {
                fillColor = couleurReception;
            } else if (index < 16) {
                fillColor = couleurComptabilite;
            } else {
                fillColor = couleurTresorerie;
            }

            return {
                content: column.header,
                styles: {
                    fillColor: fillColor,
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                }
            };
        })
    ];

    // Ajouter le tableau au document PDF
    doc.autoTable({
        startY: 50,
        head: headers,
        body: tableData.map(item => columns.map(column => item[column.dataKey])),
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 1,
            overflow: 'linebreak'
        },
        columnStyles: {
            // Ajuster la largeur des colonnes selon les besoins
            0: { cellWidth: 20 }, // N° BC
            1: { cellWidth: 18 }, // Date réception
            2: { cellWidth: 25 }, // Fournisseur
            3: { cellWidth: 22 }, // Société GBM
            4: { cellWidth: 20 }, // Direction
            5: { cellWidth: 20 }, // Souscripteur
            6: { cellWidth: 15 }, // Type doc
            7: { cellWidth: 18 }, // Date relance
            8: { cellWidth: 15 }, // Type relance
            9: { cellWidth: 15 }, // Dossier
            10: { cellWidth: 18 }, // Date trans. BO
            11: { cellWidth: 18 }, // Collecteur BO

            12: { cellWidth: 18 }, // Date compta
            13: { cellWidth: 18 }, // Date trans. compta
            14: { cellWidth: 18 }, // Collecteur compta
            15: { cellWidth: 22 }, // Commentaire compta

            16: { cellWidth: 18 }, // Date préparation
            17: { cellWidth: 15 }, // Mode règlement
            18: { cellWidth: 15 }, // N° chèque
            19: { cellWidth: 18 }, // Date trans. règl
            20: { cellWidth: 22 }  // Commentaire règl
        },
        // Style des colonnes par section
        didParseCell: function(data) {
            // Déterminer la couleur de la bordure selon la section
            let borderColor;
            if (data.column.index < 12) {
                borderColor = couleurReception;
            } else if (data.column.index < 16) {
                borderColor = couleurComptabilite;
            } else {
                borderColor = couleurTresorerie;
            }

            // Appliquer un style pour les cellules de données
            if (data.section === 'body') {
                // Fond alterné pour les lignes
                const backgroundColor = data.row.index % 2 === 0 ? [245, 245, 245] : [255, 255, 255];

                data.cell.styles.fillColor = backgroundColor;
                data.cell.styles.textColor = [0, 0, 0];
                data.cell.styles.lineWidth = 0.1;
                data.cell.styles.lineColor = borderColor;
            }
        },
        didDrawPage: function(data) {
            // Ajouter un pied de page avec numérotation
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.text('Page ' + data.pageNumber + '/' + doc.internal.getNumberOfPages(), data.settings.margin.left, pageHeight - 10);
        }
    });

    // Enregistrer le PDF
    const filename = `Suivi_GBM_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    // Afficher un message de confirmation
    afficherToast('Exportation PDF réussie', 'Le fichier PDF a été généré avec succès.', 'success');
}

// Fonction auxiliaire pour formater les dates pour le PDF
function formatDateForPDF(dateString) {
    if (!dateString) return '-';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return '-';
    }
}

// Fonction pour afficher un toast/notification
function afficherToast(titre, message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        // Créer le conteneur de toast s'il n'existe pas
        const newToastContainer = document.createElement('div');
        newToastContainer.id = 'toastContainer';
        newToastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(newToastContainer);
    }

    const toastId = 'toast' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-${type} text-white">
                <strong class="me-auto">${titre}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fermer"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

    document.getElementById('toastContainer').insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();

    // Supprimer le toast après qu'il ait été masqué
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// l'écouteur d'événement pour les boutons d'exportation
document.addEventListener('DOMContentLoaded', function() {
    // Écouteur pour le bouton PDF
    const exportPdfButton = document.getElementById('exportPdfGlobal');
    if (exportPdfButton) {
        exportPdfButton.addEventListener('click', exportTableToPDF);
    }

    // écouteur pour le bouton Excel
    const exportExcelButton = document.getElementById('exportExcelGlobal');
    if (exportExcelButton) {
        exportExcelButton.addEventListener('click', exportTableToExcel);
    }
});


/**
 * Fonction pour exporter les données au format Excel avec styles
 */
function exportTableToExcel() {
    // Déterminer quelles données exporter (filtrées ou toutes)
    const dataToExport = filteredGlobalData.length > 0 ? filteredGlobalData : allGlobalData;

    // Solution alternative : utiliser ExcelJS qui supporte nativement les styles
    // Cette bibliothèque doit être ajoutée à votre projet
    // <script src="https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js"></script>

    // Créer un nouveau workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Suivi GBM';
    workbook.lastModifiedBy = 'Application GBM';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Ajouter une feuille
    const worksheet = workbook.addWorksheet('Suivi GBM');

    // Définir les largeurs de colonnes
    const columnWidths = [
        { width: 15 }, // A: N° BC
        { width: 15 }, // B: Date réception
        { width: 20 }, // C: Fournisseur
        { width: 20 }, // D: Société GBM
        { width: 18 }, // E: Direction
        { width: 18 }, // F: Souscripteur
        { width: 15 }, // G: Type doc
        { width: 15 }, // H: Date relance
        { width: 15 }, // I: Type relance
        { width: 15 }, // J: Dossier complet
        { width: 20 }, // K: Date transmission BO
        { width: 18 }, // L: Collecteur BO
        { width: 20 }, // M: Date comptabilisation
        { width: 25 }, // N: Date transmission compta
        { width: 18 }, // O: Collecteur compta
        { width: 25 }, // P: Commentaire compta
        { width: 18 }, // Q: Date préparation
        { width: 15 }, // R: Mode règlement
        { width: 15 }, // S: N° chèque
        { width: 25 }, // T: Date transmission règlement
        { width: 25 }  // U: Commentaire règlement
    ];

    // Appliquer les largeurs de colonnes
    worksheet.columns = columnWidths;

    // Ajouter le titre
    const titleRow = worksheet.addRow(["Export des données de suivi GBM"]);
    titleRow.font = { bold: true, size: 16 };
    worksheet.mergeCells('A1:U1');
    titleRow.alignment = { horizontal: 'center' };

    // Ajouter les informations
    const dateRow = worksheet.addRow([`Date d'exportation: ${new Date().toLocaleDateString('fr-FR')}`]);
    dateRow.font = { bold: true, size: 12 };

    const countRow = worksheet.addRow([`Nombre d'éléments: ${dataToExport.length}`]);
    countRow.font = { bold: true, size: 12 };

    // Ligne vide
    worksheet.addRow([]);

    // Couleurs des sections
    const colorReception = { argb: 'FF2980B9' }; // Bleu
    const colorComptabilite = { argb: 'FF27AE60' }; // Vert
    const colorTresorerie = { argb: 'FF9B59B6' }; // Violet

    // Ajouter les en-têtes de sections
    const sectionRow = worksheet.addRow([
        "Réception (BO)", "", "", "", "", "", "", "", "", "", "", "",
        "Comptabilité", "", "", "",
        "Trésorerie", "", "", "", ""
    ]);

    // Appliquer les styles aux en-têtes de sections
    for (let i = 1; i <= 21; i++) {
        const cell = sectionRow.getCell(i);

        // Définir la couleur selon la section
        if (i <= 12) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: colorReception
            };
        } else if (i <= 16) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: colorComptabilite
            };
        } else {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: colorTresorerie
            };
        }

        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    }

    // Fusionner les cellules des en-têtes de sections
    worksheet.mergeCells('A5:L5'); // Réception
    worksheet.mergeCells('M5:P5'); // Comptabilité
    worksheet.mergeCells('Q5:U5'); // Trésorerie

    // En-têtes de colonnes
    const headers = [
        // Réception
        'N° BC', 'Date réception', 'Fournisseur', 'Société GBM', 'Direction',
        'Souscripteur', 'Type doc.', 'Date relance', 'Type relance', 'Dossier complet',
        'Date transmission BO', 'Collecteur BO',
        // Comptabilité
        'Date comptabilisation', 'Date transmission compta', 'Collecteur compta', 'Commentaire compta',
        // Trésorerie
        'Date préparation', 'Mode règlement', 'N° chèque', 'Date transmission règlement', 'Commentaire règlement'
    ];

    const headerRow = worksheet.addRow(headers);

    // Appliquer les styles aux en-têtes de colonnes
    for (let i = 1; i <= headers.length; i++) {
        const cell = headerRow.getCell(i);

        // Définir la couleur selon la section
        if (i <= 12) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: colorReception
            };
        } else if (i <= 16) {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: colorComptabilite
            };
        } else {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: colorTresorerie
            };
        }

        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    }

    // Ajouter les données
    dataToExport.forEach((item, index) => {
        const row = worksheet.addRow([
            // Réception
            item.numeroBC || '',
            formatDateForExcel(item.dateReception),
            item.raisonSocialeFournisseur || '',
            item.raisonSocialeGBM || '',
            item.directionGBM || '',
            item.souscripteur || '',
            item.typeDocument || '',
            formatDateForExcel(item.dateRelanceBR),
            item.typeRelance || '',
            item.dossierComplet === true ? 'Complet' :
                item.dossierComplet === false ? 'Incomplet' : '',
            formatDateForExcel(item.dateTransmissionBO),
            item.personneCollectriceBO || '',

            // Comptabilité
            formatDateForExcel(item.dateComptabilisation),
            formatDateForExcel(item.dateTransmissionCompta),
            item.personneCollectriceCompta || '',
            item.commentaireCompta || '',

            // Trésorerie
            formatDateForExcel(item.datePreparation),
            item.modeReglement || '',
            item.numeroCheque || '',
            formatDateForExcel(item.dateTransmissionRegl),
            item.commentaireRegl || ''
        ]);

        // Appliquer les styles aux cellules de données
        const backgroundColor = index % 2 === 0 ? { argb: 'FFF5F5F5' } : { argb: 'FFFFFFFF' };

        for (let i = 1; i <= headers.length; i++) {
            const cell = row.getCell(i);

            // Style de base
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: backgroundColor
            };

            // Bordures colorées selon la section
            if (i <= 12) {
                // Réception - bordures bleues
                cell.border = {
                    top: { style: 'thin', color: colorReception },
                    left: { style: 'thin', color: colorReception },
                    bottom: { style: 'thin', color: colorReception },
                    right: { style: 'thin', color: colorReception }
                };
            } else if (i <= 16) {
                // Comptabilité - bordures vertes
                cell.border = {
                    top: { style: 'thin', color: colorComptabilite },
                    left: { style: 'thin', color: colorComptabilite },
                    bottom: { style: 'thin', color: colorComptabilite },
                    right: { style: 'thin', color: colorComptabilite }
                };
            } else {
                // Trésorerie - bordures violettes
                cell.border = {
                    top: { style: 'thin', color: colorTresorerie },
                    left: { style: 'thin', color: colorTresorerie },
                    bottom: { style: 'thin', color: colorTresorerie },
                    right: { style: 'thin', color: colorTresorerie }
                };
            }
        }
    });

    // Générer le fichier Excel
    workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `Suivi_GBM_${dateStr}.xlsx`;

        // Créer un lien pour télécharger le fichier
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);

        // Afficher un message de confirmation
        afficherToast('Exportation Excel réussie', 'Le fichier Excel a été généré avec succès et correspond au style du PDF.', 'success');
    });
}

/**
 * Formatte les dates pour Excel (format français JJ/MM/AAAA)
 */
function formatDateForExcel(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return '';
    }
}

/**
 * Alternative si ExcelJS ne peut pas être utilisé : méthode utilisant des tableaux HTML
 * Cette méthode crée un tableau HTML temporaire avec les styles CSS appropriés,
 * puis utilise la fonction TableToExcel pour convertir ce tableau en Excel
 */
function exportTableToExcelAlternative() {
    // Déterminer quelles données exporter (filtrées ou toutes)
    const dataToExport = filteredGlobalData.length > 0 ? filteredGlobalData : allGlobalData;

    // Créer un tableau HTML temporaire avec les styles CSS
    const tempTable = document.createElement('table');
    tempTable.id = 'tempExportTable';
    tempTable.style.display = 'none';
    document.body.appendChild(tempTable);

    // Appliquer les styles CSS
    const tableHTML = `
    <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead>
            <tr>
                <th colspan="21" style="text-align: center; font-size: 18px; font-weight: bold; padding: 10px;">
                    Export des données de suivi GBM
                </th>
            </tr>
            <tr>
                <td colspan="21" style="font-size: 12px; font-weight: bold; padding: 5px;">
                    Date d'exportation: ${new Date().toLocaleDateString('fr-FR')}
                </td>
            </tr>
            <tr>
                <td colspan="21" style="font-size: 12px; font-weight: bold; padding: 5px;">
                    Nombre d'éléments: ${dataToExport.length}
                </td>
            </tr>
            <tr><td colspan="21">&nbsp;</td></tr>
            <tr>
                <th colspan="12" style="background-color: #2980B9; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #2980B9;">
                    Réception (BO)
                </th>
                <th colspan="4" style="background-color: #27AE60; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #27AE60;">
                    Comptabilité
                </th>
                <th colspan="5" style="background-color: #9B59B6; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #9B59B6;">
                    Trésorerie
                </th>
            </tr>
            <tr>
                <!-- Réception -->
                <th style="background-color: #2980B9; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #2980B9;">N° BC</th>
                <th style="background-color: #2980B9; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #2980B9;">Date réception</th>
                <th style="background-color: #2980B9; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #2980B9;">Fournisseur</th>
                <th style="background-color: #2980B9; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #2980B9;">Société GBM</th>
                <th style="background-color: #2980B9; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #2980B9;">Direction</th>
                <th style="background-color: #2980B9; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #2980B9;">Souscripteur</th>
                <th style="background-color: #2980B9; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #2980B9;">Type doc.</th>
                <th style="background-color: #2980B9; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #2980B9;">Date relance</th>
                <th style="background-color: #2980B9; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #2980B9;">Type relance</th>
                <th style="background-color: #2980B9; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #2980B9;">Dossier complet</th>
                <th style="background-color: #2980B9; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #2980B9;">Date trans. BO</th>
                <th style="background-color: #2980B9; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #2980B9;">Collecteur BO</th>
                
                <!-- Comptabilité -->
                <th style="background-color: #27AE60; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #27AE60;">Date compta.</th>
                <th style="background-color: #27AE60; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #27AE60;">Date trans. compta</th>
                <th style="background-color: #27AE60; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #27AE60;">Collecteur compta</th>
                <th style="background-color: #27AE60; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #27AE60;">Commentaire</th>
                
                <!-- Trésorerie -->
                <th style="background-color: #9B59B6; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #9B59B6;">Date préparation</th>
                <th style="background-color: #9B59B6; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #9B59B6;">Mode règl.</th>
                <th style="background-color: #9B59B6; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #9B59B6;">N° chèque</th>
                <th style="background-color: #9B59B6; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #9B59B6;">Date trans. règl.</th>
                <th style="background-color: #9B59B6; color: white; padding: 8px; text-align: center; font-weight: bold; border: 1px solid #9B59B6;">Commentaire</th>
            </tr>
        </thead>
        <tbody>
            ${dataToExport.map((item, index) => {
        const rowStyle = index % 2 === 0 ? 'background-color: #F5F5F5;' : 'background-color: #FFFFFF;';

        return `
                <tr style="${rowStyle}">
                    <!-- Réception -->
                    <td style="padding: 5px; text-align: center; border: 1px solid #2980B9;">${item.numeroBC || ''}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #2980B9;">${formatDateForExcel(item.dateReception)}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #2980B9;">${item.raisonSocialeFournisseur || ''}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #2980B9;">${item.raisonSocialeGBM || ''}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #2980B9;">${item.directionGBM || ''}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #2980B9;">${item.souscripteur || ''}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #2980B9;">${item.typeDocument || ''}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #2980B9;">${formatDateForExcel(item.dateRelanceBR)}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #2980B9;">${item.typeRelance || ''}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #2980B9;">${item.dossierComplet === true ? 'Complet' : item.dossierComplet === false ? 'Incomplet' : ''}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #2980B9;">${formatDateForExcel(item.dateTransmissionBO)}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #2980B9;">${item.personneCollectriceBO || ''}</td>
                    
                    <!-- Comptabilité -->
                    <td style="padding: 5px; text-align: center; border: 1px solid #27AE60;">${formatDateForExcel(item.dateComptabilisation)}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #27AE60;">${formatDateForExcel(item.dateTransmissionCompta)}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #27AE60;">${item.personneCollectriceCompta || ''}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #27AE60;">${item.commentaireCompta || ''}</td>
                    
                    <!-- Trésorerie -->
                    <td style="padding: 5px; text-align: center; border: 1px solid #9B59B6;">${formatDateForExcel(item.datePreparation)}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #9B59B6;">${item.modeReglement || ''}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #9B59B6;">${item.numeroCheque || ''}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #9B59B6;">${formatDateForExcel(item.dateTransmissionRegl)}</td>
                    <td style="padding: 5px; text-align: center; border: 1px solid #9B59B6;">${item.commentaireRegl || ''}</td>
                </tr>
                `;
    }).join('')}
        </tbody>
    </table>
    `;

    tempTable.innerHTML = tableHTML;

    // Utiliser une bibliothèque pour convertir le tableau HTML en Excel (exemple avec TableExport)
    // Vous devez inclure cette bibliothèque : https://tableexport.v5.travismclarke.com/
    TableExport(tempTable, {
        headers: true,
        footers: true,
        formats: ['xlsx'],
        filename: `Suivi_GBM_${new Date().toISOString().split('T')[0]}`,
        bootstrap: false,
        exportButtons: false,
        position: 'bottom',
        ignoreRows: null,
        ignoreCols: null,
        trimWhitespace: true,
        RTL: false,
        sheetname: 'Suivi GBM'
    });

    // Déclencher le téléchargement
    document.querySelector('.xlsx').click();

    // Nettoyer
    setTimeout(() => {
        document.body.removeChild(tempTable);
    }, 1000);

    // Afficher un message de confirmation
    afficherToast('Exportation Excel réussie', 'Le fichier Excel a été généré avec succès et correspond au style du PDF.', 'success');
}