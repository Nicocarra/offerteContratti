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
function val(idOrEl) {
    if (!idOrEl) return '';
    const el = typeof idOrEl === 'string' ? getEl(idOrEl) : idOrEl;
    return el ? el.value : '';
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
const docTitle = getEl('docTitle');
const docRecipient = getEl('docRecipient');
const docContent = getEl('docContent');
const previewElement = getEl('document-preview');

// Additional fields (document metadata)
const docCompany = getEl('docCompany');
const docRef = getEl('docRef');
const docLocation = getEl('docLocation');
const docPreparedBy = getEl('docPreparedBy');
const docContact = getEl('docContact');
const docShortNote = getEl('docShortNote');
const docFooterNote = getEl('docFooterNote');

// Collect all elements we want to auto-watch for changes
const autoWatchElements = [
    docTitle, docRecipient, docContent,
    docCompany, docRef, docLocation, docPreparedBy, docContact, docShortNote, docFooterNote
].filter(Boolean); // drop missing ones silently

// Helper: attach input listeners to a list of elements
function attachInputListeners(elements, handler) {
    elements.forEach(el => {
        if (!el) return;
        el.removeEventListener('input', handler); // avoid duplicates
        el.addEventListener('input', handler);
    });
}

// Expose a tiny API for interactive tinkering from the console
window.documentApp = {
    updatePreview: () => updatePreview(),
    downloadPDF: () => downloadPDF(),
    config: APP
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
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Build preview HTML. Keep structure simple so it is easy to edit later.
    previewElement.innerHTML = `
        <div class="text-center mb-6">
            <h1 class="text-3xl font-bold mb-1 text-gray-900">${val(docTitle)}</h1>
            <p class="text-sm text-gray-500">Prepared on: ${date}</p>
        </div>

        <div class="flex justify-between items-start mb-4 text-sm text-gray-600">
            <div>
                <p class="font-semibold">Company</p>
                <p>${val(docCompany)}</p>
            </div>
            <div class="text-right">
                <p class="font-semibold">Ref</p>
                <p>${val(docRef)}</p>
            </div>
        </div>

        <div class="mb-6">
            <p class="text-sm font-semibold text-gray-600">To/From:</p>
            <p class="text-base text-gray-800">${val(docRecipient)}</p>
        </div>

        <div class="mb-4 text-sm text-gray-700">
            <p><span class="font-semibold">Location:</span> ${val(docLocation)}</p>
            <p><span class="font-semibold">Prepared By:</span> ${val(docPreparedBy)} &nbsp; <span class="font-semibold">Contact:</span> ${val(docContact)}</p>
            <p class="italic text-sm text-gray-500">${val(docShortNote)}</p>
        </div>

        <p class="text-base leading-relaxed text-gray-700">${val(docContent)}</p>

        <div class="mt-8 text-sm text-gray-500 border-t pt-2">${val(docFooterNote)}</div>
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
    const title = val(docTitle);
    const recipient = val(docRecipient);
    const content = val(docContent);
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    if (!jsPDF) {
        console.error("jsPDF library is not available.");
        setDownloadButtonState({ disabled: true, text: 'Error: PDF Library Not Loaded' });
        alert('PDF generation library failed to load.');
        return;
    }

    // Initialize jsPDF document (Portrait, millimeters, A4 size)
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = APP.pdf.margin;
    let currentY = margin;
    const maxTextWidth = pageWidth - 2 * margin;

    // 1. Set Font Styles
    doc.setFont('Helvetica');

    // 2. Title
    doc.setFontSize(APP.pdf.titleFontSize);
    doc.setFont(undefined, 'bold');
    const splitTitle = doc.splitTextToSize(title, maxTextWidth);
    doc.text(splitTitle, pageWidth / 2, currentY, { align: 'center' });
    currentY += (splitTitle.length * (APP.pdf.titleFontSize / 2.5)) + 5; // rough spacing calculation

    // 3. Date + Company/Ref
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Prepared on: ${date}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    // Company left, Ref right
    doc.text(`Company: ${val(docCompany)}`, margin, currentY);
    doc.text(`Ref: ${val(docRef)}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 8;

    // To/From centered
    doc.text(`To/From: ${recipient}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 12;

    // Location, Prepared By, Contact
    doc.setFontSize(APP.pdf.smallFontSize);
    doc.text(`Location: ${val(docLocation)}`, margin, currentY);
    doc.text(`Prepared By: ${val(docPreparedBy)}`, pageWidth / 2, currentY);
    doc.text(`Contact: ${val(docContact)}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 12;

    // Short note (wrap)
    const splitShortNote = doc.splitTextToSize(val(docShortNote), maxTextWidth);
    doc.text(splitShortNote, margin, currentY);
    currentY += (splitShortNote.length * APP.pdf.shortNoteLineHeight) + 6;

    // Separator
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    // Body content
    doc.setFontSize(APP.pdf.bodyFontSize);
    doc.setFont(undefined, 'normal');
    const splitContent = doc.splitTextToSize(content, maxTextWidth);

    for (const line of splitContent) {
        if (currentY + APP.pdf.lineHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            currentY = margin; // reset for new page
        }
        doc.text(line, margin, currentY);
        currentY += APP.pdf.lineHeight;
    }

    // Optional: Footer note on the last page
    if (val(docFooterNote)) {
        // Place footer a little above the bottom margin
        const footerY = doc.internal.pageSize.getHeight() - margin + 2 - APP.pdf.lineHeight;
        doc.setFontSize(9);
        doc.text(val(docFooterNote), margin, footerY);
    }

    // Save the PDF
    doc.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-document.pdf`);

    console.log('PDF generation complete!');
}

// If library is missing, disable the button early (defensive)
if (typeof jsPDF === 'undefined') {
    console.error('jsPDF library failed to load. PDF generation is unavailable.');
    setDownloadButtonState({ disabled: true, text: 'Error: PDF Library Not Loaded' });
}
