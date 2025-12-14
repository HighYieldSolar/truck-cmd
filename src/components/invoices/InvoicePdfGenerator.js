"use client";

import { useState } from 'react';
import { Download, Printer, RefreshCw } from 'lucide-react';

/**
 * Component that generates and downloads or prints a PDF invoice
 * @param {Object} invoice - Invoice data
 * @param {Object} companyInfo - Company information for the invoice header
 * @param {string} id - HTML id for the button
 * @param {string} mode - "download" (default) or "print"
 */
export default function InvoicePdfGenerator({ invoice, companyInfo, id, mode = "download" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Default company info if not provided
  const company = companyInfo || {
    name: 'Truck Command',
    address: '123 Trucking Way',
    city: 'Dallas',
    state: 'TX',
    zip: '75001',
    phone: '(555) 123-4567',
    email: 'billing@truckcommand.com',
    website: 'www.truckcommand.com',
    logo: '/images/tc-name-tp-bg.png'
  };

  // Function to generate and download the PDF
  const generatePdf = async () => {
    try {
      setLoading(true);
      setError(null);

      // Dynamically import jsPDF and jsPDF-AutoTable to reduce initial bundle size
      const [jsPDFModule, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      
      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;

      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add company name header (plain text, no colors)
      doc.setTextColor(0);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(company.name || 'Your Company', 15, 20);
      doc.setFont(undefined, 'normal');

      // Add company info below header
      doc.setFontSize(10);
      doc.setTextColor(80);
      let companyInfoY = 35;

      if (company.address) {
        doc.text(company.address, 15, companyInfoY);
        companyInfoY += 5;
      }

      const cityStateZip = [company.city, company.state].filter(Boolean).join(', ') + (company.zip ? ` ${company.zip}` : '');
      if (cityStateZip.trim()) {
        doc.text(cityStateZip, 15, companyInfoY);
        companyInfoY += 5;
      }

      if (company.phone) {
        doc.text(`Phone: ${company.phone}`, 15, companyInfoY);
        companyInfoY += 5;
      }

      if (company.email) {
        doc.text(`Email: ${company.email}`, 15, companyInfoY);
      }
      
      // Add invoice title and info
      doc.setFontSize(18);
      doc.setTextColor(0);
      doc.text('INVOICE', 140, 20);
      
      doc.setFontSize(10);
      doc.text(`Invoice #: ${invoice.invoice_number}`, 140, 30);
      doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 140, 35);
      doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 140, 40);
      
      if (invoice.po_number) {
        doc.text(`PO #: ${invoice.po_number}`, 140, 45);
      }
      
      // Add billed to section
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text('BILL TO:', 15, 80);
      doc.setFontSize(10);
      doc.text(invoice.customer, 15, 85);
      
      if (invoice.customer_address) {
        const addressLines = invoice.customer_address.split('\n');
        let addressY = 90;
        addressLines.forEach(line => {
          doc.text(line, 15, addressY);
          addressY += 5;
        });
      }
      
      // Add shipment info if available
      if (invoice.loads && invoice.loads.length > 0) {
        const load = invoice.loads[0];
        
        doc.setFontSize(11);
        doc.text('SHIPMENT INFO:', 140, 80);
        doc.setFontSize(10);
        
        let yPos = 85;
        
        if (load.load_number) {
          doc.text(`Load #: ${load.load_number}`, 140, yPos);
          yPos += 5;
        }
        
        if (load.origin || load.destination) {
          doc.text(`Route: ${load.origin || ''} → ${load.destination || ''}`, 140, yPos);
          yPos += 5;
        }
      }
      
      // Add line items table
      const tableColumn = ["Description", "Quantity", "Unit Price", "Total"];
      const tableRows = [];
      
      if (invoice.items && invoice.items.length > 0) {
        invoice.items.forEach(item => {
          const itemData = [
            item.description,
            item.quantity.toString(),
            `$${parseFloat(item.unit_price).toFixed(2)}`,
            `$${(item.quantity * item.unit_price).toFixed(2)}`
          ];
          tableRows.push(itemData);
        });
      }
      
      autoTable(doc, {
        startY: 100,
        head: [tableColumn],
        body: tableRows,
        theme: 'plain',
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        bodyStyles: {
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' }
        },
        margin: { bottom: 25 },
        showHead: 'everyPage'
      });
      
      // Calculate where the table ended
      const finalY = (doc.lastAutoTable.finalY || 120) + 10;
      
      // Add totals section with proper spacing
      const totalsLabelX = 135;
      const totalsValueX = 195;

      doc.setFontSize(10);
      doc.text('Subtotal:', totalsLabelX, finalY);
      doc.text(`$${invoice.subtotal?.toFixed(2) || '0.00'}`, totalsValueX, finalY, { align: 'right' });

      doc.text(`Tax (${invoice.tax_rate || 0}%):`, totalsLabelX, finalY + 6);
      doc.text(`$${invoice.tax_amount?.toFixed(2) || '0.00'}`, totalsValueX, finalY + 6, { align: 'right' });

      // Draw a line before total
      doc.setDrawColor(200, 200, 200);
      doc.line(totalsLabelX, finalY + 10, totalsValueX, finalY + 10);

      doc.setFontSize(10);
      doc.text('Total:', totalsLabelX, finalY + 16);
      doc.text(`$${invoice.total?.toFixed(2) || '0.00'}`, totalsValueX, finalY + 16, { align: 'right' });

      doc.text('Amount Paid:', totalsLabelX, finalY + 22);
      doc.text(`$${invoice.amount_paid?.toFixed(2) || '0.00'}`, totalsValueX, finalY + 22, { align: 'right' });

      // Draw a line before balance due
      doc.line(totalsLabelX, finalY + 26, totalsValueX, finalY + 26);

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Balance Due:', totalsLabelX, finalY + 32);
      const balanceDue = (invoice.total || 0) - (invoice.amount_paid || 0);
      doc.text(`$${balanceDue.toFixed(2)}`, totalsValueX, finalY + 32, { align: 'right' });
      doc.setFont(undefined, 'normal');
      
      // Add notes and terms if available
      let notesY = finalY + 45;
      
      if (invoice.notes) {
        doc.setFontSize(11);
        doc.text('NOTES:', 15, notesY);
        doc.setFontSize(10);
        
        // Split notes into multiple lines if needed
        const splitNotes = doc.splitTextToSize(invoice.notes, 170);
        doc.text(splitNotes, 15, notesY + 5);
        
        notesY += 10 + (splitNotes.length * 5);
      }
      
      // Add terms & conditions - sync with payment_terms like the web page
      const termsText = invoice.payment_terms === 'Due on Receipt'
        ? 'Payment is due upon receipt of this invoice.'
        : invoice.payment_terms === 'Net 7'
        ? 'Payment is due within 7 days of invoice date.'
        : invoice.payment_terms === 'Net 15'
        ? 'Payment is due within 15 days of invoice date.'
        : invoice.payment_terms === 'Net 30'
        ? 'Payment is due within 30 days of invoice date.'
        : invoice.payment_terms === 'Net 60'
        ? 'Payment is due within 60 days of invoice date.'
        : invoice.terms || 'Payment is due within 15 days of invoice date.';

      doc.setFontSize(11);
      doc.text('TERMS & CONDITIONS:', 15, notesY);
      doc.setFontSize(10);

      // Split terms into multiple lines if needed
      const splitTerms = doc.splitTextToSize(termsText, 170);
      doc.text(splitTerms, 15, notesY + 5);
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Generated on ${new Date().toLocaleString()} | Invoice #${invoice.invoice_number} | Page ${i} of ${pageCount}`,
          105, 287, { align: 'center' }
        );
      }
      
      if (mode === "print") {
        // Open PDF in new window for printing
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const printWindow = window.open(pdfUrl, '_blank');

        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      } else {
        // Save the PDF with a detailed filename
        const filename = `Invoice_${invoice.invoice_number}_${invoice.customer.replace(/\s+/g, '_')}.pdf`;
        doc.save(filename);
      }
    } catch (error) {
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Icon = mode === "print" ? Printer : Download;
  const buttonText = mode === "print" ? "Print Invoice" : "Download PDF";

  return (
    <button
      id={id}
      onClick={generatePdf}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
    >
      {loading ? (
        <>
          <RefreshCw size={16} className="mr-2 animate-spin" />
          {mode === "print" ? "Preparing..." : "Generating..."}
        </>
      ) : (
        <>
          <Icon size={16} className="mr-2" />
          {buttonText}
        </>
      )}
      {error && <span className="text-red-500 ml-2 text-xs">{error}</span>}
    </button>
  );
}