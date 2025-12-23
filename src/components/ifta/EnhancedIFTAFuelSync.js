// src/components/ifta/EnhancedIFTAFuelSync.js
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  AlertTriangle,
  Truck,
  Fuel,
  CheckCircle,
  Info,
  RefreshCw,
  BarChart2,
  MapPin,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function EnhancedIFTAFuelSync({
  userId,
  quarter,
  fuelData = [],
  trips = [],
  selectedVehicle = "all",
  onSyncComplete,
  onError
}) {
  const { t } = useTranslation('ifta');

  // Component state
  const [syncStatus, setSyncStatus] = useState('idle');
  const [fuelByState, setFuelByState] = useState({});
  const [totalFuelGallons, setTotalFuelGallons] = useState(0);
  const [uniqueStates, setUniqueStates] = useState([]);
  const [errorDetails, setErrorDetails] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Use a ref to track if analysis has been run
  const hasRun = useRef(false);
  // Track props changes
  const propsRef = useRef({ userId, quarter, fuelDataLength: fuelData.length, selectedVehicle });

  // Filter fuel data by selected vehicle
  const filteredFuelData = useMemo(() => {
    return selectedVehicle === "all"
      ? fuelData
      : fuelData.filter(entry => entry.vehicle_id === selectedVehicle);
  }, [fuelData, selectedVehicle]);

  // Manual sync handler
  const handleManualSync = () => {
    if (userId && quarter) {
      runAnalysis();
    }
  };

  // Key function to analyze data without causing infinite loops
  const runAnalysis = () => {
    if (!userId || !quarter) return;

    try {

      // Group fuel entries by state
      const fuelStateMap = {};
      let totalGallons = 0;

      filteredFuelData.forEach(entry => {
        if (!entry.state) return;

        const state = entry.state;
        if (!fuelStateMap[state]) {
          fuelStateMap[state] = {
            state,
            gallons: 0,
            entries: []
          };
        }

        const gallons = Math.round(parseFloat(entry.gallons || 0));
        fuelStateMap[state].gallons += gallons;
        totalGallons += gallons;
        fuelStateMap[state].entries.push(entry);
      });

      // Update state with calculated values
      setFuelByState(fuelStateMap);
      setTotalFuelGallons(totalGallons);
      setUniqueStates(Object.keys(fuelStateMap).sort());

      // Set status based on results
      setSyncStatus(Object.keys(fuelStateMap).length > 0 ? 'success' : 'empty');
      setLastSyncTime(new Date());

      // Mark as having run
      hasRun.current = true;

      // Notify parent component if needed
      if (onSyncComplete) {
        onSyncComplete({
          fuelByState: fuelStateMap,
          totalFuelGallons,
          uniqueStates: Object.keys(fuelStateMap),
          selectedVehicle
        });
      }

      return fuelStateMap;
    } catch (error) {
      setErrorDetails(error.message || "An error occurred while analyzing fuel data");
      setSyncStatus('error');

      // Mark as having run despite error
      hasRun.current = true;

      // Notify parent component of error
      if (onError) {
        onError(error);
      }

      return null;
    }
  };

  // Run analysis only once on initial mount or when key props change
  useEffect(() => {
    // Check if props have changed significantly
    const currentProps = {
      userId,
      quarter,
      fuelDataLength: fuelData.length,
      selectedVehicle
    };

    const propsChanged =
      currentProps.userId !== propsRef.current.userId ||
      currentProps.quarter !== propsRef.current.quarter ||
      currentProps.fuelDataLength !== propsRef.current.fuelDataLength ||
      currentProps.selectedVehicle !== propsRef.current.selectedVehicle;

    // Update props ref
    if (propsChanged) {
      propsRef.current = currentProps;
      // Reset has run flag
      hasRun.current = false;
    }

    // Only run if not run before or if props changed
    if (!hasRun.current && userId && quarter) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, quarter, filteredFuelData.length, selectedVehicle]); // Note: do NOT add runAnalysis to deps to avoid infinite loops

  if (syncStatus === 'error') {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-red-500 px-5 py-4 text-white">
          <h3 className="font-semibold flex items-center">
            <AlertCircle size={18} className="mr-2" />
            {t('fuelSync.errorTitle')}
          </h3>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {errorDetails || t('fuelSync.errorMessage')}
                </p>
                <button
                  onClick={handleManualSync}
                  className="mt-3 inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  <RefreshCw size={14} className="mr-2" />
                  {t('fuelSync.retryAnalysis')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (syncStatus === 'empty') {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-yellow-500 px-5 py-4 text-white">
          <h3 className="font-semibold flex items-center">
            <AlertTriangle size={18} className="mr-2" />
            {t('fuelSync.noFuelData')}
          </h3>
        </div>
        <div className="p-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <Fuel className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {selectedVehicle === "all"
                    ? t('fuelSync.noFuelDataMessage')
                    : t('fuelSync.noFuelDataVehicle', { vehicle: selectedVehicle })}
                </p>
                <a
                  href="/dashboard/fuel"
                  className="mt-3 inline-flex items-center px-3 py-2 border border-yellow-300 rounded-md text-sm font-medium text-yellow-700 bg-white hover:bg-yellow-50"
                >
                  <Fuel size={14} className="mr-2" />
                  {t('fuelSync.addFuelPurchases')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (syncStatus === 'success') {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-4 text-white">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center">
              <Fuel size={18} className="mr-2" />
              {t('fuelSync.fuelByState')}
            </h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white hover:text-orange-100 flex items-center text-sm"
            >
              {isExpanded ? (
                <>
                  <ChevronDown size={16} className="mr-1" />
                  {t('tripsList.hide')}
                </>
              ) : (
                <>
                  <ChevronRight size={16} className="mr-1" />
                  {t('tripsList.show')}
                </>
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-6">
            <div className="mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-orange-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-orange-700">
                    {selectedVehicle === "all"
                      ? t('fuelSync.fuelRecorded', { gallons: totalFuelGallons.toFixed(3), states: uniqueStates.length })
                      : t('fuelSync.fuelRecordedVehicle', { vehicle: selectedVehicle, gallons: totalFuelGallons.toFixed(3), states: uniqueStates.length })}
                  </p>
                  {lastSyncTime && (
                    <p className="text-xs text-orange-600 mt-1">
                      {t('fuelSync.lastUpdated', { time: lastSyncTime.toLocaleTimeString() })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('fuelSync.state')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('fuelSync.fuelGallons')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('fuelSync.purchases')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.values(fuelByState)
                    .sort((a, b) => b.gallons - a.gallons)
                    .map((state, index) => (
                      <tr key={state.state} className={index % 2 === 0 ? '' : 'bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin size={16} className="text-orange-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{state.state}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {state.gallons.toFixed(3)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="text-sm text-gray-500">
                            {state.entries.length === 1
                              ? t('fuelSync.purchaseCount', { count: state.entries.length })
                              : t('fuelSync.purchaseCount_plural', { count: state.entries.length })}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100">
                    <td className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('fuelSync.total')}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {totalFuelGallons.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500">
                      {t('fuelSync.entries', { count: filteredFuelData.length })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-blue-800">{t('fuelSync.aboutFuelData')}</h5>
                  <p className="text-sm text-blue-700 mt-1">
                    {t('fuelSync.fuelDataInfo')}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {t('fuelSync.useFuelTracker')}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleManualSync}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                <RefreshCw size={16} className="mr-2" />
                {t('fuelSync.refreshFuelData')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default loading state - only show when actually loading
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-4 text-white">
        <h3 className="font-semibold flex items-center">
          <Fuel size={18} className="mr-2" />
          {t('fuelSync.fuelDataAnalysis')}
        </h3>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw size={32} className="animate-spin text-orange-500 mr-4" />
          <div>
            <p className="text-lg font-medium text-gray-900">
              {!userId || !quarter
                ? t('fuelSync.waitingForQuarter')
                : t('fuelSync.initializingAnalysis')}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {t('fuelSync.mayTakeMoments')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}