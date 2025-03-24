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

        // Comptabilité
        { header: 'Date compta.', dataKey: 'dateComptabilisation' },
        { header: 'Date trans. compta', dataKey: 'dateTransmissionCompta' },
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

            dateComptabilisation: formatDateForPDF(item.dateComptabilisation),
            dateTransmissionCompta: formatDateForPDF(item.dateTransmissionCompta),
            commentaireCompta: (item.commentaireCompta || '-').substring(0, 15),

            datePreparation: formatDateForPDF(item.datePreparation),
            modeReglement: (item.modeReglement || '-').substring(0, 10),
            numeroCheque: (item.numeroCheque || '-').substring(0, 10),
            dateTransmissionRegl: formatDateForPDF(item.dateTransmissionRegl),
            commentaireRegl: (item.commentaireRegl || '-').substring(0, 15)
        };
    });

    // Ajouter le tableau au document PDF
    doc.autoTable({
        startY: 50,
        head: [columns.map(column => column.header)],
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
            3: { cellWidth: 25 }, // Société GBM
            4: { cellWidth: 20 }, // Direction
            5: { cellWidth: 20 }, // Souscripteur
            6: { cellWidth: 15 }, // Type doc
            7: { cellWidth: 18 }, // Date relance
            8: { cellWidth: 15 }, // Type relance
            9: { cellWidth: 15 }, // Dossier
            10: { cellWidth: 18 }, // Date trans. BO

            11: { cellWidth: 18 }, // Date compta
            12: { cellWidth: 18 }, // Date trans. compta
            13: { cellWidth: 25 }, // Commentaire compta

            14: { cellWidth: 18 }, // Date préparation
            15: { cellWidth: 15 }, // Mode règlement
            16: { cellWidth: 15 }, // N° chèque
            17: { cellWidth: 18 }, // Date trans. règl
            18: { cellWidth: 25 }  // Commentaire règl
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
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

// Ajouter l'écouteur d'événement pour le bouton d'exportation
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si le bouton existe
    const exportButton = document.getElementById('exportPdfGlobal');
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            exportTableToPDF();
        });
    }
});