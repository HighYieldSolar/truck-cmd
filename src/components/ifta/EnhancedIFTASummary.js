"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Calculator, 
  DownloadCloud, 
  Flag, 
  AlertTriangle, 
  Fuel,
  FileDown,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { getIFTASummary } from "@/lib/services/iftaService";

/**
 * Enhanced IFTA Summary component that uses synchronized fuel data
 */
export default function EnhancedIFTASummary({ 
  userId, 
  quarter,
  syncResult,
  isLoading = false
}) {
  const [reportData, setReportData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Wrap loadSummaryData in useCallback to avoid dependency issues
  const loadSummaryData = useCallback(async () => {
    try {
      setSummaryLoading(false); // Don't show loading state
      setError(null);
      
      const summary = await getIFTASummary(userId, quarter);
      setReportData(summary);
    } catch (err) {
      console.error("Error loading IFTA summary:", err);
      setError("Failed to load IFTA summary. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  }, [userId, quarter]); // Include all dependencies

  // Load IFTA summary data when sync result changes
  useEffect(() => {
    if (userId && quarter) {
      loadSummaryData();
    }
  }, [userId, quarter, syncResult, loadSummaryData]); // Added loadSummaryData to dependency array

  // Format numbers for display
  const formatNumber = (value, decimals = 0) => {
    return parseFloat(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  // Format jurisdiction for display
  const formatJurisdiction = (code) => {
    const stateMap = {
      'AL': 'Alabama',
      'AK': 'Alaska',
      'AZ': 'Arizona',
      'AR': 'Arkansas',
      'CA': 'California',
      'CO': 'Colorado',
      'CT': 'Connecticut',
      'DE': 'Delaware',
      'FL': 'Florida',
      'GA': 'Georgia',
      'HI': 'Hawaii',
      'ID': 'Idaho',
      'IL': 'Illinois',
      'IN': 'Indiana',
      'IA': 'Iowa',
      'KS': 'Kansas',
      'KY': 'Kentucky',
      'LA': 'Louisiana',
      'ME': 'Maine',
      'MD': 'Maryland',
      'MA': 'Massachusetts',
      'MI': 'Michigan',
      'MN': 'Minnesota',
      'MS': 'Mississippi',
      'MO': 'Missouri',
      'MT': 'Montana',
      'NE': 'Nebraska',
      'NV': 'Nevada',
      'NH': 'New Hampshire',
      'NJ': 'New Jersey',
      'NM': 'New Mexico',
      'NY': 'New York',
      'NC': 'North Carolina',
      'ND': 'North Dakota',
      'OH': 'Ohio',
      'OK': 'Oklahoma',
      'OR': 'Oregon',
      'PA': 'Pennsylvania',
      'RI': 'Rhode Island',
      'SC': 'South Carolina',
      'SD': 'South Dakota',
      'TN': 'Tennessee',
      'TX': 'Texas',
      'UT': 'Utah',
      'VT': 'Vermont',
      'VA': 'Virginia',
      'WA': 'Washington',
      'WV': 'West Virginia',
      'WI': 'Wisconsin',
      'WY': 'Wyoming',
      'AB': 'Alberta',
      'BC': 'British Columbia',
      'MB': 'Manitoba',
      'NB': 'New Brunswick',
      'NL': 'Newfoundland',
      'NS': 'Nova Scotia',
      'ON': 'Ontario',
      'PE': 'Prince Edward Island',
      'QC': 'Quebec',
      'SK': 'Saskatchewan'
    };
    
    return stateMap[code] || code;
  };

  // Handle exporting the report
  const handleExportReport = () => {
    if (!reportData) return;
    
    try {
      // Create CSV content
      const headers = [
        'Jurisdiction', 
        'Miles', 
        'Taxable Gallons', 
        'Tax-Paid Gallons', 
        'Net Taxable Gallons'
      ];
      
      const rows = [
        headers.join(','),
        ...reportData.jurisdictionSummary.map(j => [
          `${j.stateName} (${j.jurisdiction})`,
          formatNumber(j.miles, 1),
          formatNumber(j.taxableGallons, 3),
          formatNumber(j.fuelPurchased, 3),
          formatNumber(j.netTaxableGallons, 3)
        ].join(','))
      ];
      
      // Add summary row
      const totalMiles = reportData.jurisdictionSummary.reduce((sum, j) => sum + j.miles, 0);
      const totalTaxable = reportData.jurisdictionSummary.reduce((sum, j) => sum + j.taxableGallons, 0);
      const totalPurchased = reportData.jurisdictionSummary.reduce((sum, j) => sum + j.fuelPurchased, 0);
      const totalNet = reportData.jurisdictionSummary.reduce((sum, j) => sum + j.netTaxableGallons, 0);
      
      rows.push([
        'TOTALS',
        formatNumber(totalMiles, 1),
        formatNumber(totalTaxable, 3),
        formatNumber(totalPurchased, 3),
        formatNumber(totalNet, 3)
      ].join(','));
      
      // Create the CSV file
      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ifta_report_${quarter.replace('-', '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error("Error exporting report:", err);
      alert("Failed to export report. Please try again.");
    }
  };

  // Show error
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Error Loading Summary</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadSummaryData}
              className="mt-3 px-4 py-2 bg-white border border-red-300 rounded-md text-red-700 text-sm font-medium hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show if no data
  if (!reportData) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-center items-center py-6">
          <Flag size={24} className="text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-700">No IFTA data available</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Calculator size={20} className="text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">IFTA Quarterly Summary</h3>
          </div>
          
          <button
            onClick={handleExportReport}
            className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm leading-5 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none"
          >
            <DownloadCloud size={16} className="mr-1.5" />
            Export Report
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Total Miles</div>
            <div className="text-2xl font-semibold">{formatNumber(reportData.totalMiles, 1)}</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Total Gallons</div>
            <div className="text-2xl font-semibold">{formatNumber(reportData.totalGallons, 3)}</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Average MPG</div>
            <div className="text-2xl font-semibold">{formatNumber(reportData.avgMpg, 2)}</div>
          </div>
        </div>
        
        <div className="mb-4 flex justify-between items-center">
          <h4 className="text-lg font-medium text-gray-700">Jurisdiction Summary</h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            {showDetails ? (
              <>
                <ChevronDown size={16} className="mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronRight size={16} className="mr-1" />
                Show Details
              </>
            )}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jurisdiction
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Miles
                </th>
                {showDetails && (
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxable Gallons
                  </th>
                )}
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax-Paid Gallons
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Taxable Gallons
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.jurisdictionSummary.map((j, index) => (
                <tr key={j.jurisdiction} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <Flag size={16} className="text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {j.stateName || formatJurisdiction(j.jurisdiction)}
                        </div>
                        <div className="text-xs text-gray-500">{j.jurisdiction}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(j.miles, 1)}
                  </td>
                  {showDetails && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(j.taxableGallons, 3)}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(j.fuelPurchased, 3)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className={`text-sm font-medium ${j.netTaxableGallons < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatNumber(j.netTaxableGallons, 3)}
                      {j.netTaxableGallons < 0 ? ' (Credit)' : ''}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatNumber(reportData.jurisdictionSummary.reduce((sum, j) => sum + j.miles, 0), 1)}
                </td>
                {showDetails && (
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatNumber(reportData.jurisdictionSummary.reduce((sum, j) => sum + j.taxableGallons, 0), 3)}
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatNumber(reportData.jurisdictionSummary.reduce((sum, j) => sum + j.fuelPurchased, 0), 3)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatNumber(reportData.jurisdictionSummary.reduce((sum, j) => sum + j.netTaxableGallons, 0), 3)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div className="mt-6 bg-yellow-50 rounded-lg p-4">
          <div className="flex items-start">
            <Fuel className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-yellow-800">About IFTA Net Taxable Gallons</h5>
              <p className="text-sm text-yellow-700 mt-1">
                Net Taxable Gallons = (Miles ÷ Average MPG) - Tax-Paid Gallons
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Positive values indicate tax due to that jurisdiction. Negative values (credits) can offset 
                taxes owed to other jurisdictions. Check your state&apos;s IFTA guidelines for specific rules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}