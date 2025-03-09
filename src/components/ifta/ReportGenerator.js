"use client";

import { useState } from "react";
import { X, FileDown, Printer, RefreshCw, Check, AlertCircle } from "lucide-react";

export default function ReportGenerator({
  isOpen,
  onClose,
  trips = [],
  rates = [],
  stats = {},
  quarter = "",
  fuelData = []
}) {
  const [reportType, setReportType] = useState("summary");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Parse quarter string
  const parseQuarter = (quarterString) => {
    if (!quarterString) return { year: new Date().getFullYear(), quarter: 1 };
    
    const [year, qPart] = quarterString.split('-Q');
    return {
      year: parseInt(year),
      quarter: parseInt(qPart)
    };
  };

  // Get quarter date range
  const getQuarterDateRange = (quarterInfo) => {
    const { year, quarter } = quarterInfo;
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0);
    
    return {
      start: startDate,
      end: endDate
    };
  };

  // Calculate jurisdiction data (similar to StateDataGrid but more comprehensive)
  const calculateJurisdictionData = () => {
    // Similar implementation to StateDataGrid component
    // First, extract all jurisdictions involved
    const allJurisdictions = new Set();
    trips.forEach(trip => {
      if (trip.startJurisdiction) allJurisdictions.add(trip.startJurisdiction);
      if (trip.endJurisdiction) allJurisdictions.add(trip.endJurisdiction);
    });

    // Create a map of jurisdiction data
    const jurisdictionMap = {};
    allJurisdictions.forEach(jurisdiction => {
      jurisdictionMap[jurisdiction] = {
        jurisdiction,
        totalMiles: 0,
        taxableMiles: 0,
        taxPaidGallons: 0,
        taxRate: 0,
        netTaxableGallons: 0,
        taxDue: 0
      };
      
      // Look up tax rate for this jurisdiction
      const rateInfo = rates.find(r => r.jurisdiction.includes(jurisdiction));
      if (rateInfo) {
        jurisdictionMap[jurisdiction].taxRate = rateInfo.totalRate;
      }
    });

    // Process trips to calculate miles in each jurisdiction
    trips.forEach(trip => {
      // Simple case: if start and end are the same, all miles belong to that jurisdiction
      if (trip.startJurisdiction === trip.endJurisdiction && trip.startJurisdiction) {
        const miles = parseFloat(trip.miles) || 0;
        jurisdictionMap[trip.startJurisdiction].totalMiles += miles;
        jurisdictionMap[trip.startJurisdiction].taxableMiles += miles;
      } 
      // If crossing jurisdictions, split miles 50/50 (simplified approach)
      else if (trip.startJurisdiction && trip.endJurisdiction) {
        const miles = parseFloat(trip.miles) || 0;
        const milesPerJurisdiction = miles / 2;
        
        jurisdictionMap[trip.startJurisdiction].totalMiles += milesPerJurisdiction;
        jurisdictionMap[trip.startJurisdiction].taxableMiles += milesPerJurisdiction;
        
        jurisdictionMap[trip.endJurisdiction].totalMiles += milesPerJurisdiction;
        jurisdictionMap[trip.endJurisdiction].taxableMiles += milesPerJurisdiction;
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
    const totalGallons = trips.reduce((sum, trip) => sum + (parseFloat(trip.gallons) || 0), 0);
    
    // Average fuel consumption (MPG)
    const avgMpg = totalMiles > 0 && totalGallons > 0 ? totalMiles / totalGallons : 6.0;

    // Calculate net taxable gallons and tax due for each jurisdiction
    Object.values(jurisdictionMap).forEach(j => {
      // Taxable gallons based on miles and average consumption
      const taxableGallons = j.taxableMiles / avgMpg;
      
      // Net taxable gallons = taxable gallons - tax paid gallons
      j.netTaxableGallons = taxableGallons - j.taxPaidGallons;
      
      // Tax due = net taxable gallons * tax rate
      j.taxDue = j.netTaxableGallons * j.taxRate;
    });

    return {
      jurisdictions: Object.values(jurisdictionMap),
      totalMiles,
      totalGallons,
      avgMpg
    };
  };

  // Handle report generation
  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // In a real implementation, you might make an API call to generate the report
      // For now, we'll simulate this with a timeout
      setTimeout(() => {
        try {
          if (reportType === "summary") {
            setGeneratedReport({
              type: "summary",
              title: `IFTA Quarterly Summary - ${quarter}`,
              data: {
                quarter,
                ...calculateJurisdictionData(),
                stats
              }
            });
          } else if (reportType === "detailed") {
            setGeneratedReport({
              type: "detailed",
              title: `IFTA Detailed Report - ${quarter}`,
              data: {
                quarter,
                ...calculateJurisdictionData(),
                stats,
                trips,
                fuelData
              }
            });
          }
          setIsGenerating(false);
        } catch (error) {
          console.error('Error generating report:', error);
          setError('Failed to generate report. Please try again.');
          setIsGenerating(false);
        }
      }, 1500);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
      setIsGenerating(false);
    }
  };

  // Handle downloading the report
  const handleDownloadReport = () => {
    if (!generatedReport) return;
    
    // In a real implementation, you would generate a PDF or other file format
    // For now, we'll generate a simple text representation
    
    let content = "";
    
    if (generatedReport.type === "summary") {
      // Build summary report
      content = `IFTA QUARTERLY SUMMARY REPORT - ${quarter}\n`;
      content += `Generated: ${new Date().toLocaleString()}\n\n`;
      
      content += `Total Miles: ${generatedReport.data.totalMiles.toFixed(1)}\n`;
      content += `Total Gallons: ${generatedReport.data.totalGallons.toFixed(3)}\n`;
      content += `Average MPG: ${generatedReport.data.avgMpg.toFixed(2)}\n\n`;
      
      content += `JURISDICTION SUMMARY:\n`;
      content += `Jurisdiction,Total Miles,Taxable Miles,Tax Paid Gallons,Tax Rate,Net Taxable Gallons,Tax Due\n`;
      
      generatedReport.data.jurisdictions.forEach(j => {
        content += `${j.jurisdiction},${j.totalMiles.toFixed(1)},${j.taxableMiles.toFixed(1)},`;
        content += `${j.taxPaidGallons.toFixed(3)},${j.taxRate.toFixed(3)},${j.netTaxableGallons.toFixed(3)},${j.taxDue.toFixed(2)}\n`;
      });
    } else if (generatedReport.type === "detailed") {
      // Build detailed report
      content = `IFTA DETAILED QUARTERLY REPORT - ${quarter}\n`;
      content += `Generated: ${new Date().toLocaleString()}\n\n`;
      
      content += `SUMMARY STATISTICS:\n`;
      content += `Total Miles: ${generatedReport.data.totalMiles.toFixed(1)}\n`;
      content += `Total Gallons: ${generatedReport.data.totalGallons.toFixed(3)}\n`;
      content += `Average MPG: ${generatedReport.data.avgMpg.toFixed(2)}\n\n`;
      
      content += `JURISDICTION DETAILS:\n`;
      content += `Jurisdiction,Total Miles,Taxable Miles,Tax Paid Gallons,Tax Rate,Net Taxable Gallons,Tax Due\n`;
      
      generatedReport.data.jurisdictions.forEach(j => {
        content += `${j.jurisdiction},${j.totalMiles.toFixed(1)},${j.taxableMiles.toFixed(1)},`;
        content += `${j.taxPaidGallons.toFixed(3)},${j.taxRate.toFixed(3)},${j.netTaxableGallons.toFixed(3)},${j.taxDue.toFixed(2)}\n`;
      });
      
      content += `\nTRIP DETAILS:\n`;
      content += `Date,Vehicle,From,To,Miles,Gallons,Fuel Cost\n`;
      
      generatedReport.data.trips.forEach(trip => {
        content += `${trip.date},${trip.vehicleId},${trip.startJurisdiction},${trip.endJurisdiction},`;
        content += `${parseFloat(trip.miles).toFixed(1)},${parseFloat(trip.gallons).toFixed(3)},${parseFloat(trip.fuelCost).toFixed(2)}\n`;
      });
      
      content += `\nFUEL PURCHASE DETAILS:\n`;
      content += `Date,Vehicle,Jurisdiction,Gallons,Cost\n`;
      
      generatedReport.data.fuelData.forEach(fuel => {
        content += `${fuel.date},${fuel.vehicle_id},${fuel.state},`;
        content += `${parseFloat(fuel.gallons).toFixed(3)},${parseFloat(fuel.total_amount).toFixed(2)}\n`;
      });
    }
    
    // Create download link
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ifta_report_${quarter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get quarter info for display
  const quarterInfo = parseQuarter(quarter);
  const quarterDates = getQuarterDateRange(quarterInfo);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Generate IFTA Report
                  </h3>
                  <button
                    type="button"
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>
                
                {/* Report configuration options */}
                <div className="mb-6">
                  <div className="bg-blue-50 p-4 rounded-md mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Report Information</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>Reporting Period: {quarter}</p>
                          <p>Date Range: {quarterDates.start.toLocaleDateString()} to {quarterDates.end.toLocaleDateString()}</p>
                          <p>Total Trips: {trips.length}</p>
                          <p>Total Jurisdictions: {new Set([...trips.map(t => t.startJurisdiction), ...trips.map(t => t.endJurisdiction)].filter(Boolean)).size}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="relative border rounded-md p-4 flex">
                      <div className="flex items-center h-5">
                        <input
                          id="report-type-summary"
                          name="report-type"
                          type="radio"
                          checked={reportType === "summary"}
                          onChange={() => setReportType("summary")}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="report-type-summary" className="font-medium text-gray-700">Summary Report</label>
                        <p className="text-gray-500">Generate a condensed report with jurisdiction totals for quick reference.</p>
                      </div>
                    </div>
                    
                    <div className="relative border rounded-md p-4 flex">
                      <div className="flex items-center h-5">
                        <input
                          id="report-type-detailed"
                          name="report-type"
                          type="radio"
                          checked={reportType === "detailed"}
                          onChange={() => setReportType("detailed")}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="report-type-detailed" className="font-medium text-gray-700">Detailed Report</label>
                        <p className="text-gray-500">Generate a comprehensive report with trip-level details and jurisdiction summaries.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Error display */}
                {error && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Preview area (if report generated) */}
                {generatedReport && (
                  <div className="mt-4 border rounded-md p-4 max-h-64 overflow-y-auto bg-gray-50">
                    <h4 className="font-medium text-gray-900 mb-2">Report Preview</h4>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p className="font-medium">{generatedReport.title}</p>
                      <p>Generated: {new Date().toLocaleString()}</p>
                      
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <p className="font-medium">Summary Statistics:</p>
                        <p>Total Miles: {generatedReport.data.totalMiles.toFixed(1)}</p>
                        <p>Total Gallons: {generatedReport.data.totalGallons.toFixed(3)}</p>
                        <p>Average MPG: {generatedReport.data.avgMpg.toFixed(2)}</p>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <p className="font-medium">Sample Jurisdiction Data:</p>
                        <table className="min-w-full divide-y divide-gray-200 text-xs mt-1">
                          <thead>
                            <tr>
                              <th className="px-2 py-1 text-left text-gray-500">Jurisdiction</th>
                              <th className="px-2 py-1 text-left text-gray-500">Miles</th>
                              <th className="px-2 py-1 text-left text-gray-500">Tax Due</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generatedReport.data.jurisdictions.slice(0, 3).map(j => (
                              <tr key={j.jurisdiction}>
                                <td className="px-2 py-1">{j.jurisdiction}</td>
                                <td className="px-2 py-1">{j.totalMiles.toFixed(1)}</td>
                                <td className="px-2 py-1">${j.taxDue.toFixed(2)}</td>
                              </tr>
                            ))}
                            {generatedReport.data.jurisdictions.length > 3 && (
                              <tr>
                                <td colSpan="3" className="px-2 py-1 text-center">
                                  ... and {generatedReport.data.jurisdictions.length - 3} more jurisdictions
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${
                generatedReport 
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={generatedReport ? handleDownloadReport : handleGenerateReport}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : generatedReport ? (
                <>
                  <FileDown size={16} className="mr-2" />
                  Download Report
                </>
              ) : (
                "Generate Report"
              )}
            </button>
            
            {generatedReport && (
              <button
                type="button"
                className="mt-3 sm:mt-0 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={16} className="mr-2" />
                Print Report
              </button>
            )}
            
            <button
              type="button"
              className="mt-3 sm:mt-0 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}