/*
 Friendly developer notes and quick API
 - How to add a field:
   1. Add an input element in `index.html` with a unique id, e.g. `myNewField`.
   2. Add the id to the `fieldIds` array below (optional — this file already references the main fields).
   3. Update `updatePreview()` to include it in the visual preview.
   4. Update `downloadPDF()` to include its value in the PDF layout (use `doc.text()` and `doc.splitTextToSize()`).

 - Quick helpers are below to make changes safe and centralized.
 - `window.documentApp` exposes a tiny API for manual calls from the console.
*/

// Use the global jspdf object provided by the CDN import
const jsPDF = window.jspdf && window.jspdf.jsPDF;

// -------------------------------
// Configuration and helpers
// -------------------------------
const APP = {
    // Centralized layout config for PDF generation
    pdf: {
        margin: 20,            // mm
        titleFontSize: 24,
        bodyFontSize: 12,
        smallFontSize: 9,
        lineHeight: 7,         // mm per line for body text
        shortNoteLineHeight: 6
    },
    // If you add new inputs, consider listing them here (optional)
    fieldIds: [
        'docTitle','docRecipient','docContent',
        'docCompany','docRef','docLocation','docPreparedBy','docContact','docShortNote','docFooterNote'
    ]
};

// safe DOM getter — returns null if not found but logs helpful info
function getEl(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`Element with id "${id}" not found.`);
    return el;
}

// safely get text value from an input/textarea
function val(idOrEl, forPDF = false) {
    if (!idOrEl) return '';
    const el = typeof idOrEl === 'string' ? getEl(idOrEl) : idOrEl;
    if (!el) return '';
    
    const value = el.value;
    
    // Se stiamo generando il PDF e il valore contiene #HIDE#, ritorna stringa vuota
    if (forPDF && value.includes('#HIDE#')) {
        return '';
    }
    
    // Rimuove il tag #HIDE# dalla preview ma mantiene il resto del testo
    return value.replace('#HIDE#', '');
}

// toggle the download button state (used for error handling)
function setDownloadButtonState({ disabled = false, text = null } = {}) {
    const btn = getEl('download-btn');
    if (!btn) return;
    btn.disabled = !!disabled;
    if (text !== null) btn.textContent = text;
}

// -------------------------------
// Element references
// -------------------------------
const previewElement = getEl('document-preview');

// Company info fields
const docCompany = getEl('docCompany');
const docAddress = getEl('docAddress');
const docCity = getEl('docCity');
const docPhone = getEl('docPhone');
const docFiscal = getEl('docFiscal');
const docOfferNum = getEl('docOfferNum');
const docRef = getEl('docRef');
const docDate = getEl('docDate');

// Destinatario fields
const destName = getEl('destName');
const destAddress = getEl('destAddress');
const destCity = getEl('destCity');
const destContact = getEl('destContact');
const destPhone = getEl('destPhone');
const destEmail = getEl('destEmail');

// Service fields
const serviceDesc = getEl('serviceDesc');
const serviceRoute = getEl('serviceRoute');
const servicePrice = getEl('servicePrice');
const serviceMaterial = getEl('serviceMaterial');
const serviceCIG = getEl('serviceCIG');
const serviceCUP = getEl('serviceCUP');

// Conditions fields
const condMinTax = getEl('condMinTax');
const condLoadTime = getEl('condLoadTime');
const condUnloadTime = getEl('condUnloadTime');
const condExtraCost = getEl('condExtraCost');
const condMuncato = getEl('condMuncato');
const condDeadline = getEl('condDeadline');
const condPayment = getEl('condPayment');

// Closing text
const closingText = getEl('closingText');

// Collect all elements we want to auto-watch for changes
const autoWatchElements = [
    docCompany, docAddress, docCity, docPhone, docFiscal, docOfferNum, docRef, docDate,
    destName, destAddress, destCity, destContact, destPhone, destEmail,
    serviceDesc, serviceRoute, servicePrice, serviceMaterial, serviceCIG, serviceCUP,
    condMinTax, condLoadTime, condUnloadTime, condExtraCost, condMuncato, condDeadline, condPayment,
    closingText
].filter(Boolean); // drop missing ones silently

// Helper: attach input listeners to a list of elements
function attachInputListeners(elements, handler) {
    elements.forEach(el => {
        if (!el) return;
        el.removeEventListener('input', handler); // avoid duplicates
        el.addEventListener('input', handler);
    });
}

// Espone alcune funzioni per il debug dalla console del browser
window.documentApp = {
    updatePreview: () => updatePreview(),  // Permette di aggiornare manualmente l'anteprima 
    downloadPDF: () => downloadPDF(),      // Permette di scaricare manualmente il PDF
    config: APP                            // Accesso alle configurazioni dell'app
};

// -------------------------------
// Preview rendering
// -------------------------------
/**
 * updatePreview - Render the HTML preview (what you see on the page)
 * Tips to modify: this is the only function you need to edit to change how the preview looks.
 * Keep it readable and similar to your PDF layout for predictable output.
 */
function updatePreview() {
    previewElement.innerHTML = `
        <div class="mb-2">
            <div class="flex justify-between items-start">
                <div>
                    <div class="font-bold text-lg">${val(docCompany)}</div>
                    <div class="text-sm">${val(docAddress)}</div>
                    <div class="text-sm">${val(docCity)}</div>
                    <div class="text-sm">${val(docPhone)}</div>
                    <div class="text-xs">${val(docFiscal)}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-base">OFFERTA</div>
                    <div class="text-sm">N. ${val(docOfferNum)}</div>
                    <div class="text-sm">Ns. Referente: ${val(docRef)}</div>
                    <div class="text-sm">Fontaniva ${val(docDate)}</div>
                </div>
            </div>
        </div>
        <hr class="my-2">
        <div class="mb-2">
            <div class="font-bold text-base mb-1">Destinatario</div>
            <div class="text-sm">${val(destName)}</div>
            <div class="text-sm">${val(destAddress)}</div>
            <div class="text-sm">${val(destCity)}</div>
            <div class="text-sm">Interlocutore: ${val(destContact)}</div>
            <div class="text-sm">Telefono/Fax: ${val(destPhone)}</div>
            <div class="text-sm">Email: ${val(destEmail)}</div>
        </div>
        <hr class="my-2">
        <div class="mb-2">
            <div class="font-bold text-base mb-1">Descrizione Servizio</div>
            <div class="text-sm">Descrizione: ${val(serviceDesc)}</div>
            <div class="text-sm">Tratta: ${val(serviceRoute)}</div>
            <div class="text-sm">Prezzo: ${val(servicePrice)}</div>
            <div class="text-sm">Materiale/CER: ${val(serviceMaterial)}</div>
            <div class="text-sm">CIG: ${val(serviceCIG)} &nbsp; CUP: ${val(serviceCUP)}</div>
        </div>
        <hr class="my-2">
        <div class="mb-2">
            <div class="font-bold text-base mb-1">Condizioni</div>
            <div class="text-sm">Minimo Tassabile: ${val(condMinTax)}</div>
            <div class="text-sm">Tempi di Carico: ${val(condLoadTime)}</div>
            <div class="text-sm">Tempi di Scarico: ${val(condUnloadTime)}</div>
            <div class="text-sm">Extra Sosta Carico/Scarico: ${val(condExtraCost)}</div>
            <div class="text-sm">Mancato Carico: ${val(condMuncato)}</div>
            <div class="text-sm">Data fine: ${val(condDeadline)}</div>
            <div class="text-sm">Pagamento: ${val(condPayment)}</div>
        </div>
        <hr class="my-2">
        <div class="mb-2">
            <div class="font-bold text-base mb-1">Testo di chiusura</div>
            <div class="text-sm">${val(closingText)}</div>
        </div>
    `;
}

// Attach listeners (centralized)
attachInputListeners(autoWatchElements, updatePreview);

// Initial render
updatePreview();

// -------------------------------
// PDF generation
// -------------------------------
/**
 * downloadPDF - Generate and download a PDF using jsPDF.
 * Notes for modification:
 * - Layout is built top-to-bottom; use APP.pdf values for spacing and paper metrics.
 * - To place items at exact mm coordinates, compute positions using `margin` and `pageWidth`.
 * - Use `doc.splitTextToSize(text, maxTextWidth)` for wrapped text.
 */
async function downloadPDF() {
    if (!jsPDF) {
        console.error("jsPDF library is not available.");
        setDownloadButtonState({ disabled: true, text: 'Error: PDF Library Not Loaded' });
        alert('PDF generation library failed to load.');
        return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let currentY = margin;
    const maxTextWidth = pageWidth - 2 * margin;

    // --- Company Info (sinistra) + Offerta (destra) ---
    doc.setFont('Helvetica');
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(val(docCompany, true), margin, currentY);
    doc.setFontSize(8);
    currentY += 4;
    doc.setFont(undefined, 'normal');
    doc.text(val(docAddress, true), margin, currentY);
    currentY += 4;
    doc.text(val(docCity, true), margin, currentY);
    currentY += 4;

    doc.text(val(docPhone, true), margin, currentY);
    currentY += 4;

    doc.setFontSize(7);
    doc.text(val(docFiscal, true), margin, currentY);
    currentY += 25;

    doc.setFontSize(10);
    doc.text(`N. ${val(docOfferNum, true)}`, margin, currentY);
    currentY += 5;

    doc.text(`Ns. Referente: ${val(docRef, true)}`, margin, currentY);
    currentY += 5;

    doc.text(`Fontaniva ${val(docDate, true)}`, margin, currentY);
    currentY += 5;
    


    // --- Destinatario (box a destra) ---
    const boxX = pageWidth - 80;
    const boxW = 70; //65;
    const boxY = margin + 20;
    doc.setDrawColor(150);
    doc.setLineWidth(0.2);
    doc.rect(boxX, boxY, boxW, 40);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Spettabile', boxX + 2, boxY + 5);
    doc.setFont(undefined, 'normal');
    doc.text(val(destName, true), boxX + 2, boxY + 10);
    doc.text(val(destAddress, true), boxX + 2, boxY + 15);
    doc.text(val(destCity, true), boxX + 2, boxY + 20);
    doc.text(`Interlocutore: ${val(destContact, true)}`, boxX + 2, boxY + 25);
    doc.text(`Telefono, Fax: ${val(destPhone, true)}`, boxX + 2, boxY + 29);
    doc.text(`Email: ${val(destEmail, true)}`, boxX + 2, boxY + 33);

    // --- Corpo testo principale ---
    currentY += 30;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const intro = "Con la presente Vi trasmettiamo la nostra migliore offerta per la prestazione dei servizi di seguito indicati.";
    const introLines = doc.splitTextToSize(intro, maxTextWidth);
    doc.text(introLines, margin, currentY);
    currentY += introLines.length * 5 + 2;

    // --- Descrizione (riga evidenziata) ---
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('Descrizione', margin, currentY);
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2);
    currentY += 10;

    // --- Descrizione Servizio (titolo e contenuto) ---
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text(val(serviceDesc, true), margin, currentY);
    currentY += 10;

    // --- Tratta e Prezzo su una riga, ben separati ---
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(val(serviceRoute, true), margin, currentY);
    doc.text(val(servicePrice, true), pageWidth - margin, currentY, { align: 'right' });
    currentY += 8;

    // --- Materiale/CER su una riga ---
    doc.text(`Materiale/CER: ${val(serviceMaterial, true)}`, margin, currentY);
    currentY += 8;

    // --- CIG/CUP su una riga, CIG blu, CUP nero, ben separati ---
    doc.setTextColor(30, 80, 200);
    doc.text(`CIG: ${val(serviceCIG, true)}`, margin, currentY);
    doc.setTextColor(0, 0, 0);
    doc.text(`CUP: ${val(serviceCUP, true)}`, margin + 60, currentY);
    currentY += 8;

    // --- Condizioni, ogni voce su una riga, con label in grassetto ---
    doc.setFont(undefined, 'bold');
    doc.text('Minimo Tassabile:', margin, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(val(condMinTax, true), margin + 40, currentY);
    currentY += 6;

    doc.setFont(undefined, 'bold');
    doc.text('Tempi di Carico:', margin, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(val(condLoadTime, true), margin + 40, currentY);
    currentY += 6;

    doc.setFont(undefined, 'bold');
    doc.text('Tempi di Scarico:', margin, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(val(condUnloadTime, true), margin + 40, currentY);
    currentY += 6;

    doc.setFont(undefined, 'bold');
    doc.text('Extra Sosta Carico/Scarico:', margin, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(val(condExtraCost, true), margin + 60, currentY);
    currentY += 6;

    doc.setFont(undefined, 'bold');
    doc.text('Mancato Carico:', margin, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(val(condMuncato, true), margin + 40, currentY);
    currentY += 10;

    // --- Data fine e Pagamento su una riga, ben separati ---
    doc.setFont(undefined, 'bold');
    doc.text('Data fine', margin, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(val(condDeadline, true), margin + 18, currentY);
    doc.setFont(undefined, 'bold');
    doc.text('Pagamento', margin + 70, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(val(condPayment, true), margin + 90, currentY);
    currentY += 8;

    // --- Testo di chiusura ---
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const closingLines = doc.splitTextToSize(val(closingText, true), maxTextWidth);
    doc.text(closingLines, margin, currentY);
    currentY += closingLines.length * 5 + 10;

    // --- Footer: firme e dati aziendali, ben separati ---
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(val(destName, true), margin, pageHeight - margin - 50);
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text(val(destAddress, true), margin, pageHeight - margin - 46);
    doc.text(val(destCity, true), margin, pageHeight - margin - 43);
    doc.text('P.IVA ' + (val(docFiscal, true).match(/P\.IVA\s*([A-Z0-9]+)/i)?.[1] || ''), margin, pageHeight - margin - 40);

    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Vaccari Srl', pageWidth - margin, pageHeight - margin - 50, { align: 'right' });
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text('Sede Legale: Viale G. Parini, 31/1 - 36100 Vicenza (VI)', pageWidth - margin, pageHeight - margin - 46, { align: 'right' });
    doc.text('Sede Operativa: Via E. Alighieri, 2, 35010 Cadoneghe (PD)', pageWidth - margin, pageHeight - margin - 43, { align: 'right' });
    doc.text('P.IVA: 00863050246', pageWidth - margin, pageHeight - margin - 40, { align: 'right' });

    // --- Fine ---
    doc.save(`offerta-${val(docOfferNum, true).replace(/[^a-zA-Z0-9]+/g, '-')}.pdf`);
}

// If library is missing, disable the button early (defensive)
if (typeof jsPDF === 'undefined') {
    console.error('jsPDF library failed to load. PDF generation is unavailable.');
    setDownloadButtonState({ disabled: true, text: 'Error: PDF Library Not Loaded' });
}
