// src/components/ifta/SimplifiedExportModal.js - Enhanced with PDF export and branding
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
  Truck,
  Building2
} from "lucide-react";

export default function SimplifiedExportModal({
  isOpen,
  onClose,
  trips = [],
  quarter,
  fuelData = [],
  selectedVehicle = "all", // Add selectedVehicle prop
  companyInfo = null // Add company info for branding
}) {
  const [exportFormat, setExportFormat] = useState('pdf'); // Default to PDF for professional export
  const [exportState, setExportState] = useState('idle'); // idle, loading, success, error
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Use effect for better mobile handling
  useEffect(() => {
    setMounted(true);
    
    // Prevent body scroll when modal is open on mobile
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Default company info if not provided
  const company = companyInfo || {
    name: 'Truck Command',
    phone: '(951) 505-1147',
    email: 'support@truckcommand.com',
    website: 'www.truckcommand.com',
    logo: '/images/tc-name-tp-bg.png'
  };

  // State name mapping for professional reports
  const STATE_NAMES = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming',
    'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba', 'NB': 'New Brunswick',
    'NL': 'Newfoundland', 'NS': 'Nova Scotia', 'ON': 'Ontario', 'PE': 'Prince Edward Island',
    'QC': 'Quebec', 'SK': 'Saskatchewan'
  };

  if (!isOpen || !mounted) return null;

  // Format numbers for CSV export
  const formatNumber = (value, decimals = 1) => {
    return parseFloat(value || 0).toFixed(decimals);
  };

  // Filter trips by selected vehicle if needed
  const filteredTrips = selectedVehicle === "all"
    ? trips
    : trips.filter(trip => trip.vehicle_id === selectedVehicle);

  // Filter fuel data by selected vehicle if needed
  const filteredFuelData = selectedVehicle === "all"
    ? fuelData
    : fuelData.filter(entry => entry.vehicle_id === selectedVehicle);

  // Prepare jurisdiction data from filtered data
  const prepareJurisdictionData = () => {
    // Calculate miles by jurisdiction
    const milesByJurisdiction = {};

    // Process miles from filtered trips
    filteredTrips.forEach(trip => {
      // If trip has start and end in same jurisdiction
      if (trip.start_jurisdiction === trip.end_jurisdiction && trip.start_jurisdiction) {
        if (!milesByJurisdiction[trip.start_jurisdiction]) {
          milesByJurisdiction[trip.start_jurisdiction] = {
            state: trip.start_jurisdiction,
            miles: 0,
            gallons: 0
          };
        }
        milesByJurisdiction[trip.start_jurisdiction].miles += parseFloat(trip.total_miles || 0);
      }
      // If trip crosses jurisdictions, split miles between them
      else if (trip.start_jurisdiction && trip.end_jurisdiction) {
        if (!milesByJurisdiction[trip.start_jurisdiction]) {
          milesByJurisdiction[trip.start_jurisdiction] = {
            state: trip.start_jurisdiction,
            miles: 0,
            gallons: 0
          };
        }
        if (!milesByJurisdiction[trip.end_jurisdiction]) {
          milesByJurisdiction[trip.end_jurisdiction] = {
            state: trip.end_jurisdiction,
            miles: 0,
            gallons: 0
          };
        }

        // Split the miles between jurisdictions (simplified approach)
        const milesPerJurisdiction = parseFloat(trip.total_miles || 0) / 2;
        milesByJurisdiction[trip.start_jurisdiction].miles += milesPerJurisdiction;
        milesByJurisdiction[trip.end_jurisdiction].miles += milesPerJurisdiction;
      }
    });

    // Calculate fuel by jurisdiction from filtered fuel purchase data
    filteredFuelData.forEach(entry => {
      const state = entry.state;
      if (state && entry.gallons) {
        if (!milesByJurisdiction[state]) {
          milesByJurisdiction[state] = {
            state: state,
            miles: 0,
            gallons: 0
          };
        }
        milesByJurisdiction[state].gallons += Math.round(parseFloat(entry.gallons || 0));
      }
    });

    // Convert to array and sort by state
    return Object.values(milesByJurisdiction).sort((a, b) =>
      a.state.localeCompare(b.state)
    );
  };

  // Handle CSV export
  const exportToCsv = () => {
    try {
      setExportState('loading');
      setError(null);

      const jurisdictionData = prepareJurisdictionData();

      // Calculate totals
      const totalMiles = jurisdictionData.reduce((sum, state) => sum + state.miles, 0);
      const totalGallons = jurisdictionData.reduce((sum, state) => sum + state.gallons, 0);

      // Get vehicle information for filename and header
      const vehicleInfo = selectedVehicle === "all"
        ? "all_vehicles"
        : `vehicle_${selectedVehicle}`;

      // Create CSV rows
      const rows = [
        // Header info
        `IFTA Summary for ${quarter} - ${selectedVehicle === "all" ? "All Vehicles" : `Vehicle: ${selectedVehicle}`}`,
        `Generated on ${new Date().toLocaleDateString()}`,
        '',
        ['Jurisdiction', 'Miles', 'Gallons'].join(','),
        // Data rows
        ...jurisdictionData.map(state => [
          state.state,
          formatNumber(state.miles, 1),
          formatNumber(state.gallons, 3)
        ].join(','))
      ];

      // Add total row
      rows.push([
        'TOTAL',
        formatNumber(totalMiles, 1),
        formatNumber(totalGallons, 3)
      ].join(','));

      // Create and download the file
      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ifta_summary_${quarter.replace('-', '_')}_${vehicleInfo}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportState('success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setExportState('error');
      setError('Failed to export data. Please try again.');
    }
  };

  // Handle TXT export (for backup or sharing via email)
  const exportToTxt = () => {
    try {
      setExportState('loading');
      setError(null);

      const jurisdictionData = prepareJurisdictionData();

      // Calculate totals
      const totalMiles = jurisdictionData.reduce((sum, state) => sum + state.miles, 0);
      const totalGallons = jurisdictionData.reduce((sum, state) => sum + state.gallons, 0);

      // Get vehicle information for filename and header
      const vehicleInfo = selectedVehicle === "all"
        ? "All Vehicles"
        : `Vehicle: ${selectedVehicle}`;

      // Create text content
      let textContent = `IFTA SUMMARY FOR ${quarter} - ${vehicleInfo}\n`;
      textContent += `Generated on ${new Date().toLocaleDateString()}\n\n`;
      textContent += `JURISDICTION  |  MILES  |  GALLONS\n`;
      textContent += `------------------------------------\n`;

      jurisdictionData.forEach(state => {
        textContent += `${state.state.padEnd(14)} | ${formatNumber(state.miles, 1).padStart(7)} | ${formatNumber(state.gallons, 3).padStart(9)}\n`;
      });

      textContent += `------------------------------------\n`;
      textContent += `TOTAL         | ${formatNumber(totalMiles, 1).padStart(7)} | ${formatNumber(totalGallons, 3).padStart(9)}\n\n`;

      // Add some additional info
      textContent += `Based on ${filteredTrips.length} trip records and ${filteredFuelData.length} fuel purchases.\n`;
      textContent += `Average MPG: ${totalGallons > 0 ? (totalMiles / totalGallons).toFixed(2) : 'N/A'}\n`;

      // Create and download the file
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ifta_summary_${quarter.replace('-', '_')}_${selectedVehicle === "all" ? "all_vehicles" : `vehicle_${selectedVehicle}`}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportState('success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setExportState('error');
      setError('Failed to export data. Please try again.');
    }
  };

  // Handle PDF export with professional formatting
  const exportToPdf = async () => {
    try {
      setExportState('loading');
      setError(null);

      // Dynamically import jsPDF and jsPDF-AutoTable
      const [jsPDFModule, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);

      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;

      // Brand colors
      const brandBlue = [37, 99, 235]; // #2563EB
      const brandDarkBlue = [30, 64, 175]; // #1E40AF
      const lightGray = [248, 250, 252]; // #F8FAFC
      const mediumGray = [100, 116, 139]; // #64748B
      const darkGray = [30, 41, 59]; // #1E293B

      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      // ========== HEADER SECTION ==========
      // Blue header banner (compact)
      doc.setFillColor(...brandBlue);
      doc.rect(0, 0, pageWidth, 28, 'F');

      // Add logo
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
          // White background box for logo
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin, 5, 48, 14, 2, 2, 'F');
          doc.addImage(img, 'PNG', margin + 2, 6, 44, 12);
        } catch (imgError) {
          // Fallback: Text logo
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin, 5, 48, 14, 2, 2, 'F');
          doc.setTextColor(...brandBlue);
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.text('TRUCK COMMAND', margin + 24, 14, { align: 'center' });
        }
      } catch (logoError) {
        // Logo failed to load, continue without it
      }

      // Report title on header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      const [year, q] = quarter.split('-');
      const quarterLabel = `${q} ${year}`;
      doc.text(`IFTA QUARTERLY REPORT  •  ${quarterLabel}`, pageWidth - margin, 13, { align: 'right' });

      // Generation date and vehicle
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const vehicleStr = selectedVehicle !== "all" ? `  •  Vehicle: ${selectedVehicle}` : '';
      doc.text(`Generated: ${dateStr}${vehicleStr}`, pageWidth - margin, 21, { align: 'right' });

      // ========== SUMMARY STATISTICS SECTION ==========
      let yPos = 36;

      // Prepare jurisdiction data
      const jurisdictionData = prepareJurisdictionData();
      const totalMiles = jurisdictionData.reduce((sum, state) => sum + state.miles, 0);
      const totalGallons = jurisdictionData.reduce((sum, state) => sum + state.gallons, 0);
      const avgMpg = totalGallons > 0 ? (totalMiles / totalGallons) : 0;

      // Section title with accent bar on left
      doc.setDrawColor(...brandBlue);
      doc.setFillColor(...brandBlue);
      doc.rect(margin, yPos - 4, 2, 6, 'F');
      doc.setTextColor(...darkGray);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('SUMMARY', margin + 5, yPos);

      yPos += 6;

      // Stats boxes (compact)
      const boxWidth = (pageWidth - (margin * 2) - 9) / 4;
      const boxHeight = 18;
      const stats = [
        { label: 'Total Miles', value: totalMiles.toLocaleString('en-US', { maximumFractionDigits: 1 }) },
        { label: 'Fuel Purchased', value: `${totalGallons.toLocaleString('en-US', { maximumFractionDigits: 0 })} gal` },
        { label: 'Average MPG', value: avgMpg.toFixed(2) },
        { label: 'Jurisdictions', value: jurisdictionData.length.toString() }
      ];

      stats.forEach((stat, index) => {
        const boxX = margin + (index * (boxWidth + 3));

        // Box background
        doc.setFillColor(...lightGray);
        doc.roundedRect(boxX, yPos, boxWidth, boxHeight, 2, 2, 'F');

        // Box border
        doc.setDrawColor(...brandBlue);
        doc.setLineWidth(0.3);
        doc.roundedRect(boxX, yPos, boxWidth, boxHeight, 2, 2, 'S');

        // Value
        doc.setTextColor(...darkGray);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(stat.value, boxX + boxWidth / 2, yPos + 8, { align: 'center' });

        // Label
        doc.setTextColor(...mediumGray);
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.text(stat.label, boxX + boxWidth / 2, yPos + 14, { align: 'center' });
      });

      // ========== JURISDICTION BREAKDOWN TABLE ==========
      yPos += boxHeight + 8;

      // Section title with accent bar on left
      doc.setDrawColor(...brandBlue);
      doc.setFillColor(...brandBlue);
      doc.rect(margin, yPos - 4, 2, 6, 'F');
      doc.setTextColor(...darkGray);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('JURISDICTION BREAKDOWN', margin + 5, yPos);

      yPos += 5;

      // Table columns
      const tableColumns = [
        { header: 'ST', dataKey: 'code' },
        { header: 'Jurisdiction', dataKey: 'jurisdiction' },
        { header: 'Miles', dataKey: 'miles' },
        { header: 'Fuel (gal)', dataKey: 'gallons' },
        { header: 'Taxable', dataKey: 'taxableGallons' },
        { header: 'Net (+/-)', dataKey: 'netTaxable' }
      ];

      // Calculate taxable gallons for each jurisdiction
      const tableData = jurisdictionData.map(state => {
        const taxableGallons = totalMiles > 0 ? (state.miles / totalMiles) * totalGallons : 0;
        const netTaxable = taxableGallons - state.gallons;
        return {
          code: state.state,
          jurisdiction: STATE_NAMES[state.state] || state.state,
          miles: state.miles.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          gallons: state.gallons.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
          taxableGallons: taxableGallons.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          netTaxable: (netTaxable >= 0 ? '+' : '') + netTaxable.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        };
      });

      // Add totals row
      tableData.push({
        code: '',
        jurisdiction: 'TOTAL',
        miles: totalMiles.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        gallons: totalGallons.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
        taxableGallons: totalGallons.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
        netTaxable: '0.0'
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
          fontSize: 9,
          cellPadding: 2.5,
          textColor: darkGray
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        columnStyles: {
          code: { halign: 'center', fontStyle: 'bold' },
          jurisdiction: { halign: 'left' },
          miles: { halign: 'right' },
          gallons: { halign: 'right' },
          taxableGallons: { halign: 'right' },
          netTaxable: { halign: 'right' }
        },
        tableWidth: 'auto',
        didParseCell: function (data) {
          // Style the total row
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fillColor = brandDarkBlue;
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          }
          // Color code net taxable values
          if (data.column.dataKey === 'netTaxable' && data.row.index < tableData.length - 1) {
            const value = parseFloat(data.cell.raw.replace(/[+,]/g, ''));
            if (value > 0) {
              data.cell.styles.textColor = [220, 38, 38]; // Red for tax owed
            } else if (value < 0) {
              data.cell.styles.textColor = [22, 163, 74]; // Green for credit
            }
          }
        },
        margin: { left: margin, right: margin }
      });

      // Get final Y position after table
      const finalY = doc.lastAutoTable.finalY || 200;

      // ========== NOTES SECTION ==========
      if (finalY < pageHeight - 60) {
        let notesY = finalY + 12;

        // Notes box
        doc.setFillColor(255, 251, 235); // Light yellow
        doc.setDrawColor(245, 158, 11); // Amber border
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, notesY, pageWidth - (margin * 2), 28, 2, 2, 'FD');

        notesY += 6;
        doc.setTextColor(146, 64, 14); // Amber text
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('CALCULATION NOTES', margin + 4, notesY);

        notesY += 5;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.text('• Taxable gallons = (Miles in jurisdiction ÷ Total miles) × Total fuel purchased', margin + 4, notesY);
        notesY += 4;
        doc.text('• Net Taxable shows fuel tax credit (negative/green) or tax owed (positive/red) per jurisdiction', margin + 4, notesY);
        notesY += 4;
        doc.text(`• Based on ${filteredTrips.length} trip records and ${filteredFuelData.length} fuel purchase records for ${quarterLabel}`, margin + 4, notesY);
      }

      // ========== FOOTER ==========
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Footer line
        doc.setDrawColor(...mediumGray);
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

        // Company info
        doc.setTextColor(...mediumGray);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`${company.name} | ${company.website}`, margin, pageHeight - 13);

        // Contact
        doc.text(`${company.phone} | ${company.email}`, margin, pageHeight - 9);

        // Page number and timestamp
        doc.text(
          `Page ${i} of ${pageCount} | Generated ${new Date().toLocaleString()}`,
          pageWidth - margin, pageHeight - 13, { align: 'right' }
        );

        // Confidentiality notice
        doc.setFontSize(7);
        doc.setFont(undefined, 'italic');
        doc.text(
          'This document contains confidential IFTA tax information. Retain for your records.',
          pageWidth - margin, pageHeight - 9, { align: 'right' }
        );
      }

      // Save the PDF
      const filename = `IFTA_Report_${quarter}_${selectedVehicle === "all" ? "All_Vehicles" : selectedVehicle}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      setExportState('success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setExportState('error');
      setError('Failed to generate PDF. Please try again.');
    }
  };

  // Handle print view
  const printSummary = () => {
    try {
      setExportState('loading');

      // Generate PDF and print it instead of printing the page
      exportToPdf().then(() => {
        // After PDF is generated, trigger print
        setTimeout(() => {
          window.print();
        }, 500);
      });
    } catch (error) {
      setExportState('error');
      setError('Failed to print. Please try again.');
    }
  };

  // Handle export based on selected format
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
        printSummary();
        break;
      default:
        exportToPdf();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[9999] overflow-y-auto"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget && exportState !== 'loading') {
          onClose();
        }
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-md mx-auto sm:my-8 relative max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col animate-slide-up sm:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile-friendly Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4 sm:p-5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <FileDown size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              Export IFTA Report
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            disabled={exportState === 'loading'}
            type="button"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Mobile-optimized description */}
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
            Choose how to export your IFTA report for {quarter}
            {selectedVehicle !== "all" ? ` (${selectedVehicle})` : ""}.
          </p>

          {/* Compact Summary info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg mb-4 border border-blue-100 dark:border-blue-800">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Quarter:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">{quarter}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedVehicle === "all" ? "All" : selectedVehicle}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Trips:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">{filteredTrips.length}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Fuel Records:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">{filteredFuelData.length}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                Select Export Format
              </label>

              {/* Mobile-optimized format selection */}
              <div className="space-y-3">
                {/* PDF Option */}
                <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all touch-manipulation ${
                  exportFormat === 'pdf'
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 shadow-sm'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}>
                  <input
                    type="radio"
                    name="exportFormat"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={() => setExportFormat('pdf')}
                    className="sr-only"
                  />
                  <div className={`p-2 rounded-lg ${exportFormat === 'pdf' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <FileText size={24} className={exportFormat === 'pdf' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">PDF Report</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Professional format with branding</div>
                  </div>
                  {exportFormat === 'pdf' && (
                    <Check size={20} className="text-blue-600 dark:text-blue-400 ml-2" />
                  )}
                </label>

                {/* CSV Option */}
                <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all touch-manipulation ${
                  exportFormat === 'csv'
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 shadow-sm'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}>
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="sr-only"
                  />
                  <div className={`p-2 rounded-lg ${exportFormat === 'csv' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <FileSpreadsheet size={24} className={exportFormat === 'csv' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">Spreadsheet (CSV)</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">For Excel or Google Sheets</div>
                  </div>
                  {exportFormat === 'csv' && (
                    <Check size={20} className="text-blue-600 dark:text-blue-400 ml-2" />
                  )}
                </label>

                {/* Text Option */}
                <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all touch-manipulation ${
                  exportFormat === 'txt'
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 shadow-sm'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}>
                  <input
                    type="radio"
                    name="exportFormat"
                    value="txt"
                    checked={exportFormat === 'txt'}
                    onChange={() => setExportFormat('txt')}
                    className="sr-only"
                  />
                  <div className={`p-2 rounded-lg ${exportFormat === 'txt' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <File size={24} className={exportFormat === 'txt' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">Plain Text</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Simple format for email</div>
                  </div>
                  {exportFormat === 'txt' && (
                    <Check size={20} className="text-blue-600 dark:text-blue-400 ml-2" />
                  )}
                </label>

                {/* Print Option */}
                <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all touch-manipulation ${
                  exportFormat === 'print'
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 shadow-sm'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}>
                  <input
                    type="radio"
                    name="exportFormat"
                    value="print"
                    checked={exportFormat === 'print'}
                    onChange={() => setExportFormat('print')}
                    className="sr-only"
                  />
                  <div className={`p-2 rounded-lg ${exportFormat === 'print' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Printer size={24} className={exportFormat === 'print' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">Print</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Send to printer</div>
                  </div>
                  {exportFormat === 'print' && (
                    <Check size={20} className="text-blue-600 dark:text-blue-400 ml-2" />
                  )}
                </label>
              </div>
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

        {/* Mobile-friendly Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-4 py-4 sm:px-6 sm:py-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 touch-manipulation transition-colors"
            disabled={exportState === 'loading'}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 border border-transparent rounded-lg shadow-sm text-base sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none flex items-center justify-center touch-manipulation transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={exportState === 'loading' || exportState === 'success' || filteredTrips.length === 0}
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

  // Use portal to render modal at document root level for better mobile support
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return modalContent;
}