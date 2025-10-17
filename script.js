// Use the global jspdf object provided by the CDN import
const jsPDF = window.jspdf && window.jspdf.jsPDF;

const docTitle = document.getElementById('docTitle');
const docRecipient = document.getElementById('docRecipient');
const docContent = document.getElementById('docContent');
const previewElement = document.getElementById('document-preview');

/**
 * Updates the live preview area with the current input values.
 */
function updatePreview() {
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    previewElement.innerHTML = `
        <div class="text-center mb-6">
            <h1 class="text-3xl font-bold mb-1 text-gray-900">${docTitle.value}</h1>
            <p class="text-sm text-gray-500">Prepared on: ${date}</p>
        </div>
        <div class="mb-6">
            <p class="text-sm font-semibold text-gray-600">To/From:</p>
            <p class="text-base text-gray-800">${docRecipient.value}</p>
        </div>
        <p class="text-base leading-relaxed text-gray-700">${docContent.value}</p>
    `;
}

// Attach event listeners to update the preview whenever input changes
[docTitle, docRecipient, docContent].forEach(element => {
    element.addEventListener('input', updatePreview);
});

// Initial preview load
updatePreview();

/**
 * Generates and downloads the document as a PDF.
 */
async function downloadPDF() {
    const title = docTitle.value;
    const recipient = docRecipient.value;
    const content = docContent.value;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    if (!jsPDF) {
        console.error("jsPDF library is not available.");
        alert('PDF generation library failed to load.');
        return;
    }

    // Initialize jsPDF document (Portrait, millimeters, A4 size)
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = margin;
    const maxTextWidth = pageWidth - 2 * margin;

    // 1. Set Font Styles
    doc.setFont('Helvetica');

    // 2. Add Title
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    const splitTitle = doc.splitTextToSize(title, maxTextWidth);
    doc.text(splitTitle, pageWidth / 2, currentY, { align: 'center' });
    currentY += (splitTitle.length * 10) + 5; // Move down after title

    // 3. Add Date/Recipient Line
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Prepared on: ${date}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    doc.text(`To/From: ${recipient}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // 4. Add Separator Line
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    // 5. Add Document Content
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    
    // Split the content into lines that fit the page width
    const splitContent = doc.splitTextToSize(content, maxTextWidth);

    for (const line of splitContent) {
        // Check if adding the next line will exceed the page boundary
        if (currentY + 7 > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            currentY = margin; // Reset Y position for the new page
        }
        doc.text(line, margin, currentY);
        currentY += 7; // Increment Y position for the next line (line height)
    }

    // 6. Save the PDF
    doc.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-document.pdf`);

    console.log("PDF generation complete!");
}

// Add robust error handling for jsPDF in case of external script load failure
if (typeof jsPDF === 'undefined') {
    console.error("jsPDF library failed to load. PDF generation is unavailable.");
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.textContent = "Error: PDF Library Not Loaded";
        downloadBtn.disabled = true;
    }
}
