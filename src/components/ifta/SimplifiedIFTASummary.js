// src/components/ifta/SimplifiedIFTASummary.js
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calculator,
  DownloadCloud,
  Flag,
  Fuel,
  ChevronRight,
  ChevronDown,
  BarChart2,
  Gauge
} from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function SimplifiedIFTASummary({
  userId,
  quarter,
  trips = [],
  fuelData = [],
  selectedVehicle = "all",
  isLoading = false
}) {
  const { t } = useTranslation('ifta');
  const [showDetails, setShowDetails] = useState(false);
  const [jurisdictionSummary, setJurisdictionSummary] = useState([]);
  const [summary, setSummary] = useState({
    totalMiles: 0,
    totalGallons: 0,
    avgMpg: 0
  });

  // Calculate IFTA summary data
  const calculateSummary = useCallback(() => {
    // Filter trips by vehicle if needed
    const filteredTrips = selectedVehicle === "all"
      ? trips
      : trips.filter(trip => trip.vehicle_id === selectedVehicle);

    // Filter fuel data by vehicle if needed  
    const filteredFuelData = selectedVehicle === "all"
      ? fuelData
      : fuelData.filter(entry => entry.vehicle_id === selectedVehicle);

    // Group miles by jurisdiction
    const jurisdictionData = {};

    filteredTrips.forEach(trip => {
      // Simple implementation: if start and end are the same, all miles belong to that jurisdiction
      if (trip.start_jurisdiction === trip.end_jurisdiction && trip.start_jurisdiction) {
        if (!jurisdictionData[trip.start_jurisdiction]) {
          jurisdictionData[trip.start_jurisdiction] = {
            jurisdiction: trip.start_jurisdiction,
            miles: 0,
            fuelGallons: 0
          };
        }
        jurisdictionData[trip.start_jurisdiction].miles += parseFloat(trip.total_miles || 0);
      } else if (trip.start_jurisdiction && trip.end_jurisdiction) {
        // Split miles evenly between jurisdictions (simplified)
        const halfMiles = parseFloat(trip.total_miles || 0) / 2;

        if (!jurisdictionData[trip.start_jurisdiction]) {
          jurisdictionData[trip.start_jurisdiction] = {
            jurisdiction: trip.start_jurisdiction,
            miles: 0,
            fuelGallons: 0
          };
        }
        if (!jurisdictionData[trip.end_jurisdiction]) {
          jurisdictionData[trip.end_jurisdiction] = {
            jurisdiction: trip.end_jurisdiction,
            miles: 0,
            fuelGallons: 0
          };
        }

        jurisdictionData[trip.start_jurisdiction].miles += halfMiles;
        jurisdictionData[trip.end_jurisdiction].miles += halfMiles;
      }
    });

    // Add fuel purchase data
    filteredFuelData.forEach(entry => {
      if (entry.state) {
        if (!jurisdictionData[entry.state]) {
          jurisdictionData[entry.state] = {
            jurisdiction: entry.state,
            miles: 0,
            fuelGallons: 0
          };
        }
        jurisdictionData[entry.state].fuelGallons += Math.round(parseFloat(entry.gallons || 0));
      }
    });

    // Calculate totals
    const totalMiles = Object.values(jurisdictionData).reduce((sum, j) => sum + j.miles, 0);
    const totalGallons = Object.values(jurisdictionData).reduce((sum, j) => sum + j.fuelGallons, 0);
    const avgMpg = totalGallons > 0 ? totalMiles / totalGallons : 0;

    // Create jurisdiction summary data
    const jurisdictionSummaryData = Object.values(jurisdictionData).map(j => ({
      ...j,
      stateName: getStateName(j.jurisdiction)
    }));

    setJurisdictionSummary(jurisdictionSummaryData);
    setSummary({
      totalMiles,
      totalGallons,
      avgMpg
    });
  }, [trips, fuelData, selectedVehicle]);

  useEffect(() => {
    if (!isLoading) {
      calculateSummary();
    }
  }, [calculateSummary, isLoading]);

  // Format numbers for display
  const formatNumber = (value, decimals = 0) => {
    return parseFloat(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Get state name from code
  const getStateName = (code) => {
    const stateMap = {
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

    return stateMap[code] || code;
  };

  // Handle exporting the report
  const handleExportReport = () => {
    try {
      // Create CSV content
      const headers = ['Jurisdiction', 'Miles', 'Fuel Gallons'];

      const rows = [
        headers.join(','),
        ...jurisdictionSummary.map(j => [
          `${j.stateName} (${j.jurisdiction})`,
          formatNumber(j.miles, 1),
          formatNumber(j.fuelGallons, 3)
        ].join(','))
      ];

      // Add summary row
      rows.push([
        'TOTALS',
        formatNumber(summary.totalMiles, 1),
        formatNumber(summary.totalGallons, 3)
      ].join(','));

      // Create the CSV file
      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ifta_summary_${quarter.replace('-', '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      alert(t('summary.failedToExport'));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-100"></div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
              <div className="h-24 bg-gray-200 rounded-lg"></div>
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (jurisdictionSummary.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 text-white">
          <h3 className="font-semibold flex items-center">
            <Calculator size={18} className="mr-2" />
            {t('summary.quarterlyTitle')}
          </h3>
        </div>
        <div className="p-8 text-center">
          <Flag size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">{t('summary.noDataAvailable')}</h3>
          <p className="text-gray-500">{t('summary.addTripsAndFuel')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 text-white">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold flex items-center">
            <Calculator size={18} className="mr-2" />
            {t('summary.quarterlyTitle')}
          </h3>

          <button
            onClick={handleExportReport}
            className="flex items-center text-sm text-white hover:text-blue-100"
          >
            <DownloadCloud size={16} className="mr-1" />
            {t('summary.exportReport')}
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-blue-600 mb-1">{t('summary.totalMiles')}</div>
                <div className="text-2xl font-bold text-blue-900">{formatNumber(summary.totalMiles, 1)}</div>
              </div>
              <div className="bg-blue-200 p-3 rounded-lg">
                <BarChart2 size={20} className="text-blue-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-green-600 mb-1">{t('summary.totalGallons')}</div>
                <div className="text-2xl font-bold text-green-900">{formatNumber(summary.totalGallons, 3)}</div>
              </div>
              <div className="bg-green-200 p-3 rounded-lg">
                <Fuel size={20} className="text-green-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-purple-600 mb-1">{t('summary.averageMpg')}</div>
                <div className="text-2xl font-bold text-purple-900">{formatNumber(summary.avgMpg, 2)}</div>
              </div>
              <div className="bg-purple-200 p-3 rounded-lg">
                <Gauge size={20} className="text-purple-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-lg font-medium text-gray-900">{t('summary.jurisdictionSummary')}</h4>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('summary.jurisdiction')}
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('summary.miles')}
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('summary.fuelGallons')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jurisdictionSummary.map((j, index) => (
                <tr key={j.jurisdiction} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <Flag size={16} className="text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {j.stateName}
                        </div>
                        <div className="text-xs text-gray-500">{j.jurisdiction}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(j.miles, 1)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(j.fuelGallons, 3)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {t('summary.total')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {formatNumber(summary.totalMiles, 1)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {formatNumber(summary.totalGallons, 3)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start">
            <Fuel className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-blue-800">{t('summary.aboutReporting')}</h5>
              <p className="text-sm text-blue-700 mt-1">
                {t('summary.reportingInfo')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}