// src/components/ifta/EnhancedExportModal.js
"use client";

import { useState } from "react";
import { 
  FileDown, 
  Download, 
  FileText, 
  RefreshCw, 
  X, 
  FileIcon, 
  File,
  Database,
  Code,
  Mail
} from "lucide-react";

/**
 * Enhanced Export Modal Component
 * Provides multiple export format options for IFTA data
 */
export default function EnhancedExportModal({ 
  isOpen, 
  onClose, 
  trips = [], 
  quarter = "",
  fuelData = [], 
  stats = {}
}) {
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportType, setExportType] = useState("detailed");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Generate filename based on quarter and export type
  const getFilename = () => {
    const baseFilename = `truck_command_ifta_${quarter.replace('-', '_')}_${exportType}`;
    
    switch (exportFormat) {
      case "csv":
        return `${baseFilename}.csv`;
      case "xlsx":
        return `${baseFilename}.xlsx`;
      case "pdf":
        return `${baseFilename}.pdf`;
      case "json":
        return `${baseFilename}.json`;
      case "xml":
        return `${baseFilename}.xml`;
      case "docx":
        return `${baseFilename}.docx`;
      default:
        return `${baseFilename}.csv`;
    }
  };

  // Create CSV content from data
  const generateCSV = () => {
    try {
      let csvRows = [];
      
      if (exportType === "detailed") {
        // Header row for detailed export
        csvRows.push([
          'Trip ID', 'Date', 'Vehicle ID', 'Driver ID', 
          'Start Jurisdiction', 'End Jurisdiction', 
          'Miles', 'Gallons', 'Fuel Cost', 
          'Starting Odometer', 'Ending Odometer', 
          'Load ID', 'Mileage Trip ID', 'Source'
        ].join(','));
        
        // Data rows
        trips.forEach(trip => {
          csvRows.push([
            trip.id,
            trip.start_date,
            trip.vehicle_id,
            trip.driver_id || '',
            trip.start_jurisdiction,
            trip.end_jurisdiction,
            trip.total_miles,
            trip.gallons || 0,
            trip.fuel_cost || 0,
            trip.starting_odometer || 0,
            trip.ending_odometer || 0,
            trip.load_id || '',
            trip.mileage_trip_id || '',
            trip.mileage_trip_id ? 'mileage' : trip.load_id ? 'load' : 'manual'
          ].join(','));
        });
      } else {
        // Summary report export
        const jurisdictionData = calculateJurisdictionData(trips, fuelData);
        
        // Header row for summary export
        csvRows.push([
          'Jurisdiction', 'Total Miles', 'Taxable Miles', 
          'Tax Paid Gallons', 'Net Taxable Gallons'
        ].join(','));
        
        // Jurisdiction data rows
        jurisdictionData.jurisdictions.forEach(jurisdiction => {
          csvRows.push([
            jurisdiction.jurisdiction,
            jurisdiction.totalMiles.toFixed(1),
            jurisdiction.taxableMiles.toFixed(1),
            jurisdiction.taxPaidGallons.toFixed(3),
            jurisdiction.netTaxableGallons.toFixed(3)
          ].join(','));
        });
        
        // Summary row
        csvRows.push([
          'TOTAL',
          jurisdictionData.totalMiles.toFixed(1),
          jurisdictionData.totalMiles.toFixed(1),
          jurisdictionData.totalGallons.toFixed(3),
          (jurisdictionData.totalMiles / jurisdictionData.avgMpg - jurisdictionData.totalGallons).toFixed(3)
        ].join(','));
      }
      
      return csvRows.join('\n');
    } catch (error) {
      console.error("Error generating CSV:", error);
      setError("Failed to generate CSV file. Please try again.");
      return null;
    }
  };

  // Convert CSV to XML
  const generateXML = () => {
    try {
      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
      
      if (exportType === "detailed") {
        xmlContent += '<iftaData>\n';
        xmlContent += `  <quarter>${quarter}</quarter>\n`;
        xmlContent += '  <trips>\n';
        
        trips.forEach(trip => {
          xmlContent += '    <trip>\n';
          xmlContent += `      <id>${trip.id}</id>\n`;
          xmlContent += `      <date>${trip.start_date}</date>\n`;
          xmlContent += `      <vehicleId>${trip.vehicle_id}</vehicleId>\n`;
          xmlContent += `      <driverId>${trip.driver_id || ''}</driverId>\n`;
          xmlContent += `      <startJurisdiction>${trip.start_jurisdiction}</startJurisdiction>\n`;
          xmlContent += `      <endJurisdiction>${trip.end_jurisdiction}</endJurisdiction>\n`;
          xmlContent += `      <miles>${trip.total_miles}</miles>\n`;
          xmlContent += `      <gallons>${trip.gallons || 0}</gallons>\n`;
          xmlContent += `      <fuelCost>${trip.fuel_cost || 0}</fuelCost>\n`;
          xmlContent += `      <startingOdometer>${trip.starting_odometer || 0}</startingOdometer>\n`;
          xmlContent += `      <endingOdometer>${trip.ending_odometer || 0}</endingOdometer>\n`;
          xmlContent += `      <loadId>${trip.load_id || ''}</loadId>\n`;
          xmlContent += `      <mileageTripId>${trip.mileage_trip_id || ''}</mileageTripId>\n`;
          xmlContent += `      <source>${trip.mileage_trip_id ? 'mileage' : trip.load_id ? 'load' : 'manual'}</source>\n`;
          xmlContent += '    </trip>\n';
        });
        
        xmlContent += '  </trips>\n';
        xmlContent += '</iftaData>';
      } else {
        // Summary report XML
        const jurisdictionData = calculateJurisdictionData(trips, fuelData);
        
        xmlContent += '<iftaSummary>\n';
        xmlContent += `  <quarter>${quarter}</quarter>\n`;
        xmlContent += `  <totalMiles>${jurisdictionData.totalMiles.toFixed(1)}</totalMiles>\n`;
        xmlContent += `  <totalGallons>${jurisdictionData.totalGallons.toFixed(3)}</totalGallons>\n`;
        xmlContent += `  <avgMpg>${jurisdictionData.avgMpg.toFixed(2)}</avgMpg>\n`;
        
        xmlContent += '  <jurisdictions>\n';
        
        jurisdictionData.jurisdictions.forEach(jurisdiction => {
          xmlContent += '    <jurisdiction>\n';
          xmlContent += `      <code>${jurisdiction.jurisdiction}</code>\n`;
          xmlContent += `      <totalMiles>${jurisdiction.totalMiles.toFixed(1)}</totalMiles>\n`;
          xmlContent += `      <taxableMiles>${jurisdiction.taxableMiles.toFixed(1)}</taxableMiles>\n`;
          xmlContent += `      <taxPaidGallons>${jurisdiction.taxPaidGallons.toFixed(3)}</taxPaidGallons>\n`;
          xmlContent += `      <netTaxableGallons>${jurisdiction.netTaxableGallons.toFixed(3)}</netTaxableGallons>\n`;
          xmlContent += '    </jurisdiction>\n';
        });
        
        xmlContent += '  </jurisdictions>\n';
        xmlContent += '</iftaSummary>';
      }
      
      return xmlContent;
    } catch (error) {
      console.error("Error generating XML:", error);
      setError("Failed to generate XML file. Please try again.");
      return null;
    }
  };

  // Generate JSON format
  const generateJSON = () => {
    try {
      if (exportType === "detailed") {
        // Prepare trips data with proper formatting
        const formattedTrips = trips.map(trip => ({
          id: trip.id,
          date: trip.start_date,
          vehicle_id: trip.vehicle_id,
          driver_id: trip.driver_id || null,
          start_jurisdiction: trip.start_jurisdiction,
          end_jurisdiction: trip.end_jurisdiction,
          miles: parseFloat(trip.total_miles) || 0,
          gallons: parseFloat(trip.gallons) || 0,
          fuel_cost: parseFloat(trip.fuel_cost) || 0,
          starting_odometer: parseFloat(trip.starting_odometer) || 0,
          ending_odometer: parseFloat(trip.ending_odometer) || 0,
          load_id: trip.load_id || null,
          mileage_trip_id: trip.mileage_trip_id || null,
          source: trip.mileage_trip_id ? 'mileage' : trip.load_id ? 'load' : 'manual'
        }));
        
        return JSON.stringify({
          quarter: quarter,
          export_date: new Date().toISOString(),
          export_type: "detailed",
          trips: formattedTrips
        }, null, 2);
      } else {
        // Summary report JSON
        const jurisdictionData = calculateJurisdictionData(trips, fuelData);
        
        return JSON.stringify({
          quarter: quarter,
          export_date: new Date().toISOString(),
          export_type: "summary",
          total_miles: jurisdictionData.totalMiles,
          total_gallons: jurisdictionData.totalGallons,
          avg_mpg: jurisdictionData.avgMpg,
          jurisdictions: jurisdictionData.jurisdictions.map(j => ({
            jurisdiction: j.jurisdiction,
            total_miles: j.totalMiles,
            taxable_miles: j.taxableMiles,
            tax_paid_gallons: j.taxPaidGallons,
            net_taxable_gallons: j.netTaxableGallons
          }))
        }, null, 2);
      }
    } catch (error) {
      console.error("Error generating JSON:", error);
      setError("Failed to generate JSON file. Please try again.");
      return null;
    }
  };

  // Calculate jurisdiction data for summary reports
  const calculateJurisdictionData = (trips, fuelData) => {
    // First, extract all jurisdictions involved
    const allJurisdictions = new Set();
    trips.forEach(trip => {
      if (trip.start_jurisdiction) allJurisdictions.add(trip.start_jurisdiction);
      if (trip.end_jurisdiction) allJurisdictions.add(trip.end_jurisdiction);
    });

    // Also add jurisdictions from fuel data
    fuelData.forEach(entry => {
      if (entry.state) allJurisdictions.add(entry.state);
    });

    // Create a map of jurisdiction data
    const jurisdictionMap = {};
    allJurisdictions.forEach(jurisdiction => {
      jurisdictionMap[jurisdiction] = {
        jurisdiction,
        totalMiles: 0,
        taxableMiles: 0,
        taxPaidGallons: 0,
        netTaxableGallons: 0
      };
    });

    // Process trips to calculate miles in each jurisdiction
    trips.forEach(trip => {
      // Simple case: if start and end are the same, all miles belong to that jurisdiction
      if (trip.start_jurisdiction === trip.end_jurisdiction && trip.start_jurisdiction) {
        const miles = parseFloat(trip.total_miles) || 0;
        jurisdictionMap[trip.start_jurisdiction].totalMiles += miles;
        jurisdictionMap[trip.start_jurisdiction].taxableMiles += miles;
      } 
      // If crossing jurisdictions, split miles 50/50 (simplified approach)
      else if (trip.start_jurisdiction && trip.end_jurisdiction) {
        const miles = parseFloat(trip.total_miles) || 0;
        const milesPerJurisdiction = miles / 2;
        
        jurisdictionMap[trip.start_jurisdiction].totalMiles += milesPerJurisdiction;
        jurisdictionMap[trip.start_jurisdiction].taxableMiles += milesPerJurisdiction;
        
        jurisdictionMap[trip.end_jurisdiction].totalMiles += milesPerJurisdiction;
        jurisdictionMap[trip.end_jurisdiction].taxableMiles += milesPerJurisdiction;
      }
    });

    // Process fuel data to calculate tax-paid gallons in each jurisdiction
    fuelData.forEach(entry => {
      const jurisdiction = entry.state;
      if (jurisdiction && jurisdictionMap[jurisdiction]) {
        jurisdictionMap[jurisdiction].taxPaidGallons += parseFloat(entry.gallons) || 0;
      }
    });

    // Calculate the rest of the values
    const totalMiles = Object.values(jurisdictionMap).reduce((sum, j) => sum + j.totalMiles, 0);
    const totalGallons = fuelData.reduce((sum, entry) => sum + (parseFloat(entry.gallons) || 0), 0);
    
    // Average fuel consumption (MPG)
    const avgMpg = totalMiles > 0 && totalGallons > 0 ? totalMiles / totalGallons : 6.0;

    // Calculate net taxable gallons for each jurisdiction
    Object.values(jurisdictionMap).forEach(j => {
      // Taxable gallons based on miles and average consumption
      const taxableGallons = j.taxableMiles / avgMpg;
      
      // Net taxable gallons = taxable gallons - tax paid gallons
      j.netTaxableGallons = taxableGallons - j.taxPaidGallons;
    });

    return {
      jurisdictions: Object.values(jurisdictionMap),
      totalMiles,
      totalGallons,
      avgMpg
    };
  };

  // Handle the export action
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      
      let content = null;
      let mimeType = 'text/plain';
      
      // Generate content based on selected format
      switch (exportFormat) {
        case "csv":
          content = generateCSV();
          mimeType = 'text/csv';
          break;
        case "json":
          content = generateJSON();
          mimeType = 'application/json';
          break;
        case "xml":
          content = generateXML();
          mimeType = 'application/xml';
          break;
        case "xlsx":
          // For XLSX we would normally use a library like SheetJS/xlsx
          // This is a simplified version that just offers CSV instead
          content = generateCSV();
          mimeType = 'text/csv';
          alert("XLSX export requires additional libraries. Downloading as CSV instead.");
          break;
        case "pdf":
          // For PDF we would normally use a library like jsPDF or browser PDF generation
          // This is a simplified version that just offers CSV instead
          content = generateCSV();
          mimeType = 'text/csv';
          alert("PDF export requires additional libraries. Downloading as CSV instead.");
          break;
        case "docx":
          // For DOCX we would normally use a library like docx.js
          // This is a simplified version that just offers CSV instead
          content = generateCSV();
          mimeType = 'text/csv';
          alert("Word document export requires additional libraries. Downloading as CSV instead.");
          break;
        default:
          content = generateCSV();
          mimeType = 'text/csv';
      }
      
      if (!content) {
        throw new Error("Failed to generate file content");
      }
      
      // Create blob and download
      const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', getFilename());
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
    } catch (error) {
      console.error('Error during export:', error);
      setError('Failed to export data: ' + (error.message || "Unknown error"));
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Export IFTA Data
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="mt-4">
                  {/* Export Type Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`border rounded-md p-3 text-center cursor-pointer ${
                        exportType === "detailed" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="exportType"
                          value="detailed"
                          checked={exportType === "detailed"}
                          onChange={() => setExportType("detailed")}
                          className="sr-only"
                        />
                        <FileText size={24} className="mx-auto mb-2 text-gray-700" />
                        <span className="block text-sm text-gray-900">Detailed Data</span>
                        <span className="text-xs text-gray-500">All trip records</span>
                      </label>
                      
                      <label className={`border rounded-md p-3 text-center cursor-pointer ${
                        exportType === "summary" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="exportType"
                          value="summary"
                          checked={exportType === "summary"}
                          onChange={() => setExportType("summary")}
                          className="sr-only"
                        />
                        <FileIcon size={24} className="mx-auto mb-2 text-gray-700" />
                        <span className="block text-sm text-gray-900">Summary Report</span>
                        <span className="text-xs text-gray-500">State-by-state totals</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* File Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File Format
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <label className={`border rounded-md p-2 text-center cursor-pointer ${
                        exportFormat === "csv" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="exportFormat"
                          value="csv"
                          checked={exportFormat === "csv"}
                          onChange={() => setExportFormat("csv")}
                          className="sr-only"
                        />
                        <FileText size={20} className="mx-auto mb-1 text-gray-700" />
                        <span className="block text-xs text-gray-900">CSV</span>
                      </label>
                      
                      <label className={`border rounded-md p-2 text-center cursor-pointer ${
                        exportFormat === "xlsx" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="exportFormat"
                          value="xlsx"
                          checked={exportFormat === "xlsx"}
                          onChange={() => setExportFormat("xlsx")}
                          className="sr-only"
                        />
                        <FileIcon size={20} className="mx-auto mb-1 text-gray-700" />
                        <span className="block text-xs text-gray-900">Excel</span>
                      </label>
                      
                      <label className={`border rounded-md p-2 text-center cursor-pointer ${
                        exportFormat === "pdf" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="exportFormat"
                          value="pdf"
                          checked={exportFormat === "pdf"}
                          onChange={() => setExportFormat("pdf")}
                          className="sr-only"
                        />
                        <File size={20} className="mx-auto mb-1 text-gray-700" />
                        <span className="block text-xs text-gray-900">PDF</span>
                      </label>
                      
                      <label className={`border rounded-md p-2 text-center cursor-pointer ${
                        exportFormat === "docx" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="exportFormat"
                          value="docx"
                          checked={exportFormat === "docx"}
                          onChange={() => setExportFormat("docx")}
                          className="sr-only"
                        />
                        <Mail size={20} className="mx-auto mb-1 text-gray-700" />
                        <span className="block text-xs text-gray-900">Word</span>
                      </label>
                      
                      <label className={`border rounded-md p-2 text-center cursor-pointer ${
                        exportFormat === "json" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="exportFormat"
                          value="json"
                          checked={exportFormat === "json"}
                          onChange={() => setExportFormat("json")}
                          className="sr-only"
                        />
                        <Database size={20} className="mx-auto mb-1 text-gray-700" />
                        <span className="block text-xs text-gray-900">JSON</span>
                      </label>
                      
                      <label className={`border rounded-md p-2 text-center cursor-pointer ${
                        exportFormat === "xml" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                      }`}>
                        <input
                          type="radio"
                          name="exportFormat"
                          value="xml"
                          checked={exportFormat === "xml"}
                          onChange={() => setExportFormat("xml")}
                          className="sr-only"
                        />
                        <Code size={20} className="mx-auto mb-1 text-gray-700" />
                        <span className="block text-xs text-gray-900">XML</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* File information */}
                  <div className="mt-4 bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">File name:</span> {getFilename()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Records:</span> {exportType === "detailed" ? trips.length : Object.keys(calculateJurisdictionData(trips, fuelData).jurisdictions).length}
                    </p>
                  </div>
                  
                  {/* Error message */}
                  {error && (
                    <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  Export {exportType === "detailed" ? "Data" : "Report"}
                </>
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}