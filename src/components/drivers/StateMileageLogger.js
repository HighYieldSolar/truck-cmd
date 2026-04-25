"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  MapPin,
  CornerDownRight,
  Truck,
  Plus,
  AlertTriangle,
  Fuel,
  CheckCircle,
  RefreshCw,
  Calendar,
  ArrowRight,
  Clock,
  Trash,
  ChevronRight,
  ChevronDown,
  BarChart2,
  History,
  X
} from "lucide-react";
import ExportMileageButton from "./ExportMileageButton";
import { deleteTrip, checkTripIftaStatus } from "@/lib/services/mileageService";
import { importMileageTripToIFTA } from "@/lib/services/iftaMileageService";
import { getCurrentDateLocal, formatDateForDisplayMMDDYYYY, prepareDateForDB } from "@/lib/utils/dateUtils";
import { useTranslation } from "@/context/LanguageContext";

// Helper function to get US states
const getUSStates = () => {
  return [
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" },
    { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" },
    { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" },
    { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" },
    { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" },
    { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" },
    { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" },
    { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" },
    { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" },
    { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" },
    { code: "WY", name: "Wyoming" },
    { code: "AB", name: "Alberta" },
    { code: "BC", name: "British Columbia" },
    { code: "MB", name: "Manitoba" },
    { code: "NB", name: "New Brunswick" },
    { code: "NL", name: "Newfoundland" },
    { code: "NS", name: "Nova Scotia" },
    { code: "ON", name: "Ontario" },
    { code: "PE", name: "Prince Edward Island" },
    { code: "QC", name: "Quebec" },
    { code: "SK", name: "Saskatchewan" }
  ];
};

// Delete Trip Modal Component
function DeleteTripModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  tripDetails = {},
  iftaStatus = null,
  t
}) {
  if (!isOpen) return null;

  const vehicleName = tripDetails.vehicleName || 'this vehicle';
  const tripDate = tripDetails.date
    ? formatDateForDisplayMMDDYYYY(tripDetails.date)
    : 'unknown date';
  const hasIftaRecords = iftaStatus?.isImported && iftaStatus?.recordCount > 0;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('deleteModal.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            disabled={isDeleting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {t('deleteModal.confirmTitle')}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('deleteModal.confirmMessage', { vehicleName, tripDate })}
              </p>

              {/* IFTA Warning */}
              {hasIftaRecords && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <div className="flex items-start">
                    <Fuel className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        {t('deleteModal.iftaWarningTitle')}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        {t('deleteModal.iftaWarningMessage', {
                          count: iftaStatus.recordCount,
                          plural: iftaStatus.recordCount > 1 ? 's' : '',
                          miles: iftaStatus.totalMiles.toFixed(0),
                          quarters: iftaStatus.quarters.join(', ')
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <p className="mt-3 text-sm font-medium text-red-500 dark:text-red-400">
                {t('deleteModal.cannotUndo')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            disabled={isDeleting}
          >
            {t('deleteModal.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none flex items-center"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                {t('deleteModal.deleting')}
              </>
            ) : (
              <>{hasIftaRecords ? t('deleteModal.deleteTripAndIfta') : t('deleteModal.deleteTrip')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// StateCrossing component for rendering individual state crossings
// Timeline-style crossing row. Renders as a node on a vertical rail so a
// trip reads as a journey instead of a stack of card rows.
const StateCrossing = ({ crossing, index, onDelete, isLast, isFirst, prevOdometer, t }) => {
  const crossingDate = crossing.crossing_date
    ? formatDateForDisplayMMDDYYYY(crossing.crossing_date)
    : t('stateCrossings.noDate');

  // Miles driven in the previous state to GET to this crossing point.
  const segmentMiles = !isFirst && typeof prevOdometer === 'number'
    ? Math.max(0, crossing.odometer - prevOdometer)
    : null;

  const dotClass = isFirst
    ? 'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-500/20'
    : isLast
      ? 'bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-500/20'
      : 'bg-gray-300 dark:bg-gray-600 ring-4 ring-transparent';

  const labelTone = isFirst
    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
    : isLast
      ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30'
      : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';

  const label = isFirst ? t('stateCrossings.startLabel', { defaultValue: 'Start' })
    : isLast ? t('stateCrossings.currentLabel', { defaultValue: 'Latest' })
      : t('stateCrossings.crossingLabel', { defaultValue: 'Crossing' });

  return (
    <div className="relative pl-7">
      {/* Vertical rail line — extended so it visually joins to the next row */}
      {!isLast && (
        <span className="absolute left-[10px] top-5 bottom-[-1.5rem] w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
      )}
      {/* Timeline dot */}
      <span className={`absolute left-[5px] top-2 h-3 w-3 rounded-full ${dotClass}`} aria-hidden="true" />

      <div className="pb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{crossing.state_name}</span>
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{crossing.state}</span>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${labelTone}`}>
              {label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono tabular-nums text-gray-700 dark:text-gray-300">
              {crossing.odometer.toLocaleString()} <span className="text-xs text-gray-400">mi</span>
            </span>
            {onDelete && (
              <button
                onClick={() => onDelete(index)}
                className="p-1 -mr-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                aria-label="Delete crossing"
              >
                <Trash size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} />
            {crossingDate}
          </span>
          {segmentMiles !== null && segmentMiles > 0 && (
            <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <CornerDownRight size={11} />
              {segmentMiles.toLocaleString()} mi in previous state
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// TripCard — refined card with a left status indicator. Active trips
// get a pulsing emerald dot; completed trips get a static gray dot.
// Selection is signalled by an inset blue ring + left border instead
// of the previous gradient + bottom-bar treatment.
const TripCard = ({ trip, vehicles, onSelect, isSelected, onDelete }) => {
  const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
  const vehicleName = vehicle?.name || trip.vehicle_id;
  const plate = vehicle?.license_plate;
  const tripDate = formatDateForDisplayMMDDYYYY(trip.start_date);
  const isActive = trip.status !== 'completed';

  return (
    <div
      onClick={() => onSelect(trip)}
      className={`group relative cursor-pointer rounded-lg border transition-all
        ${isSelected
          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-900/10 ring-1 ring-blue-500/30 shadow-sm'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
        }`}
    >
      <div className="p-3 flex items-center gap-3">
        {/* Status dot */}
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          {isActive && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{vehicleName}</h3>
            {plate && (
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500 truncate">{plate}</span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>{tripDate}</span>
          </div>
        </div>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(trip, vehicleName);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all flex-shrink-0"
            aria-label={`Delete trip for ${vehicleName}`}
          >
            <Trash size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

// Main component for state mileage logging
export default function StateMileageLogger() {
  const { t } = useTranslation('mileage');

  // States
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTrips, setActiveTrips] = useState([]);
  const [completedTrips, setCompletedTrips] = useState([]);
  const [completedTripCrossings, setCompletedTripCrossings] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // New trip form state
  const [newTripForm, setNewTripForm] = useState({
    vehicle_id: "",
    start_state: "",
    start_odometer: "",
    date: getCurrentDateLocal()
  });

  // Crossing form state
  const [crossingForm, setCrossingForm] = useState({
    state: "",
    odometer: "",
    date: getCurrentDateLocal()
  });

  // Selected trips
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedTripData, setSelectedTripData] = useState({
    crossings: [],
    loading: false
  });

  const [selectedPastTrip, setSelectedPastTrip] = useState(null);
  const [selectedPastTripData, setSelectedPastTripData] = useState({
    crossings: [],
    loading: false,
    mileageByState: []
  });

  // State for tab navigation
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'past', 'summary'

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState(null);
  const [tripIftaStatus, setTripIftaStatus] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get all US states for dropdowns
  const states = getUSStates();

  // Shared function to calculate mileage by state from crossings - wrapped in useCallback
  const calculateStateMileageFromCrossings = useCallback((crossings) => {
    if (!crossings || crossings.length < 2) {
      return [];
    }

    const stateMileage = [];

    for (let i = 0; i < crossings.length - 1; i++) {
      const currentState = crossings[i].state;
      const currentOdometer = crossings[i].odometer;
      const nextOdometer = crossings[i + 1].odometer;
      const milesDriven = nextOdometer - currentOdometer;

      // Add or update state mileage
      const existingEntry = stateMileage.find(entry => entry.state === currentState);
      if (existingEntry) {
        existingEntry.miles += milesDriven;
      } else {
        stateMileage.push({
          state: currentState,
          state_name: crossings[i].state_name,
          miles: milesDriven
        });
      }
    }

    // Sort by miles (highest first)
    return stateMileage.sort((a, b) => b.miles - a.miles);
  }, []);

  // Calculate miles for each state in the current trip
  const calculateStateMileage = useCallback(() => {
    return calculateStateMileageFromCrossings(selectedTripData.crossings);
  }, [calculateStateMileageFromCrossings, selectedTripData.crossings]);

  // Select a trip to view/edit
  const handleSelectTrip = useCallback(async (trip) => {
    try {
      setSelectedTrip(trip);

      // Important: Reset the crossing form when selecting a different trip
      setCrossingForm({
        state: "",
        odometer: "",
        date: getCurrentDateLocal()
      });

      setSelectedTripData({
        crossings: [],
        loading: true
      });

      // Load crossings for this trip
      const { data, error } = await supabase
        .from('driver_mileage_crossings')
        .select('*')
        .eq('trip_id', trip.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      setSelectedTripData({
        crossings: data || [],
        loading: false
      });

    } catch (error) {
      // console.error('Error loading trip details:', error);
      setError(t('errors.loadTripDetails'));
      setSelectedTripData({
        crossings: [],
        loading: false
      });
    }
  }, [t]);

  // Handle delete button click - check IFTA status first
  const handleDeleteClick = async (trip, vehicleName) => {
    setTripToDelete({
      id: trip.id,
      vehicleName,
      date: trip.start_date
    });

    // Check if this trip has been imported to IFTA
    if (user) {
      const iftaStatus = await checkTripIftaStatus(trip.id, user.id);
      setTripIftaStatus(iftaStatus);
    } else {
      setTripIftaStatus(null);
    }

    setDeleteModalOpen(true);
  };

  // Confirm deletion of a trip
  const confirmDeleteTrip = async () => {
    if (!tripToDelete || !user) return;

    try {
      setIsDeleting(true);

      // Call the delete function (now also deletes IFTA records)
      const result = await deleteTrip(tripToDelete.id, user.id);

      // If we were viewing this trip, clear it
      if (selectedPastTrip && selectedPastTrip.id === tripToDelete.id) {
        setSelectedPastTrip(null);
        setSelectedPastTripData({
          crossings: [],
          loading: false,
          mileageByState: []
        });
      } else if (selectedTrip && selectedTrip.id === tripToDelete.id) {
        // Also clear the selected active trip if we're deleting it
        setSelectedTrip(null);
        setSelectedTripData({
          crossings: [],
          loading: false
        });
      }

      // Remove from completedTripCrossings
      const updatedCrossings = { ...completedTripCrossings };
      delete updatedCrossings[tripToDelete.id];
      setCompletedTripCrossings(updatedCrossings);

      // Remove from completedTrips
      setCompletedTrips(prev => prev.filter(trip => trip.id !== tripToDelete.id));

      // Also remove from activeTrips if it was an active trip
      setActiveTrips(prev => prev.filter(trip => trip.id !== tripToDelete.id));

      // Show success message with IFTA info if applicable
      const iftaInfo = result.deletedIftaRecords > 0
        ? ' ' + t('messages.iftaRecordsRemoved', { count: result.deletedIftaRecords, plural: result.deletedIftaRecords > 1 ? 's' : '' })
        : '';
      setSuccess(t('messages.tripDeleted') + iftaInfo);
      setTimeout(() => setSuccess(null), 4000);

      // Close modal and reset state
      setDeleteModalOpen(false);
      setTripToDelete(null);
      setTripIftaStatus(null);

    } catch (error) {
      // console.error('Error deleting trip:', error);
      setError(t('errors.deleteTrip'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Load vehicles
  const loadVehicles = useCallback(async (userId) => {
    try {
      // Get vehicles from the vehicles table
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, name, license_plate')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        setVehicles(data);
      } else {
        // If no vehicles found, set empty array
        setVehicles([]);
      }

    } catch (error) {
      // console.error('Error loading vehicles:', error);

      // Set some default vehicles as fallback
      setVehicles([
        { id: 'truck1', name: 'Truck 1', license_plate: 'ABC123' },
        { id: 'truck2', name: 'Truck 2', license_plate: 'XYZ789' }
      ]);
    }
  }, []);

  // Load active trips
  const loadActiveTrips = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('driver_mileage_trips')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setActiveTrips(data || []);

      // If there's at least one active trip, select it
      if (data && data.length > 0) {
        // Don't automatically select a trip to avoid unexpected switching
        // Let the user explicitly choose which trip to work with
        // handleSelectTrip(data[0]);
      }

    } catch (error) {
      // console.error('Error loading active trips:', error);
      setError(t('errors.loadActiveTrips'));
    }
  }, [t]);

  // Load completed trips
  const loadCompletedTrips = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('driver_mileage_trips')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('end_date', { ascending: false });

      if (error) throw error;

      setCompletedTrips(data || []);

      // Load crossings for all completed trips in chunks to avoid potential query size limits
      if (data && data.length > 0) {
        // Break trip IDs into chunks of 10
        const tripIds = data.map(trip => trip.id);
        const chunkSize = 10;
        const tripIdChunks = [];

        for (let i = 0; i < tripIds.length; i += chunkSize) {
          tripIdChunks.push(tripIds.slice(i, i + chunkSize));
        }

        // Process each chunk
        const allCrossings = [];
        for (const chunk of tripIdChunks) {
          const { data: chunkCrossings, error: crossingsError } = await supabase
            .from('driver_mileage_crossings')
            .select('*')
            .in('trip_id', chunk)
            .order('timestamp', { ascending: true });

          if (crossingsError) throw crossingsError;

          if (chunkCrossings && chunkCrossings.length > 0) {
            allCrossings.push(...chunkCrossings);
          }
        }

        // Organize all crossings by trip_id
        const crossingsByTrip = {};
        allCrossings.forEach(crossing => {
          if (!crossingsByTrip[crossing.trip_id]) {
            crossingsByTrip[crossing.trip_id] = [];
          }
          crossingsByTrip[crossing.trip_id].push(crossing);
        });

        setCompletedTripCrossings(crossingsByTrip);
      }
    } catch (error) {
      // console.error('Error loading completed trips:', error);
      setError(t('errors.loadTripHistory'));
    }
  }, [t]);

  // Select a past trip
  const handleSelectPastTrip = useCallback(async (trip) => {
    if (selectedPastTrip && selectedPastTrip.id === trip.id) {
      // Toggle selection if clicking the same trip
      setSelectedPastTrip(null);
      setSelectedPastTripData({
        crossings: [],
        loading: false,
        mileageByState: []
      });
      return;
    }

    try {
      setSelectedPastTrip(trip);
      setSelectedPastTripData({
        crossings: [],
        loading: true,
        mileageByState: []
      });

      // Check if we already have the crossings in state
      if (completedTripCrossings[trip.id] && completedTripCrossings[trip.id].length > 0) {
        const crossings = completedTripCrossings[trip.id];
        const mileageByState = calculateStateMileageFromCrossings(crossings);

        setSelectedPastTripData({
          crossings,
          loading: false,
          mileageByState
        });
        return;
      }

      // Otherwise, load crossings for this trip
      const { data, error } = await supabase
        .from('driver_mileage_crossings')
        .select('*')
        .eq('trip_id', trip.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Calculate mileage by state
      const mileageByState = calculateStateMileageFromCrossings(data || []);

      // Store in completedTripCrossings for future use
      if (data && data.length > 0) {
        setCompletedTripCrossings(prev => ({
          ...prev,
          [trip.id]: data
        }));
      }

      setSelectedPastTripData({
        crossings: data || [],
        loading: false,
        mileageByState
      });

    } catch (error) {
      // console.error('Error loading past trip details:', error);
      setError(t('errors.loadTripDetails'));
      setSelectedPastTripData({
        crossings: [],
        loading: false,
        mileageByState: []
      });
    }
  }, [selectedPastTrip, completedTripCrossings, calculateStateMileageFromCrossings, t]);

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        if (!user) {
          window.location.href = '/login';
          return;
        }

        setUser(user);

        // Load data
        await loadActiveTrips(user.id);
        await loadCompletedTrips(user.id);
        await loadVehicles(user.id);

      } catch (error) {
        // console.error('Error checking authentication:', error);
        setError(t('errors.authError'));
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [loadActiveTrips, loadCompletedTrips, loadVehicles, t]);

  // Handle form input changes
  const handleNewTripChange = (e) => {
    const { name, value } = e.target;
    setNewTripForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCrossingChange = (e) => {
    const { name, value } = e.target;
    setCrossingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Start a new trip
  const handleStartTrip = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Validate form
      if (!newTripForm.vehicle_id || !newTripForm.start_state || !newTripForm.start_odometer) {
        throw new Error(t('errors.fillRequired'));
      }

      // Create new trip in the database
      const tripData = {
        user_id: user.id,
        vehicle_id: newTripForm.vehicle_id,
        status: 'active',
        start_date: newTripForm.date,
        end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: tripResult, error: tripError } = await supabase
        .from('driver_mileage_trips')
        .insert([tripData])
        .select();

      if (tripError) throw tripError;

      if (!tripResult || tripResult.length === 0) {
        throw new Error('Failed to create trip.');
      }

      const newTrip = tripResult[0];

      // Add first crossing (starting point)
      const crossingData = {
        trip_id: newTrip.id,
        state: newTripForm.start_state,
        state_name: states.find(s => s.code === newTripForm.start_state)?.name || newTripForm.start_state,
        odometer: parseInt(newTripForm.start_odometer),
        crossing_date: newTripForm.date,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { error: crossingError } = await supabase
        .from('driver_mileage_crossings')
        .insert([crossingData]);

      if (crossingError) throw crossingError;

      // Reset form and reload trips
      setNewTripForm({
        vehicle_id: "",
        start_state: "",
        start_odometer: "",
        date: getCurrentDateLocal()
      });

      await loadActiveTrips(user.id);

      // Switch to active tab
      setActiveTab('active');

      setSuccess(t('messages.tripStarted'));
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      // console.error('Error starting trip:', error);
      setError(error.message || t('errors.startTrip'));
    } finally {
      setLoading(false);
    }
  };

  // Add a new crossing
  const handleAddCrossing = async (e) => {
    e.preventDefault();

    if (!selectedTrip) return;

    try {
      setLoading(true);
      setError(null);

      // Validate form
      if (!crossingForm.state || !crossingForm.odometer || !crossingForm.date) {
        throw new Error(t('errors.fillRequired'));
      }

      // Check if odometer reading is valid (greater than last reading)
      if (selectedTripData.crossings.length > 0) {
        const lastOdometer = selectedTripData.crossings[selectedTripData.crossings.length - 1].odometer;
        if (parseInt(crossingForm.odometer) <= lastOdometer) {
          throw new Error(t('errors.odometerTooLow', { odometer: lastOdometer }));
        }
      }

      // Add new crossing
      const crossingData = {
        trip_id: selectedTrip.id,
        state: crossingForm.state,
        state_name: states.find(s => s.code === crossingForm.state)?.name || crossingForm.state,
        odometer: parseInt(crossingForm.odometer),
        crossing_date: crossingForm.date,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { data: newCrossing, error: crossingError } = await supabase
        .from('driver_mileage_crossings')
        .insert([crossingData])
        .select();

      if (crossingError) throw crossingError;

      // Reset form
      setCrossingForm({
        state: "",
        odometer: "",
        date: getCurrentDateLocal()
      });

      // Update the current trip data with the new crossing without a full reload
      if (newCrossing && newCrossing.length > 0) {
        setSelectedTripData(prev => ({
          ...prev,
          crossings: [...prev.crossings, newCrossing[0]]
        }));
      } else {
        // If we didn't get the new crossing data, reload crossings for this trip
        await handleSelectTrip(selectedTrip);
      }

      setSuccess(t('messages.crossingAdded'));
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      // console.error('Error adding crossing:', error);
      setError(error.message || t('errors.addCrossing'));
    } finally {
      setLoading(false);
    }
  };

  // Delete a crossing
  const handleDeleteCrossing = async (index) => {
    if (!selectedTrip || !selectedTripData.crossings[index]) return;

    // Can't delete the first crossing (starting point)
    if (index === 0) return;

    try {
      setLoading(true);

      const crossingToDelete = selectedTripData.crossings[index];

      const { error } = await supabase
        .from('driver_mileage_crossings')
        .delete()
        .eq('id', crossingToDelete.id);

      if (error) throw error;

      // Reload crossings
      await handleSelectTrip(selectedTrip);

    } catch (error) {
      // console.error('Error deleting crossing:', error);
      setError(t('errors.deleteCrossing'));
    } finally {
      setLoading(false);
    }
  };

  // Handle ending a trip - with auto-sync to IFTA
  const handleEndTrip = async () => {
    if (!selectedTrip) return;

    try {
      setLoading(true);

      // Update trip status to 'completed'
      const { error } = await supabase
        .from('driver_mileage_trips')
        .update({
          status: 'completed',
          end_date: getCurrentDateLocal(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTrip.id);

      if (error) throw error;

      // Update the completed trip crossings
      const tripId = selectedTrip.id;

      // Make a copy of the current crossings before ending the trip
      const currentCrossings = [...selectedTripData.crossings];

      setCompletedTripCrossings(prev => ({
        ...prev,
        [tripId]: currentCrossings
      }));

      // AUTO-SYNC: Import trip to IFTA automatically
      let iftaMessage = '';
      try {
        // Determine the current quarter for the import
        const now = new Date();
        const currentQuarter = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;

        const importResult = await importMileageTripToIFTA(user.id, currentQuarter, tripId);

        if (importResult.success) {
          if (importResult.alreadyImported) {
            // Trip was already imported (shouldn't happen for new completion, but handle gracefully)
            iftaMessage = '';
          } else if (importResult.importedCount > 0) {
            // Successfully imported - show quarter info
            if (importResult.quarters && importResult.quarters.length > 1) {
              iftaMessage = ` ${t('messages.autoImportMultiQuarter', { count: importResult.importedCount, quarters: importResult.quarters.join(' & ') })}`;
            } else if (importResult.quarters && importResult.quarters.length === 1) {
              iftaMessage = ` ${t('messages.autoImportSuccess', { count: importResult.importedCount, quarter: importResult.quarters[0] })}`;
            } else {
              iftaMessage = ` ${t('messages.autoImportBasic', { count: importResult.importedCount })}`;
            }
          }
        }
      } catch (iftaError) {
        // Log the error but don't fail the trip completion
        console.warn('Auto-import to IFTA failed:', iftaError);
        iftaMessage = ` ${t('messages.autoImportFailed')}`;
      }

      // Reload trips
      await loadActiveTrips(user.id);
      await loadCompletedTrips(user.id);

      setSelectedTrip(null);
      setSelectedTripData({
        crossings: [],
        loading: false
      });

      setSuccess(t('messages.tripCompleted') + iftaMessage);
      setTimeout(() => setSuccess(null), 6000);

    } catch (error) {
      // console.error('Error ending trip:', error);
      setError(t('errors.endTrip'));
    } finally {
      setLoading(false);
    }
  };

  // Quarter filter that applies to both the Past Trips list and the Summary
  // card. Default to 'all' so existing "all time" behavior is preserved.
  const [summaryQuarter, setSummaryQuarter] = useState('all');

  // Pure helper: YYYY-QN for any Date-parseable value, or null when unknown.
  const quarterForDate = (raw) => {
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
  };

  // Derive available quarters from `crossing_date` (the user-entered local
  // date) — NOT `timestamp` (UTC submission time). Mismatch caused the
  // filter pill to assign a near-midnight cross-state submission to a
  // different quarter than the IFTA import did. Use the same priority the
  // import uses: crossing_date first, only fall back to timestamp slice if
  // crossing_date is missing.
  const availableQuarters = useMemo(() => {
    const set = new Set();
    Object.values(completedTripCrossings).forEach(crossings => {
      (crossings || []).forEach(c => {
        const q = quarterForDate(c.crossing_date || c.timestamp);
        if (q) set.add(q);
      });
    });
    completedTrips.forEach(trip => {
      if (completedTripCrossings[trip.id]?.length) return; // already covered
      const q = quarterForDate(trip.end_date || trip.start_date);
      if (q) set.add(q);
    });
    return Array.from(set).sort().reverse();
  }, [completedTrips, completedTripCrossings]);

  // A trip belongs to a quarter if ANY of its crossings fall inside that
  // quarter. That way a trip spanning Dec→Jan shows in both Q4 and Q1
  // rather than artificially vanishing from Q4 because it ended in Q1.
  const filteredCompletedTrips = useMemo(() => {
    if (summaryQuarter === 'all') return completedTrips;
    return completedTrips.filter(trip => {
      const crossings = completedTripCrossings[trip.id] || [];
      if (crossings.length > 0) {
        return crossings.some(c => quarterForDate(c.crossing_date || c.timestamp) === summaryQuarter);
      }
      // Trip has no crossings loaded — fall back to its own dates
      return quarterForDate(trip.end_date || trip.start_date) === summaryQuarter;
    });
  }, [completedTrips, completedTripCrossings, summaryQuarter]);

  // Per-segment mileage aggregation. Each segment (pair of consecutive
  // crossings) is bucketed by the entry crossing's local date — matching
  // the IFTA import logic in iftaMileageService.getStateMileageByQuarter,
  // so the page filter and the imported records always agree on which
  // quarter each segment belongs to.
  const totalHistoricalMileage = useMemo(() => {
    const stateTotals = new Map();

    Object.values(completedTripCrossings).forEach(crossings => {
      if (!crossings || crossings.length < 2) return;

      for (let i = 0; i < crossings.length - 1; i++) {
        const entry = crossings[i];
        const exit = crossings[i + 1];

        if (summaryQuarter !== 'all') {
          const segQuarter = quarterForDate(entry.crossing_date || entry.timestamp);
          if (segQuarter !== summaryQuarter) continue;
        }

        const currentState = entry.state;
        const stateName = entry.state_name;
        const milesDriven = (exit.odometer || 0) - (entry.odometer || 0);
        if (!currentState || milesDriven <= 0) continue;

        if (stateTotals.has(currentState)) {
          stateTotals.set(currentState, {
            ...stateTotals.get(currentState),
            miles: stateTotals.get(currentState).miles + milesDriven
          });
        } else {
          stateTotals.set(currentState, {
            state: currentState,
            state_name: stateName,
            miles: milesDriven
          });
        }
      }
    });

    return Array.from(stateTotals.values())
      .sort((a, b) => b.miles - a.miles);
  }, [completedTripCrossings, summaryQuarter]);

  // Reusable dropdown rendered inside the Past Trips + Summary tab headers.
  const quarterFilterOptions = [
    { value: 'all', label: 'All time' },
    ...availableQuarters.map(q => ({ value: q, label: q.replace('-', ' · ') }))
  ];
  const QuarterFilter = ({ className = '' }) => (
    <select
      value={summaryQuarter}
      onChange={(e) => setSummaryQuarter(e.target.value)}
      className={`text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      aria-label="Filter by quarter"
    >
      {quarterFilterOptions.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );

  // Loading state
  if (loading && !selectedTrip) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate state mileage for the selected trip
  const stateMileage = calculateStateMileage();

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl p-4 mb-6 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium">{t('messages.error')}</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-xl p-4 mb-6 flex items-start">
          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium">{t('messages.success')}</h3>
            <p className="text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation - Mobile Responsive */}
      <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-sm mb-6 w-full sm:w-auto sm:inline-flex">
        <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-0 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 sm:px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center sm:justify-start ${activeTab === 'active'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-600'
              }`}
          >
            <Truck className="h-4 w-4 mr-2" />
            {t('tabs.activeTrips')}
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 sm:px-5 py-2.5 sm:mx-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center sm:justify-start ${activeTab === 'past'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-600'
              }`}
          >
            <History className="h-4 w-4 mr-2" />
            {t('tabs.pastTrips')}
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 sm:px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center sm:justify-start ${activeTab === 'summary'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-600'
              }`}
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            {t('tabs.summary')}
          </button>
        </div>
      </div>

      {activeTab === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active trips section */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                    {t('activeTrips.title')}
                  </h2>
                  {activeTrips.length > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      {activeTrips.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedTrip(null);
                    setCrossingForm({
                      state: "",
                      odometer: "",
                      date: getCurrentDateLocal()
                    });
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                >
                  <Plus size={14} />
                  {t('activeTrips.newTrip')}
                </button>
              </div>

              <div className="p-3">
                {activeTrips.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                      <Truck className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('activeTrips.noTrips')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">{t('activeTrips.noTripsDescription')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeTrips.map(trip => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        vehicles={vehicles}
                        onSelect={(trip) => {
                          handleSelectTrip(trip);
                          setCrossingForm({
                            state: "",
                            odometer: "",
                            date: getCurrentDateLocal()
                          });
                        }}
                        isSelected={selectedTrip?.id === trip.id}
                        onDelete={(trip, vehicleName) => handleDeleteClick(trip, vehicleName)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* New Trip Form */}
            {!selectedTrip && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('newTrip.title')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Log the starting point for a new state-mileage trip.</p>
                </div>
                <div className="p-4">
                  <form onSubmit={handleStartTrip} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('newTrip.selectVehicle')}
                      </label>
                      <select
                        name="vehicle_id"
                        value={newTripForm.vehicle_id}
                        onChange={handleNewTripChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">{t('newTrip.selectVehiclePlaceholder')}</option>
                        {vehicles.map(vehicle => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.name}{vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('newTrip.startingState')}
                      </label>
                      <select
                        name="start_state"
                        value={newTripForm.start_state}
                        onChange={handleNewTripChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">{t('newTrip.selectState')}</option>
                        {states.map(state => (
                          <option key={state.code} value={state.code}>{state.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('newTrip.startingOdometer')}
                        </label>
                        <input
                          type="number"
                          name="start_odometer"
                          value={newTripForm.start_odometer}
                          onChange={handleNewTripChange}
                          className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={t('newTrip.odometerPlaceholder')}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('newTrip.date')}
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={newTripForm.date}
                          onChange={handleNewTripChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                      <Plus size={14} />
                      {t('newTrip.startTrip')}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Trip details */}
          <div className="lg:col-span-2">
            {selectedTrip ? (
              <div className="space-y-4">
                {/* Trip header — clean, status-led, with quick stats */}
                {(() => {
                  const v = vehicles.find(vh => vh.id === selectedTrip.vehicle_id);
                  const totalMilesSoFar = stateMileage.reduce((s, e) => s + e.miles, 0);
                  const startedAt = new Date(selectedTrip.start_date);
                  const daysRunning = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60 * 60 * 24)));
                  const lastCrossing = selectedTripData.crossings[selectedTripData.crossings.length - 1];
                  return (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                              </span>
                              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Active trip</span>
                            </div>
                            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                              {v?.name || selectedTrip.vehicle_id}
                            </h2>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                              {v?.license_plate && (
                                <span className="font-mono text-xs">{v.license_plate}</span>
                              )}
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDateForDisplayMMDDYYYY(selectedTrip.start_date)}
                              </span>
                              <span>·</span>
                              <span>{daysRunning === 0 ? 'Today' : `${daysRunning} day${daysRunning === 1 ? '' : 's'} running`}</span>
                            </div>
                          </div>
                          <button
                            onClick={handleEndTrip}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                          >
                            {loading ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" />
                                {t('tripDetails.ending')}
                              </>
                            ) : (
                              <>
                                <CheckCircle size={14} />
                                {t('tripDetails.endTrip')}
                              </>
                            )}
                          </button>
                        </div>

                        {/* Quick stats */}
                        <div className="mt-4 grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                          <div className="px-4 py-3">
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Total miles</div>
                            <div className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                              {totalMilesSoFar.toLocaleString()}
                            </div>
                          </div>
                          <div className="px-4 py-3">
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">States</div>
                            <div className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                              {stateMileage.length}
                            </div>
                          </div>
                          <div className="px-4 py-3">
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Currently in</div>
                            <div className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {lastCrossing?.state || '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* State crossings — vertical timeline */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('stateCrossings.title')}</h3>
                      {selectedTripData.crossings.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {selectedTripData.crossings.length} {selectedTripData.crossings.length === 1 ? 'point' : 'points'} logged
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    {selectedTripData.crossings.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                          <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('stateCrossings.noData')}</p>
                      </div>
                    ) : (
                      <div className="mb-2">
                        {selectedTripData.crossings.map((crossing, index) => (
                          <StateCrossing
                            key={index}
                            crossing={crossing}
                            index={index}
                            prevOdometer={index > 0 ? selectedTripData.crossings[index - 1].odometer : null}
                            onDelete={index > 0 && index === selectedTripData.crossings.length - 1 ? handleDeleteCrossing : null}
                            isFirst={index === 0}
                            isLast={index === selectedTripData.crossings.length - 1}
                            t={t}
                          />
                        ))}
                      </div>
                    )}

                    {/* Add crossing — inline at the foot of the timeline */}
                    <div className="mt-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('stateCrossings.addTitle')}</h4>
                      <form onSubmit={handleAddCrossing} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-5">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('stateCrossings.enteringState')}
                          </label>
                          <select
                            name="state"
                            value={crossingForm.state}
                            onChange={handleCrossingChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">{t('newTrip.selectState')}</option>
                            {states.map(state => (
                              <option key={state.code} value={state.code}>{state.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('stateCrossings.odometerReading')}
                          </label>
                          <input
                            type="number"
                            name="odometer"
                            value={crossingForm.odometer}
                            onChange={handleCrossingChange}
                            className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t('stateCrossings.currentReading')}
                            required
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('stateCrossings.crossingDate')}
                          </label>
                          <input
                            type="date"
                            name="date"
                            value={crossingForm.date}
                            onChange={handleCrossingChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                          >
                            {loading ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Plus size={14} />
                            )}
                            {loading ? t('stateCrossings.adding') : t('stateCrossings.add')}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Mileage by State — restrained design with bigger, sharper bars */}
                {selectedTrip && stateMileage.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        {t('milesByState.title')}
                      </h2>
                      <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                        {stateMileage.reduce((total, entry) => total + entry.miles, 0).toLocaleString()}
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">{t('milesByState.milesUnit')}</span>
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        {stateMileage.map(entry => {
                          const pct = stateMileage[0].miles > 0
                            ? (entry.miles / stateMileage[0].miles) * 100
                            : 0;
                          return (
                            <div key={entry.state}>
                              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                                <div className="min-w-0 flex items-baseline gap-2">
                                  <span className="font-mono text-xs font-bold text-gray-500 dark:text-gray-400 w-7">{entry.state}</span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{entry.state_name}</span>
                                </div>
                                <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                  {entry.miles.toLocaleString()}
                                  <span className="ml-0.5 text-xs font-normal text-gray-500 dark:text-gray-400">mi</span>
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTrips.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="p-10 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                    <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('selectPrompts.selectActiveTrip')}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {t('selectPrompts.activeTripsCount', { count: activeTrips.length, plural: activeTrips.length !== 1 ? 's' : '' })}
                    {' '}{t('selectPrompts.selectFromList')}
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {activeTrips.slice(0, 3).map(trip => (
                      <button
                        key={trip.id}
                        onClick={() => handleSelectTrip(trip)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200 font-medium hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {vehicles.find(v => v.id === trip.vehicle_id)?.name || trip.vehicle_id}
                      </button>
                    ))}
                    {activeTrips.length > 3 && (
                      <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                        {t('selectPrompts.moreTrips', { count: activeTrips.length - 3 })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="p-10 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                    <MapPin className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('selectPrompts.selectOrCreate')}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {t('selectPrompts.selectOrCreateDescription')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'past' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Past trips list */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                    {t('pastTrips.title')}
                  </h2>
                  <QuarterFilter />
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    <p className="text-gray-500 dark:text-gray-400">{t('pastTrips.loading')}</p>
                  </div>
                ) : filteredCompletedTrips.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{t('pastTrips.noTrips')}</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {summaryQuarter === 'all'
                        ? t('pastTrips.noTripsDescription')
                        : `No trips recorded for ${summaryQuarter.replace('-', ' · ')}.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCompletedTrips.map(trip => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        vehicles={vehicles}
                        onSelect={(trip) => handleSelectPastTrip(trip)}
                        isSelected={selectedPastTrip?.id === trip.id}
                        onDelete={(trip, vehicleName) => handleDeleteClick(trip, vehicleName)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedPastTrip ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                        {t('pastTrips.tripDetailsTitle', { vehicleName: vehicles.find(v => v.id === selectedPastTrip.vehicle_id)?.name || selectedPastTrip.vehicle_id })}
                      </h2>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1">
                        <CheckCircle size={11} className="text-emerald-500" />
                        Auto-synced to IFTA when the trip ended.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Re-import is now a small icon-only ghost action.
                          Manual trips auto-import on End Trip via the
                          handleEndTrip flow (see line ~970), so this is a
                          recovery affordance for legacy trips OR cases
                          where the auto-import failed. Most users will
                          never need it. */}
                      <button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            setError(null);
                            const now = new Date();
                            const quarter = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
                            const result = await importMileageTripToIFTA(user.id, quarter, selectedPastTrip.id);
                            if (result.alreadyImported) {
                              setSuccess(t('messages.alreadyImported'));
                            } else if (result.importedCount === 0) {
                              setSuccess(result.message || t('messages.noDataToImport'));
                            } else {
                              if (result.quarters && result.quarters.length > 1) {
                                setSuccess(t('messages.importSuccessMultiQuarters', { count: result.importedCount, quarters: result.quarters.join(' & ') }));
                              } else if (result.quarters && result.quarters.length === 1) {
                                setSuccess(t('messages.importSuccessQuarters', { count: result.importedCount, quarter: result.quarters[0] }));
                              } else {
                                setSuccess(t('messages.importSuccess', { count: result.importedCount }));
                              }
                            }
                            setTimeout(() => setSuccess(null), 5000);
                          } catch (error) {
                            setError(t('errors.importIfta'));
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading || selectedPastTripData.mileageByState.length === 0}
                        title="Re-import to IFTA records (manual trips auto-import on completion — only use this if the original sync failed or for legacy trips)"
                        aria-label="Re-import to IFTA"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : (
                          <RefreshCw size={13} />
                        )}
                      </button>
                      <ExportMileageButton
                        tripId={selectedPastTrip.id}
                        vehicleName={vehicles.find(v => v.id === selectedPastTrip.vehicle_id)?.name || 'Vehicle'}
                        startDate={selectedPastTrip.start_date}
                        endDate={selectedPastTrip.end_date}
                        mileageData={selectedPastTripData.mileageByState}
                        compact={true}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('pastTrips.tripDuration')}</div>
                      <div className="text-lg font-medium flex items-center text-gray-900 dark:text-gray-100">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        {formatDateForDisplayMMDDYYYY(selectedPastTrip.start_date)}
                        <ArrowRight className="h-4 w-4 mx-2" />
                        {formatDateForDisplayMMDDYYYY(selectedPastTrip.end_date)}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('pastTrips.totalMiles')}</div>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {selectedPastTripData.loading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                            <span>{t('pastTrips.calculating')}</span>
                          </div>
                        ) : selectedPastTripData.crossings.length > 1 ? (
                          (selectedPastTripData.crossings[selectedPastTripData.crossings.length - 1].odometer -
                            selectedPastTripData.crossings[0].odometer).toLocaleString()
                        ) : (
                          t('pastTrips.noMileageData')
                        )}
                      </div>
                    </div>
                  </div>

                  {/* State mileage for past trip */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <h3 className="text-md font-medium mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                      <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                      {t('stateCrossings.title')}
                    </h3>
                    {selectedPastTripData.loading ? (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
                        <p className="text-gray-600 dark:text-gray-400">{t('pastTrips.loadingTripData')}</p>
                      </div>
                    ) : selectedPastTripData.crossings.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        <p>{t('pastTrips.noStateCrossings')}</p>
                      </div>
                    ) : (
                      <div className="space-y-2 mb-6">
                        {selectedPastTripData.crossings.map((crossing, index) => (
                          <StateCrossing
                            key={crossing.id || index}
                            crossing={crossing}
                            index={index}
                            isFirst={index === 0}
                            isLast={index === selectedPastTripData.crossings.length - 1}
                            t={t}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* State mileage summary */}
                  {selectedPastTripData.mileageByState.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                      <h3 className="text-md font-medium mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                        <BarChart2 className="h-4 w-4 text-blue-600 mr-2" />
                        {t('milesByState.title')}
                      </h3>
                      <div className="space-y-3">
                        {selectedPastTripData.mileageByState.map(entry => (
                          <div key={entry.state} className="p-2">
                            <div className="flex justify-between items-center mb-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">{entry.state_name}</div>
                              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{entry.miles.toLocaleString()} mi</div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${(entry.miles / selectedPastTripData.mileageByState[0].miles) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-10 text-center">
                  <History className="h-16 w-16 text-blue-300 dark:text-blue-500/50 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">{t('pastTrips.selectPastTrip')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {t('pastTrips.selectPastTripDescription')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  {t('summaryTab.title')}
                </h2>
                <QuarterFilter />
              </div>
            </div>
            <div className="p-4">
              {totalHistoricalMileage.length === 0 ? (
                <div className="text-center py-10">
                  <MapPin className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-700 dark:text-gray-300">{t('summaryTab.noData')}</p>
                  <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">{t('summaryTab.noDataDescription')}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {totalHistoricalMileage.slice(0, 6).map(entry => (
                      <div key={entry.state} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{entry.state_name}</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{entry.miles.toLocaleString()} {t('milesByState.milesUnit')}</div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mt-2">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${(entry.miles / totalHistoricalMileage[0].miles) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-md font-medium mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                      <Truck className="h-4 w-4 text-blue-600 mr-2" />
                      {t('summaryTab.totalMileageStats')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('summaryTab.totalStatesDriven')}</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalHistoricalMileage.length}</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('summaryTab.totalMiles')}</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {totalHistoricalMileage.reduce((sum, item) => sum + item.miles, 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('summaryTab.completedTrips')}</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredCompletedTrips.length}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Trip Modal */}
      <DeleteTripModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTripToDelete(null);
          setTripIftaStatus(null);
        }}
        onConfirm={confirmDeleteTrip}
        isDeleting={isDeleting}
        tripDetails={tripToDelete}
        iftaStatus={tripIftaStatus}
        t={t}
      />
    </div>
  );
}