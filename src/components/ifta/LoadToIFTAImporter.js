"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { 
  Truck, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FileText,
  DownloadCloud
} from "lucide-react";
import StatusBadge from "@/components/dispatching/StatusBadge";

/**
 * Component to import load data into the IFTA calculator
 * This allows users to easily generate IFTA trips from their existing load records
 */
export default function LoadToIFTAImporter({ 
  userId, 
  quarter,
  onImportComplete = () => {},
  existingTrips = []
}) {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedLoads, setSelectedLoads] = useState({});
  const [success, setSuccess] = useState(false);
  const [quarterDates, setQuarterDates] = useState({ start: null, end: null });

  // Parse quarter string to get date range
  useEffect(() => {
    if (quarter) {
      const [year, q] = quarter.split('-Q');
      const quarterNum = parseInt(q);
      
      // Calculate quarter start and end dates
      const startMonth = (quarterNum - 1) * 3;
      const startDate = new Date(parseInt(year), startMonth, 1);
      const endDate = new Date(parseInt(year), startMonth + 3, 0);
      
      setQuarterDates({
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      });
    }
  }, [quarter]);

  // Load completed loads that match the IFTA quarter date range
  const loadCompletedLoads = useCallback(async () => {
    if (!userId || !quarterDates.start || !quarterDates.end) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get loads that were completed within the quarter date range
      const { data, error: loadsError } = await supabase
        .from('loads')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'Completed')
        .gte('actual_delivery_date', quarterDates.start)
        .lte('actual_delivery_date', quarterDates.end)
        .order('actual_delivery_date', { ascending: false });
      
      if (loadsError) throw loadsError;
      
      // Check if these loads have already been imported as IFTA trips
      const loadIds = (data || []).map(load => load.id);
      
      // Get all IFTA trips that reference these loads
      let alreadyImportedLoadIds = [];
      
      if (loadIds.length > 0) {
        const { data: existingImports, error: importsError } = await supabase
          .from('ifta_trip_records')
          .select('load_id')
          .in('load_id', loadIds)
          .eq('user_id', userId)
          .eq('quarter', quarter);
          
        if (importsError) throw importsError;
        
        alreadyImportedLoadIds = (existingImports || []).map(trip => trip.load_id);
      }
      
      // Filter and mark loads that are already imported
      const processedLoads = (data || []).map(load => ({
        ...load,
        alreadyImported: alreadyImportedLoadIds.includes(load.id)
      }));
      
      setLoads(processedLoads);
    } catch (error) {
      console.error('Error loading completed loads:', error);
      setError('Failed to load completed loads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, quarter, quarterDates]);

  // Load data when component mounts or quarter/date range changes
  useEffect(() => {
    if (quarterDates.start && quarterDates.end) {
      loadCompletedLoads();
    }
  }, [loadCompletedLoads, quarterDates]);

  // Toggle selection of a load
  const toggleLoadSelection = (loadId) => {
    setSelectedLoads(prev => ({
      ...prev,
      [loadId]: !prev[loadId]
    }));
  };

  // Toggle selection of all loads
  const toggleAllLoads = () => {
    const availableLoads = loads.filter(load => !load.alreadyImported);
    
    if (Object.keys(selectedLoads).length === availableLoads.length) {
      // Deselect all
      setSelectedLoads({});
    } else {
      // Select all available
      const newSelected = {};
      availableLoads.forEach(load => {
        newSelected[load.id] = true;
      });
      setSelectedLoads(newSelected);
    }
  };

  // Estimate miles based on origin and destination (in a real implementation, you might use a mapping API)
  const estimateMiles = (origin, destination) => {
    // This is a very simplified estimation - in production, use a proper distance API
    // For now, we'll just return a random number between 100 and 1000
    return Math.floor(Math.random() * 900) + 100;
  };

  // Parse state from city, state format
  const parseState = (location) => {
    if (!location) return '';
    
    // Try to extract state code from formats like "City, ST" or "City, State"
    const statePattern = /,\s*([A-Z]{2})\b/;
    const match = location.match(statePattern);
    
    if (match && match[1]) {
      return match[1]; // Return the state code
    }
    
    // If we can't find a state code, return empty string
    return '';
  };

  // Import selected loads as IFTA trips
  const importLoadsAsTrips = async () => {
    const selectedLoadIds = Object.keys(selectedLoads).filter(id => selectedLoads[id]);
    
    if (selectedLoadIds.length === 0) {
      setImportError('Please select at least one load to import.');
      return;
    }
    
    try {
      setImportLoading(true);
      setImportError(null);
      setSuccess(false);
      
      // Get selected loads
      const selectedLoadsList = loads.filter(load => selectedLoads[load.id]);
      
      // Create IFTA trip records for each selected load
      const tripRecords = selectedLoadsList.map(load => {
        // Parse states from origin and destination
        const originState = parseState(load.origin);
        const destinationState = parseState(load.destination);
        
        // Estimate miles if not available in load data
        const estimatedMiles = load.distance || estimateMiles(load.origin, load.destination);
        
        return {
          user_id: userId,
          quarter: quarter,
          start_date: load.actual_delivery_date || load.delivery_date,
          end_date: load.actual_delivery_date || load.delivery_date,
          vehicle_id: load.truck_id || 'unknown',
          driver_id: load.driver || null,
          load_id: load.id, // Reference to the original load
          start_jurisdiction: originState,
          end_jurisdiction: destinationState,
          total_miles: estimatedMiles,
          gallons: 0, // To be filled by user or calculated based on MPG
          fuel_cost: 0, // To be filled by user
          notes: `Imported from Load #${load.load_number}: ${load.origin || ''} to ${load.destination || ''}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_imported: true
        };
      });
      
      // Insert the trip records into the database
      const { data, error: insertError } = await supabase
        .from('ifta_trip_records')
        .insert(tripRecords)
        .select();
        
      if (insertError) throw insertError;
      
      // Clear selection and show success message
      setSelectedLoads({});
      setSuccess(true);
      setImportResult({
        importedCount: tripRecords.length,
        importedLoadNumbers: selectedLoadsList.map(load => load.load_number)
      });
      
      // Refresh the loads list to update "already imported" status
      loadCompletedLoads();
      
      // Notify parent component that import is complete
      onImportComplete(data);
    } catch (error) {
      console.error('Error importing loads as IFTA trips:', error);
      setImportError('Failed to import loads: ' + error.message);
    } finally {
      setImportLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
      {/* Header Section */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <Truck size={20} className="text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Import Load Data to IFTA</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          {expanded ? (
            <>
              <ChevronDown size={16} className="mr-1" />
              Hide Loads
            </>
          ) : (
            <>
              <ChevronRight size={16} className="mr-1" />
              Show Available Loads
            </>
          )}
        </button>
      </div>
      
      {/* Description & Help Text */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
        <div className="flex items-start">
          <div className="mr-3 flex-shrink-0">
            <FileText size={20} className="text-blue-500" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Time-Saving IFTA Trip Creation</h4>
            <p className="text-sm text-blue-700 mt-1">
              Easily convert your completed loads into IFTA trip records. This will import your load data from 
              the dispatching system and automatically create corresponding IFTA records, saving you from 
              manually entering the same information twice.
            </p>
            <p className="text-sm text-blue-700 mt-1">
              For this quarter ({quarter}), we found {loads.filter(l => !l.alreadyImported).length} completed loads 
              that can be imported into your IFTA records.
            </p>
          </div>
        </div>
      </div>
      
      {/* Show any errors */}
      {(error || importError) && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <div className="flex items-start">
            <AlertTriangle size={16} className="text-red-500 mr-2 mt-0.5" />
            <p className="text-sm text-red-700">
              {error || importError}
            </p>
          </div>
        </div>
      )}
      
      {/* Success message */}
      {success && importResult && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-200">
          <div className="flex items-start">
            <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-green-700">
                Successfully imported {importResult.importedCount} load{importResult.importedCount !== 1 ? 's' : ''} as IFTA trips.
              </p>
              {importResult.importedLoadNumbers?.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Load numbers: {importResult.importedLoadNumbers.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Loads List (When Expanded) */}
      {expanded && (
        <div className="px-6 py-4 border-b border-gray-200">
          {loading ? (
            <div className="py-8 text-center">
              <RefreshCw size={24} className="animate-spin inline-block text-blue-500 mb-2" />
              <p className="text-gray-500">Loading completed loads...</p>
            </div>
          ) : loads.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">
                No completed loads found for this quarter ({quarterDates.start} to {quarterDates.end}).
              </p>
              <Link 
                href="/dashboard/dispatching"
                className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800"
              >
                <Truck size={16} className="mr-1" />
                Go to Load Management
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="select-all-loads"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={Object.keys(selectedLoads).length === loads.filter(l => !l.alreadyImported).length && loads.filter(l => !l.alreadyImported).length > 0}
                    onChange={toggleAllLoads}
                  />
                  <label htmlFor="select-all-loads" className="ml-2 text-sm text-gray-700">
                    Select All Available Loads
                  </label>
                </div>
                <span className="text-sm text-gray-500">
                  {Object.values(selectedLoads).filter(Boolean).length} selected
                </span>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {loads.map(load => (
                  <div 
                    key={load.id} 
                    className={`p-3 border rounded-lg ${
                      load.alreadyImported 
                        ? 'bg-gray-50 border-gray-200 opacity-60' 
                        : selectedLoads[load.id] 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        <input
                          type="checkbox"
                          checked={!!selectedLoads[load.id]}
                          onChange={() => toggleLoadSelection(load.id)}
                          disabled={load.alreadyImported}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-900">Load #{load.load_number}</span>
                          <div className="flex items-center">
                            <StatusBadge status={load.status} className="mr-2" />
                            {load.alreadyImported && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle size={10} className="mr-1" />
                                Imported
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Calendar size={12} className="mr-1" />
                          {formatDate(load.actual_delivery_date || load.delivery_date)}
                          {load.driver && (
                            <span className="ml-2">• Driver: {load.driver}</span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <MapPin size={12} className="mr-1 text-gray-400" />
                          <span className="truncate">{load.origin || "N/A"}</span>
                          <ArrowRight size={10} className="mx-1" />
                          <span className="truncate">{load.destination || "N/A"}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          <span>
                            States: {parseState(load.origin) || "?"} → {parseState(load.destination) || "?"}
                          </span>
                          <span className="ml-2">
                            • Distance: {load.distance ? `${load.distance} mi` : "Will estimate"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Actions Footer */}
      <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {expanded && loads.length > 0 ? (
            <span>
              {loads.filter(l => !l.alreadyImported).length} available load{loads.filter(l => !l.alreadyImported).length !== 1 ? 's' : ''} • 
              {loads.filter(l => l.alreadyImported).length} already imported
            </span>
          ) : (
            <span>Click &quot;Show Available Loads&quot; to view and select loads to import</span>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            {expanded ? "Hide Loads" : "Show Loads"}
          </button>
          <button
            onClick={importLoadsAsTrips}
            disabled={Object.values(selectedLoads).filter(Boolean).length === 0 || importLoading}
            className={`flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
              Object.values(selectedLoads).filter(Boolean).length === 0 || importLoading
                ? 'bg-blue-300 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {importLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                <DownloadCloud size={16} className="mr-2" />
                Import Selected Loads
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}