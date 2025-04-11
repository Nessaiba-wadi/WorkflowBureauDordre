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
 * Fonction pour exporter les données au format Excel
 */
function exportTableToExcel() {
    // Déterminer quelles données exporter (filtrées ou toutes)
    const dataToExport = filteredGlobalData.length > 0 ? filteredGlobalData : allGlobalData;

    // Créer un nouveau classeur Excel
    const wb = XLSX.utils.book_new();

    // Préparer les données pour Excel
    const excelData = dataToExport.map(item => {
        return {
            // Réception
            'N° BC': item.numeroBC || '',
            'Date réception': formatDateForExcel(item.dateReception),
            'Fournisseur': item.raisonSocialeFournisseur || '',
            'Société GBM': item.raisonSocialeGBM || '',
            'Direction': item.directionGBM || '',
            'Souscripteur': item.souscripteur || '',
            'Type doc.': item.typeDocument || '',
            'Date relance': formatDateForExcel(item.dateRelanceBR),
            'Type relance': item.typeRelance || '',
            'Dossier complet': item.dossierComplet === true ? 'Complet' :
                item.dossierComplet === false ? 'Incomplet' : '',
            'Date transmission BO': formatDateForExcel(item.dateTransmissionBO),
            'Collecteur BO': item.personneCollectriceBO || '',

            // Comptabilité
            'Date comptabilisation': formatDateForExcel(item.dateComptabilisation),
            'Date transmission compta': formatDateForExcel(item.dateTransmissionCompta),
            'Collecteur compta': item.personneCollectriceCompta || '',
            'Commentaire compta': item.commentaireCompta || '',

            // Trésorerie
            'Date préparation': formatDateForExcel(item.datePreparation),
            'Mode règlement': item.modeReglement || '',
            'N° chèque': item.numeroCheque || '',
            'Date transmission règlement': formatDateForExcel(item.dateTransmissionRegl),
            'Commentaire règlement': item.commentaireRegl || ''
        };
    });

    // Créer une feuille vide
    const ws = XLSX.utils.aoa_to_sheet([]);

    // Définir les largeurs de colonnes
    ws['!cols'] = [
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

    // Styles pour les en-têtes et cellules
    const styleTitle = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: "center", vertical: "center" }
    };

    const styleSubtitle = {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: "left", vertical: "center" }
    };

    const styleReception = {
        fill: { fgColor: { rgb: "2980B9" } }, // Bleu
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
    };

    const styleComptabilite = {
        fill: { fgColor: { rgb: "27AE60" } }, // Vert
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
    };

    const styleTresorerie = {
        fill: { fgColor: { rgb: "9B59B6" } }, // Violet
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
    };

    // Styles pour les cellules de données
    const styleData = {
        alignment: { horizontal: "center", vertical: "center" },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
    };

    const styleDataAlt = {
        fill: { fgColor: { rgb: "F5F5F5" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
    };

    // Ajouter le titre et les informations
    XLSX.utils.sheet_add_aoa(ws, [["Export des données de suivi GBM"]], { origin: "A1" });
    setCellStyle(ws, "A1", styleTitle);

    const date = new Date().toLocaleDateString('fr-FR');
    XLSX.utils.sheet_add_aoa(ws, [["Date d'exportation: " + date]], { origin: "A2" });
    setCellStyle(ws, "A2", styleSubtitle);

    XLSX.utils.sheet_add_aoa(ws, [["Nombre d'éléments: " + dataToExport.length]], { origin: "A3" });
    setCellStyle(ws, "A3", styleSubtitle);

    // Ajouter une ligne vide
    XLSX.utils.sheet_add_aoa(ws, [[""]], { origin: "A4" });

    // Ajouter les en-têtes de sections à la ligne 5
    XLSX.utils.sheet_add_aoa(ws, [["Réception (BO)", "", "", "", "", "", "", "", "", "", "", "",
        "Comptabilité", "", "", "",
        "Trésorerie", "", "", "", ""]], { origin: "A5" });

    // Appliquer les styles aux en-têtes de sections
    for (let i = 0; i < 12; i++) {
        const col = String.fromCharCode(65 + i); // A à L
        setCellStyle(ws, col + "5", styleReception);
    }

    for (let i = 12; i < 16; i++) {
        const col = String.fromCharCode(65 + i); // M à P
        setCellStyle(ws, col + "5", styleComptabilite);
    }

    for (let i = 16; i < 21; i++) {
        const col = String.fromCharCode(65 + i); // Q à U
        setCellStyle(ws, col + "5", styleTresorerie);
    }

    // Fusionner les cellules pour les en-têtes de sections
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push(
        { s: { r: 4, c: 0 }, e: { r: 4, c: 11 } }, // Réception
        { s: { r: 4, c: 12 }, e: { r: 4, c: 15 } }, // Comptabilité
        { s: { r: 4, c: 16 }, e: { r: 4, c: 20 } }  // Trésorerie
    );

    // Ajouter les en-têtes de colonnes à la ligne 6
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

    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A6" });

    // Appliquer les styles aux en-têtes de colonnes
    for (let i = 0; i < headers.length; i++) {
        const col = String.fromCharCode(65 + i);
        if (i < 12) {
            setCellStyle(ws, col + "6", styleReception);
        } else if (i < 16) {
            setCellStyle(ws, col + "6", styleComptabilite);
        } else {
            setCellStyle(ws, col + "6", styleTresorerie);
        }
    }

    // Ajouter les données à partir de la ligne 7
    excelData.forEach((row, rowIndex) => {
        const rowData = headers.map(header => row[header] || '');
        XLSX.utils.sheet_add_aoa(ws, [rowData], { origin: "A" + (7 + rowIndex) });

        // Appliquer les styles aux cellules de données avec alternance de couleur
        for (let i = 0; i < headers.length; i++) {
            const col = String.fromCharCode(65 + i);
            const cellRef = col + (7 + rowIndex);

            // Style alterné pour les lignes
            const baseStyle = rowIndex % 2 === 0 ? styleDataAlt : styleData;

            // Ajouter des bordures colorées selon la section
            if (i < 12) {
                // Réception - bordures bleues
                setCellStyle(ws, cellRef, {
                    ...baseStyle,
                    border: {
                        top: { style: "thin", color: { rgb: "2980B9" } },
                        bottom: { style: "thin", color: { rgb: "2980B9" } },
                        left: { style: "thin", color: { rgb: "2980B9" } },
                        right: { style: "thin", color: { rgb: "2980B9" } }
                    }
                });
            } else if (i < 16) {
                // Comptabilité - bordures vertes
                setCellStyle(ws, cellRef, {
                    ...baseStyle,
                    border: {
                        top: { style: "thin", color: { rgb: "27AE60" } },
                        bottom: { style: "thin", color: { rgb: "27AE60" } },
                        left: { style: "thin", color: { rgb: "27AE60" } },
                        right: { style: "thin", color: { rgb: "27AE60" } }
                    }
                });
            } else {
                // Trésorerie - bordures violettes
                setCellStyle(ws, cellRef, {
                    ...baseStyle,
                    border: {
                        top: { style: "thin", color: { rgb: "9B59B6" } },
                        bottom: { style: "thin", color: { rgb: "9B59B6" } },
                        left: { style: "thin", color: { rgb: "9B59B6" } },
                        right: { style: "thin", color: { rgb: "9B59B6" } }
                    }
                });
            }
        }
    });

    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(wb, ws, "Suivi GBM");

    // Générer le fichier Excel
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Suivi_GBM_${dateStr}.xlsx`;
    XLSX.writeFile(wb, fileName, { bookType: 'xlsx', bookSST: false, type: 'binary' });

    // Afficher un message de confirmation
    afficherToast('Exportation Excel réussie', 'Le fichier Excel a été généré avec succès et correspond au style du PDF.', 'success');
}

/**
 * Fonction utilitaire pour définir le style d'une cellule
 * @param {Object} sheet - Feuille Excel
 * @param {String} cellRef - Référence de la cellule (ex: "A1")
 * @param {Object} style - Style à appliquer
 */
function setCellStyle(sheet, cellRef, style) {
    if (!sheet[cellRef]) {
        // Si la cellule n'existe pas encore (ce qui est étrange), on la crée
        sheet[cellRef] = { v: "", t: "s" };
    }

    // Ajouter ou fusionner le style
    sheet[cellRef].s = sheet[cellRef].s ? { ...sheet[cellRef].s, ...style } : style;
}

/**
 * Formatte les dates pour Excel (format ISO)
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
        }); // Format JJ/MM/AAAA pour une meilleure lisibilité
    } catch (e) {
        return '';
    }
}