// src/components/common/ExportReportModal.js
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  X,
  FileDown,
  Printer,
  FileText,
  Check,
  FileSpreadsheet,
  File,
  Calendar,
  Filter
} from "lucide-react";

/**
 * Reusable Export Report Modal Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {function} props.onClose - Close handler
 * @param {string} props.title - Modal title (e.g., "Export Expenses Report")
 * @param {string} props.description - Description text
 * @param {Array} props.data - Data to export
 * @param {Array} props.columns - Column definitions for export [{key, header, format}]
 * @param {string} props.filename - Base filename for export
 * @param {Object} props.summaryInfo - Summary information to display
 * @param {Object} props.pdfConfig - PDF configuration options
 * @param {Object} props.dateRange - Optional date range {start, end}
 * @param {function} props.onExportComplete - Callback when export completes
 */
export default function ExportReportModal({
  isOpen,
  onClose,
  title = "Export Report",
  description = "Choose your export format",
  data = [],
  columns = [],
  filename = "report",
  summaryInfo = {},
  pdfConfig = {},
  dateRange = null,
  onExportComplete
}) {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportState, setExportState] = useState('idle');
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setExportState('idle');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Default company info
  const company = pdfConfig.companyInfo || {
    name: 'Truck Command',
    phone: '(951) 505-1147',
    email: 'support@truckcommand.com',
    website: 'www.truckcommand.com'
  };

  // Brand colors for PDF
  const brandBlue = [37, 99, 235];
  const brandDarkBlue = [30, 64, 175];
  const lightGray = [248, 250, 252];
  const mediumGray = [100, 116, 139];
  const darkGray = [30, 41, 59];

  // Format value based on column format type
  const formatValue = (value, format) => {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'currency':
        return '$' + parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case 'number':
        return parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      case 'date':
        if (!value) return '-';
        return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      case 'percent':
        return parseFloat(value).toFixed(1) + '%';
      default:
        return String(value);
    }
  };

  // Export to CSV
  const exportToCsv = () => {
    try {
      setExportState('loading');
      setError(null);

      const headers = columns.map(col => col.header);
      const rows = data.map(item =>
        columns.map(col => {
          const value = item[col.key];
          return formatValue(value, col.format);
        })
      );

      let csvContent = '';

      // Add title and date range
      csvContent += `${title}\n`;
      if (dateRange?.start && dateRange?.end) {
        csvContent += `Date Range: ${dateRange.start} to ${dateRange.end}\n`;
      }
      csvContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;

      // Add headers
      csvContent += headers.join(',') + '\n';

      // Add data rows
      rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportState('success');
      onExportComplete?.();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setExportState('error');
      setError('Failed to export CSV. Please try again.');
    }
  };

  // Export to TXT
  const exportToTxt = () => {
    try {
      setExportState('loading');
      setError(null);

      let textContent = `${title.toUpperCase()}\n`;
      textContent += '='.repeat(50) + '\n\n';

      if (dateRange?.start && dateRange?.end) {
        textContent += `Date Range: ${dateRange.start} to ${dateRange.end}\n`;
      }
      textContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;

      // Add summary info
      if (Object.keys(summaryInfo).length > 0) {
        textContent += 'SUMMARY\n';
        textContent += '-'.repeat(30) + '\n';
        Object.entries(summaryInfo).forEach(([key, value]) => {
          textContent += `${key}: ${value}\n`;
        });
        textContent += '\n';
      }

      // Add data
      textContent += 'DATA\n';
      textContent += '-'.repeat(30) + '\n';

      data.forEach((item, index) => {
        textContent += `\n#${index + 1}\n`;
        columns.forEach(col => {
          const value = formatValue(item[col.key], col.format);
          textContent += `  ${col.header}: ${value}\n`;
        });
      });

      // Download
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportState('success');
      onExportComplete?.();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setExportState('error');
      setError('Failed to export text file. Please try again.');
    }
  };

  // Export to PDF
  const exportToPdf = async () => {
    try {
      setExportState('loading');
      setError(null);

      const [jsPDFModule, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);

      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      // Header banner
      doc.setFillColor(...brandBlue);
      doc.rect(0, 0, pageWidth, 28, 'F');

      // Logo placeholder
      try {
        const logoUrl = window.location.origin + '/images/tc-name-tp-bg.png';
        const loadImage = new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load logo'));
          img.src = logoUrl;
        });

        try {
          const img = await loadImage;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin, 5, 48, 14, 2, 2, 'F');
          doc.addImage(img, 'PNG', margin + 2, 6, 44, 12);
        } catch {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin, 5, 48, 14, 2, 2, 'F');
          doc.setTextColor(...brandBlue);
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text('TRUCK COMMAND', margin + 24, 14, { align: 'center' });
        }
      } catch {
        // Continue without logo
      }

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(title.toUpperCase(), pageWidth - margin, 13, { align: 'right' });

      // Date info
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      let dateStr = `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`;
      if (dateRange?.start && dateRange?.end) {
        dateStr = `${dateRange.start} - ${dateRange.end}`;
      }
      doc.text(dateStr, pageWidth - margin, 21, { align: 'right' });

      let yPos = 36;

      // Summary section
      if (Object.keys(summaryInfo).length > 0) {
        doc.setDrawColor(...brandBlue);
        doc.setFillColor(...brandBlue);
        doc.rect(margin, yPos - 4, 2, 6, 'F');
        doc.setTextColor(...darkGray);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('SUMMARY', margin + 5, yPos);

        yPos += 6;

        const summaryEntries = Object.entries(summaryInfo);
        const boxWidth = (pageWidth - (margin * 2) - ((summaryEntries.length - 1) * 3)) / Math.min(summaryEntries.length, 4);
        const boxHeight = 18;

        summaryEntries.slice(0, 4).forEach((entry, index) => {
          const [label, value] = entry;
          const boxX = margin + (index * (boxWidth + 3));

          doc.setFillColor(...lightGray);
          doc.roundedRect(boxX, yPos, boxWidth, boxHeight, 2, 2, 'F');

          doc.setDrawColor(...brandBlue);
          doc.setLineWidth(0.3);
          doc.roundedRect(boxX, yPos, boxWidth, boxHeight, 2, 2, 'S');

          doc.setTextColor(...darkGray);
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(String(value), boxX + boxWidth / 2, yPos + 8, { align: 'center' });

          doc.setTextColor(...mediumGray);
          doc.setFontSize(7);
          doc.setFont(undefined, 'normal');
          doc.text(label, boxX + boxWidth / 2, yPos + 14, { align: 'center' });
        });

        yPos += boxHeight + 10;
      }

      // Data table section
      doc.setDrawColor(...brandBlue);
      doc.setFillColor(...brandBlue);
      doc.rect(margin, yPos - 4, 2, 6, 'F');
      doc.setTextColor(...darkGray);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('DETAILS', margin + 5, yPos);

      yPos += 5;

      // Table data
      const tableColumns = columns.map(col => ({
        header: col.header,
        dataKey: col.key
      }));

      const tableData = data.map(item => {
        const row = {};
        columns.forEach(col => {
          row[col.key] = formatValue(item[col.key], col.format);
        });
        return row;
      });

      autoTable(doc, {
        startY: yPos,
        columns: tableColumns,
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: brandBlue,
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 3
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: darkGray
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        columnStyles: columns.reduce((acc, col, index) => {
          acc[col.key] = {
            halign: col.format === 'currency' || col.format === 'number' ? 'right' : 'left'
          };
          return acc;
        }, {}),
        margin: { left: margin, right: margin, bottom: 25 },
        showHead: 'everyPage',
        didDrawPage: (data) => {
          // Footer on each page
          const pageCount = doc.internal.getNumberOfPages();
          doc.setDrawColor(...mediumGray);
          doc.setLineWidth(0.2);
          doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

          doc.setTextColor(...mediumGray);
          doc.setFontSize(8);
          doc.setFont(undefined, 'normal');
          doc.text(`${company.name} | ${company.website}`, margin, pageHeight - 13);
          doc.text(`${company.phone} | ${company.email}`, margin, pageHeight - 9);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount} | Generated ${new Date().toLocaleString()}`,
            pageWidth - margin, pageHeight - 13, { align: 'right' }
          );
        }
      });

      // Save
      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);

      setExportState('success');
      onExportComplete?.();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setExportState('error');
      setError('Failed to generate PDF. Please try again.');
    }
  };

  // Print handler
  const handlePrint = async () => {
    await exportToPdf();
    setTimeout(() => window.print(), 500);
  };

  // Main export handler
  const handleExport = () => {
    switch (exportFormat) {
      case 'pdf':
        exportToPdf();
        break;
      case 'csv':
        exportToCsv();
        break;
      case 'txt':
        exportToTxt();
        break;
      case 'print':
        handlePrint();
        break;
      default:
        exportToPdf();
    }
  };

  const formatOptions = [
    { value: 'pdf', icon: FileText, label: 'PDF Report', description: 'Professional format with branding' },
    { value: 'csv', icon: FileSpreadsheet, label: 'Spreadsheet (CSV)', description: 'For Excel or Google Sheets' },
    { value: 'txt', icon: File, label: 'Plain Text', description: 'Simple format for email' },
    { value: 'print', icon: Printer, label: 'Print', description: 'Send to printer' }
  ];

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[9999] overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && exportState !== 'loading') {
          onClose();
        }
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-md mx-auto sm:my-8 relative max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4 sm:p-5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <FileDown size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={exportState === 'loading'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
            {description}
          </p>

          {/* Summary Info */}
          {Object.keys(summaryInfo).length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg mb-4 border border-blue-100 dark:border-blue-800">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(summaryInfo).slice(0, 4).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          {dateRange?.start && dateRange?.end && (
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <Calendar size={16} />
              <span>Date range: {dateRange.start} to {dateRange.end}</span>
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
              Select Export Format
            </label>

            <div className="space-y-3">
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      exportFormat === option.value
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 shadow-sm'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value={option.value}
                      checked={exportFormat === option.value}
                      onChange={() => setExportFormat(option.value)}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-lg ${
                      exportFormat === option.value
                        ? 'bg-blue-100 dark:bg-blue-900/40'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Icon size={24} className={
                        exportFormat === option.value
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      } />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{option.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
                    </div>
                    {exportFormat === option.value && (
                      <Check size={20} className="text-blue-600 dark:text-blue-400 ml-2" />
                    )}
                  </label>
                );
              })}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-md border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {exportState === 'success' && (
              <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-md flex items-center border border-green-200 dark:border-green-800">
                <Check size={16} className="text-green-500 dark:text-green-400 mr-2" />
                <p className="text-sm text-green-700 dark:text-green-300">Export successful!</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-4 py-4 sm:px-6 sm:py-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            disabled={exportState === 'loading'}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 border border-transparent rounded-lg shadow-sm text-base sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={exportState === 'loading' || exportState === 'success' || data.length === 0}
          >
            {exportState === 'loading' ? (
              <>
                <Download size={18} className="animate-bounce mr-2" />
                Exporting...
              </>
            ) : exportState === 'success' ? (
              <>
                <Check size={18} className="mr-2" />
                Exported
              </>
            ) : (
              <>
                <FileDown size={18} className="mr-2" />
                Export Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
