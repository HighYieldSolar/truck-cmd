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
      console.error('Error exporting to CSV:', error);
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
      console.error('Error exporting to TXT:', error);
      setExportState('error');
      setError('Failed to export data. Please try again.');
    }
  };

  // Handle PDF export with professional formatting
  const exportToPdf = async () => {
    try {
      setExportState('loading');
      setError(null);

      console.log("Starting PDF generation for IFTA summary");

      // Dynamically import jsPDF and jsPDF-AutoTable
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

      // Add company logo
      try {
        // Convert logo path to full URL
        const logoUrl = window.location.origin + company.logo;

        // Create a promise to load the image
        const loadImage = new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load logo'));
          img.src = logoUrl;
        });

        try {
          const img = await loadImage;
          // Add logo to PDF - small size in top left corner
          // Parameters: image, format, x, y, width, height
          doc.addImage(img, 'PNG', 15, 15, 40, 15); // 40mm wide, 15mm tall
        } catch (imgError) {
          console.log('Could not load logo, using text fallback');
          // Fallback to text if image fails
          doc.setFillColor(30, 144, 255);
          doc.rect(15, 15, 40, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text('TRUCK COMMAND', 35, 24, { align: 'center' });
        }
      } catch (logoError) {
        console.log('Logo error:', logoError);
      }

      // Add company info below the logo
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.setFont(undefined, 'normal');
      doc.text(company.address, 15, 35);
      doc.text(`${company.city}, ${company.state} ${company.zip}`, 15, 39);
      doc.text(`Phone: ${company.phone}`, 15, 43);
      doc.text(`Email: ${company.email}`, 15, 47);
      if (company.website) {
        doc.text(`Web: ${company.website}`, 15, 51);
      }

      // Add report title
      doc.setFontSize(20);
      doc.setTextColor(0);
      doc.setFont(undefined, 'bold');
      doc.text('IFTA QUARTERLY FUEL TAX REPORT', 105, 25, { align: 'center' });

      // Add quarter and date info
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Reporting Period: ${quarter}`, 105, 35, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 41, { align: 'center' });

      // Add vehicle info box
      if (selectedVehicle !== "all") {
        doc.setFillColor(240, 240, 240);
        doc.rect(140, 15, 55, 20, 'F');
        doc.setTextColor(0);
        doc.setFontSize(10);
        doc.text('Vehicle Information', 167.5, 22, { align: 'center' });
        doc.setFont(undefined, 'bold');
        doc.text(selectedVehicle, 167.5, 29, { align: 'center' });
        doc.setFont(undefined, 'normal');
      }

      // Prepare jurisdiction data
      const jurisdictionData = prepareJurisdictionData();
      const totalMiles = jurisdictionData.reduce((sum, state) => sum + state.miles, 0);
      const totalGallons = jurisdictionData.reduce((sum, state) => sum + state.gallons, 0);
      const avgMpg = totalGallons > 0 ? (totalMiles / totalGallons).toFixed(2) : 'N/A';

      // Add summary statistics box
      let yPos = 60;
      doc.setFillColor(245, 245, 245);
      doc.rect(15, yPos, 180, 30, 'F');
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('SUMMARY STATISTICS', 105, yPos + 7, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const statsY = yPos + 15;

      // Left column stats
      doc.text(`Total Miles: ${formatNumber(totalMiles, 1)}`, 25, statsY);
      doc.text(`Total Fuel Purchased: ${formatNumber(totalGallons, 0)} gallons`, 25, statsY + 6);

      // Right column stats
      doc.text(`Average MPG: ${avgMpg}`, 120, statsY);
      doc.text(`Reporting Jurisdictions: ${jurisdictionData.length}`, 120, statsY + 6);

      // Add jurisdiction breakdown table
      yPos = 100;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('JURISDICTION BREAKDOWN', 15, yPos);

      // Create table for jurisdiction data
      const tableColumns = [
        { header: 'Jurisdiction', dataKey: 'jurisdiction' },
        { header: 'State Name', dataKey: 'stateName' },
        { header: 'Miles Traveled', dataKey: 'miles' },
        { header: 'Fuel Purchased (Gal)', dataKey: 'gallons' },
        { header: 'Taxable Gallons', dataKey: 'taxableGallons' },
        { header: 'Net Taxable', dataKey: 'netTaxable' }
      ];

      // Calculate taxable gallons for each jurisdiction
      const tableData = jurisdictionData.map(state => ({
        jurisdiction: state.state,
        stateName: state.state,
        miles: formatNumber(state.miles, 1),
        gallons: formatNumber(state.gallons, 0),
        taxableGallons: totalGallons > 0 ? formatNumber((state.miles / totalMiles) * totalGallons, 1) : '0',
        netTaxable: totalGallons > 0 ? formatNumber(((state.miles / totalMiles) * totalGallons) - state.gallons, 1) : '0'
      }));

      // Add totals row
      tableData.push({
        jurisdiction: 'TOTAL',
        stateName: '',
        miles: formatNumber(totalMiles, 1),
        gallons: formatNumber(totalGallons, 0),
        taxableGallons: formatNumber(totalGallons, 0),
        netTaxable: '0.0'
      });

      autoTable(doc, {
        startY: yPos + 5,
        columns: tableColumns,
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 144, 255],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        footStyles: {
          fillColor: [220, 220, 220],
          textColor: 0,
          fontStyle: 'bold'
        },
        // Highlight the total row
        didParseCell: function (data) {
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fillColor = [220, 220, 220];
            data.cell.styles.textColor = 0;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      // Get final Y position after table
      const finalY = doc.lastAutoTable.finalY || 200;

      // Add additional information section
      if (finalY < 240) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80);

        let infoY = finalY + 15;

        // Add trip and fuel record counts
        doc.text(`Based on ${filteredTrips.length} trip records and ${filteredFuelData.length} fuel purchase records`, 15, infoY);

        // Add notes section
        infoY += 10;
        doc.setFont(undefined, 'italic');
        doc.text('Note: Taxable gallons are calculated based on miles traveled in each jurisdiction as a', 15, infoY);
        doc.text('percentage of total miles, multiplied by total fuel consumed.', 15, infoY + 5);
      }

      // Add footer with page numbers and timestamp
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.setFont(undefined, 'normal');

        // Add page footer
        doc.text(
          `IFTA Report - ${quarter} | Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
          105, 285, { align: 'center' }
        );

        // Add confidentiality notice
        doc.setFont(undefined, 'italic');
        doc.text(
          'This document contains confidential tax information. Handle accordingly.',
          105, 290, { align: 'center' }
        );
      }

      // Save the PDF
      const filename = `IFTA_Report_${quarter}_${selectedVehicle === "all" ? "All_Vehicles" : selectedVehicle}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      console.log(`IFTA PDF saved as: ${filename}`);

      setExportState('success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error generating PDF:', error);
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
      console.error('Error printing:', error);
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-y-auto"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget && exportState !== 'loading') {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto my-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Export IFTA Summary
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
            disabled={exportState === 'loading'}
            type="button"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Export your IFTA summary to share with your accountant or paperwork handler.
            This will include miles and gallons by jurisdiction for {quarter}
            {selectedVehicle !== "all" ? ` for vehicle ${selectedVehicle}` : " for all vehicles"}.
          </p>

          {/* Summary info */}
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <Truck size={20} className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Export Details</h4>
                <p className="text-sm text-blue-700">
                  <strong>Quarter:</strong> {quarter}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Vehicle:</strong> {selectedVehicle === "all" ? "All Vehicles" : selectedVehicle}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Trip Records:</strong> {filteredTrips.length}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Fuel Records:</strong> {filteredFuelData.length}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <label className={`flex flex-col items-center justify-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-all touch-manipulation ${exportFormat === 'pdf' ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'
                  }`}>
                  <input
                    type="radio"
                    name="exportFormat"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={() => setExportFormat('pdf')}
                    className="sr-only"
                  />
                  <FileText size={32} className={exportFormat === 'pdf' ? 'text-blue-500' : 'text-gray-400'} />
                  <span className="mt-2 text-sm font-medium text-gray-900">PDF Report</span>
                  <span className="text-xs text-gray-500">Professional format</span>
                </label>

                <label className={`flex flex-col items-center justify-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-all touch-manipulation ${exportFormat === 'csv' ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'
                  }`}>
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="sr-only"
                  />
                  <FileSpreadsheet size={32} className={exportFormat === 'csv' ? 'text-blue-500' : 'text-gray-400'} />
                  <span className="mt-2 text-sm font-medium text-gray-900">CSV</span>
                  <span className="text-xs text-gray-500">For Excel</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`flex flex-col items-center justify-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-all touch-manipulation ${exportFormat === 'txt' ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'
                  }`}>
                  <input
                    type="radio"
                    name="exportFormat"
                    value="txt"
                    checked={exportFormat === 'txt'}
                    onChange={() => setExportFormat('txt')}
                    className="sr-only"
                  />
                  <FileText size={32} className={exportFormat === 'txt' ? 'text-blue-500' : 'text-gray-400'} />
                  <span className="mt-2 text-sm font-medium text-gray-900">Text</span>
                  <span className="text-xs text-gray-500">Plain text</span>
                </label>

                <label className={`flex flex-col items-center justify-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-all touch-manipulation ${exportFormat === 'print' ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'
                  }`}>
                  <input
                    type="radio"
                    name="exportFormat"
                    value="print"
                    checked={exportFormat === 'print'}
                    onChange={() => setExportFormat('print')}
                    className="sr-only"
                  />
                  <Printer size={32} className={exportFormat === 'print' ? 'text-blue-500' : 'text-gray-400'} />
                  <span className="mt-2 text-sm font-medium text-gray-900">Print</span>
                  <span className="text-xs text-gray-500">Hard copy</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 p-3 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {exportState === 'success' && (
              <div className="bg-green-50 p-3 rounded-md flex items-center">
                <Check size={16} className="text-green-500 mr-2" />
                <p className="text-sm text-green-700">Export successful!</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={exportState === 'loading'}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none flex items-center"
            disabled={exportState === 'loading' || exportState === 'success' || filteredTrips.length === 0}
          >
            {exportState === 'loading' ? (
              <>
                <Download size={16} className="animate-bounce mr-2" />
                Exporting...
              </>
            ) : exportState === 'success' ? (
              <>
                <Check size={16} className="mr-2" />
                Exported
              </>
            ) : (
              <>
                <FileDown size={16} className="mr-2" />
                Export Summary
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