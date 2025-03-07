"use client";

import { useState } from 'react';
import { Download, FileText, RefreshCw } from 'lucide-react';

/**
 * Component that generates and downloads a PDF invoice
 * Note: This is a client-side component that uses jsPDF library for PDF generation
 * In a production environment, you might want to use a server-side approach for more complex PDFs
 */
export default function InvoicePdfGenerator({ invoice, companyInfo }) {
  const [loading, setLoading] = useState(false);

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

      // Dynamically import jsPDF and jsPDF-AutoTable
      // This reduces the initial bundle size since these libraries are quite large
      const [jsPDFModule, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      
      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;

      // Create new PDF document
      const doc = new jsPDF();
      
      // Add company logo (if in production with real logo)
      // doc.addImage(company.logo, 'PNG', 15, 15, 50, 20);

      // Add company info
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(company.name, 15, 20);
      doc.text(company.address, 15, 25);
      doc.text(`${company.city}, ${company.state} ${company.zip}`, 15, 30);
      doc.text(`Phone: ${company.phone}`, 15, 35);
      doc.text(`Email: ${company.email}`, 15, 40);
      
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
      doc.text('BILL TO:', 15, 60);
      doc.setFontSize(10);
      doc.text(invoice.customer, 15, 65);
      
      // Add shipment info if available
      if (invoice.loadDetails) {
        doc.setFontSize(11);
        doc.text('SHIPMENT INFO:', 140, 60);
        doc.setFontSize(10);
        
        let yPos = 65;
        
        if (invoice.loadDetails.loadNumber) {
          doc.text(`Load #: ${invoice.loadDetails.loadNumber}`, 140, yPos);
          yPos += 5;
        }
        
        if (invoice.loadDetails.origin || invoice.loadDetails.destination) {
          doc.text(`Route: ${invoice.loadDetails.origin || ''} → ${invoice.loadDetails.destination || ''}`, 140, yPos);
          yPos += 5;
        }
        
        if (invoice.loadDetails.deliveryDate) {
          doc.text(`Delivered: ${new Date(invoice.loadDetails.deliveryDate).toLocaleDateString()}`, 140, yPos);
        }
      }
      
      // Add line items table
      autoTable(doc, {
        startY: 80,
        head: [['Description', 'Quantity', 'Unit Price', 'Total']],
        body: invoice.items.map(item => [
          item.description,
          item.quantity.toString(),
          `$${item.unitPrice.toFixed(2)}`,
          `$${(item.quantity * item.unitPrice).toFixed(2)}`
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [66, 139, 202]
        },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' }
        }
      });
      
      // Calculate where the table ended
      const finalY = (doc.lastAutoTable.finalY || 120) + 10;
      
      // Add totals section
      doc.setFontSize(10);
      doc.text('Subtotal:', 140, finalY);
      doc.text(`$${invoice.subtotal?.toFixed(2) || '0.00'}`, 175, finalY, { align: 'right' });
      
      doc.text(`Tax (${invoice.tax_rate || 0}%):`, 140, finalY + 5);
      doc.text(`$${invoice.tax_amount?.toFixed(2) || '0.00'}`, 175, finalY + 5, { align: 'right' });
      
      doc.setFontSize(11);
      doc.text('Total:', 140, finalY + 12);
      doc.text(`$${invoice.total?.toFixed(2) || '0.00'}`, 175, finalY + 12, { align: 'right' });
      
      doc.text('Amount Paid:', 140, finalY + 18);
      doc.text(`$${invoice.amount_paid?.toFixed(2) || '0.00'}`, 175, finalY + 18, { align: 'right' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Balance Due:', 140, finalY + 25);
      const balanceDue = (invoice.total || 0) - (invoice.amount_paid || 0);
      doc.text(`$${balanceDue.toFixed(2)}`, 175, finalY + 25, { align: 'right' });
      doc.setFont(undefined, 'normal');
      
      // Add notes and terms if available
      let notesY = finalY + 35;
      
      if (invoice.notes) {
        doc.setFontSize(11);
        doc.text('NOTES:', 15, notesY);
        doc.setFontSize(10);
        
        // Split notes into multiple lines if needed
        const splitNotes = doc.splitTextToSize(invoice.notes, 170);
        doc.text(splitNotes, 15, notesY + 5);
        
        notesY += 10 + (splitNotes.length * 5);
      }
      
      if (invoice.terms) {
        doc.setFontSize(11);
        doc.text('TERMS & CONDITIONS:', 15, notesY);
        doc.setFontSize(10);
        
        // Split terms into multiple lines if needed
        const splitTerms = doc.splitTextToSize(invoice.terms, 170);
        doc.text(splitTerms, 15, notesY + 5);
      }
      
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
      
      // Save the PDF
      doc.save(`Invoice_${invoice.invoice_number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generatePdf}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
    >
      {loading ? (
        <>
          <RefreshCw size={16} className="mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download size={16} className="mr-2" />
          Download PDF
        </>
      )}
    </button>
  );
}