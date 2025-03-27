// src/components/ifta/SimplifiedExportModal.js
import { useState } from "react";
import { 
  Download, 
  X, 
  FileDown,
  Printer,
  FileText,
  Check,
  FileSpreadsheet,  // Using FileSpreadsheet instead of FileCsv
  File
} from "lucide-react";

export default function SimplifiedExportModal({ 
  isOpen, 
  onClose, 
  trips = [], 
  quarter, 
  fuelData = []
}) {
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportState, setExportState] = useState('idle'); // idle, loading, success, error
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Format numbers for CSV export
  const formatNumber = (value, decimals = 1) => {
    return parseFloat(value || 0).toFixed(decimals);
  };

  // Prepare jurisdiction data
  const prepareJurisdictionData = () => {
    // Calculate miles by jurisdiction
    const milesByJurisdiction = {};
    
    // Process miles from trips
    trips.forEach(trip => {
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
    
    // Calculate fuel by jurisdiction from fuel purchase data
    fuelData.forEach(entry => {
      const state = entry.state;
      if (state && entry.gallons) {
        if (!milesByJurisdiction[state]) {
          milesByJurisdiction[state] = {
            state: state,
            miles: 0,
            gallons: 0
          };
        }
        milesByJurisdiction[state].gallons += parseFloat(entry.gallons || 0);
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
      
      // Create CSV rows
      const rows = [
        ['Jurisdiction', 'Miles', 'Gallons'].join(','),
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
      link.setAttribute('download', `ifta_summary_${quarter.replace('-', '_')}.csv`);
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
      
      // Create text content
      let textContent = `IFTA SUMMARY FOR ${quarter}\n`;
      textContent += `Generated on ${new Date().toLocaleDateString()}\n\n`;
      textContent += `JURISDICTION  |  MILES  |  GALLONS\n`;
      textContent += `------------------------------------\n`;
      
      jurisdictionData.forEach(state => {
        textContent += `${state.state.padEnd(14)} | ${formatNumber(state.miles, 1).padStart(7)} | ${formatNumber(state.gallons, 3).padStart(9)}\n`;
      });
      
      textContent += `------------------------------------\n`;
      textContent += `TOTAL         | ${formatNumber(totalMiles, 1).padStart(7)} | ${formatNumber(totalGallons, 3).padStart(9)}\n\n`;
      
      // Add some additional info
      textContent += `Based on ${trips.length} trip records and ${fuelData.length} fuel purchases.\n`;
      textContent += `Average MPG: ${totalGallons > 0 ? (totalMiles / totalGallons).toFixed(2) : 'N/A'}\n`;
      
      // Create and download the file
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ifta_summary_${quarter.replace('-', '_')}.txt`);
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

  // Handle print view
  const printSummary = () => {
    try {
      setExportState('loading');
      
      // Close the modal before printing to avoid it being included
      onClose();
      
      // Slight delay to ensure modal is closed
      setTimeout(() => {
        window.print();
        setExportState('idle');
      }, 100);
    } catch (error) {
      console.error('Error printing:', error);
      setExportState('error');
      setError('Failed to print. Please try again.');
    }
  };

  // Handle export based on selected format
  const handleExport = () => {
    switch (exportFormat) {
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
        exportToCsv();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Export IFTA Summary
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={exportState === 'loading'}
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Export your IFTA summary to share with your accountant or paperwork handler. This will include miles and gallons by jurisdiction for {quarter}.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-4">
                <label className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer ${
                  exportFormat === 'csv' ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'
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
                
                <label className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer ${
                  exportFormat === 'txt' ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'
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
                
                <label className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer ${
                  exportFormat === 'print' ? 'bg-blue-50 border-blue-300' : 'border-gray-300 hover:bg-gray-50'
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
                  <span className="text-xs text-gray-500">For hard copy</span>
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
            disabled={exportState === 'loading' || exportState === 'success'}
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
}