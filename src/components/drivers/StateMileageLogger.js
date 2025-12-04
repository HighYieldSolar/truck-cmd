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
import { deleteTrip } from "@/lib/services/mileageService";
import { importMileageTripToIFTA } from "@/lib/services/iftaMileageService";
import { getCurrentDateLocal, formatDateForDisplayMMDDYYYY, prepareDateForDB } from "@/lib/utils/dateUtils";

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
  tripDetails = {}
}) {
  if (!isOpen) return null;

  const vehicleName = tripDetails.vehicleName || 'this vehicle';
  const tripDate = tripDetails.date
    ? formatDateForDisplayMMDDYYYY(tripDetails.date)
    : 'unknown date';

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 dark:border-gray-700 p-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Delete Trip
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">
                Delete this trip?
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
                Are you sure you want to delete the trip with {vehicleName} from {tripDate}? This will permanently remove all state crossings and mileage data associated with this trip.
              </p>
              <p className="mt-2 text-sm font-medium text-red-500 dark:text-red-400">
                This action cannot be undone.
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
            Cancel
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
                Deleting...
              </>
            ) : (
              'Delete Trip'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// StateCrossing component for rendering individual state crossings
const StateCrossing = ({ crossing, index, onDelete, isLast, isFirst }) => {
  // Format the crossing date for display
  const crossingDate = crossing.crossing_date
    ? formatDateForDisplayMMDDYYYY(crossing.crossing_date)
    : 'No date';

  return (
    <div className="flex items-center mb-2">
      <div className="flex-shrink-0 mr-2">
        {isFirst ? (
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        ) : isLast ? (
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <CornerDownRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-grow p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <span className="font-medium text-gray-900 dark:text-gray-100">{crossing.state_name}</span>
              <span className="ml-2 text-gray-500 dark:text-gray-400 dark:text-gray-400 text-sm">({crossing.state})</span>
            </div>
            <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
              <Calendar size={12} className="mr-1" />
              <span>{crossingDate}</span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-md mr-2">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{crossing.odometer.toLocaleString()} mi</span>
            </div>
            {onDelete && (
              <button
                onClick={() => onDelete(index)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 focus:outline-none"
              >
                <Trash size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// TripCard component for rendering active and completed trips
const TripCard = ({ trip, vehicles, onSelect, isSelected, onDelete }) => {
  const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
  const vehicleName = vehicle
    ? `${vehicle.name}${vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}`
    : trip.vehicle_id;

  // Format date for display (fixed timezone issue)
  const tripDate = formatDateForDisplayMMDDYYYY(trip.start_date);

  return (
    <div
      className={`border rounded-xl shadow-sm mb-3 transition-all hover:shadow-md cursor-pointer overflow-hidden ${isSelected
        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 dark:from-blue-900/30 dark:to-indigo-900/30'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700'
        }`}
      onClick={() => onSelect(trip)}
    >
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-3 bg-blue-100 dark:bg-blue-900/40 p-2 rounded-xl">
              <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">{vehicleName}</h3>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {tripDate}
              </div>
            </div>
          </div>

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(trip, vehicleName);
              }}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="bg-blue-600 h-1.5 w-full"></div>
      )}
    </div>
  );
};

// Main component for state mileage logging
export default function StateMileageLogger() {
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
      setError('Failed to load trip details. Please try again.');
      setSelectedTripData({
        crossings: [],
        loading: false
      });
    }
  }, []);

  // Handle delete button click
  const handleDeleteClick = (trip, vehicleName) => {
    setTripToDelete({
      id: trip.id,
      vehicleName,
      date: trip.start_date
    });
    setDeleteModalOpen(true);
  };

  // Confirm deletion of a trip
  const confirmDeleteTrip = async () => {
    if (!tripToDelete || !user) return;

    try {
      setIsDeleting(true);

      // Call the delete function
      await deleteTrip(tripToDelete.id, user.id);

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

      // Show success message
      setSuccess('Trip deleted successfully');
      setTimeout(() => setSuccess(null), 3000);

      // Close modal
      setDeleteModalOpen(false);
      setTripToDelete(null);

    } catch (error) {
      // console.error('Error deleting trip:', error);
      setError('Failed to delete trip. Please try again.');
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
      setError('Failed to load active trips. Please refresh the page.');
    }
  }, []);

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
      setError('Failed to load trip history. Please refresh the page.');
    }
  }, []);

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
      setError('Failed to load trip details. Please try again.');
      setSelectedPastTripData({
        crossings: [],
        loading: false,
        mileageByState: []
      });
    }
  }, [selectedPastTrip, completedTripCrossings, calculateStateMileageFromCrossings]);

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
        setError('Authentication error. Please try logging in again.');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [loadActiveTrips, loadCompletedTrips, loadVehicles]);

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
        throw new Error('Please fill in all required fields.');
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

      setSuccess('Trip started successfully!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      // console.error('Error starting trip:', error);
      setError(error.message || 'Failed to start trip. Please try again.');
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
        throw new Error('Please fill in all required fields.');
      }

      // Check if odometer reading is valid (greater than last reading)
      if (selectedTripData.crossings.length > 0) {
        const lastOdometer = selectedTripData.crossings[selectedTripData.crossings.length - 1].odometer;
        if (parseInt(crossingForm.odometer) <= lastOdometer) {
          throw new Error(`Odometer reading must be greater than the last reading (${lastOdometer}).`);
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

      setSuccess('State crossing added successfully!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      // console.error('Error adding crossing:', error);
      setError(error.message || 'Failed to add state crossing. Please try again.');
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
      setError('Failed to delete crossing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle ending a trip - the fixed version
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

      // Reload trips
      await loadActiveTrips(user.id);
      await loadCompletedTrips(user.id);

      setSelectedTrip(null);
      setSelectedTripData({
        crossings: [],
        loading: false
      });

      setSuccess('Trip completed successfully! You can now manually import it to your IFTA calculator.');
      setTimeout(() => setSuccess(null), 5000);

    } catch (error) {
      // console.error('Error ending trip:', error);
      setError('Failed to end trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total miles for all historical trips - using memo to keep consistent values
  const totalHistoricalMileage = useMemo(() => {
    const stateTotals = new Map();

    Object.entries(completedTripCrossings).forEach(([tripId, crossings]) => {
      if (!crossings || crossings.length < 2) return;

      for (let i = 0; i < crossings.length - 1; i++) {
        const currentState = crossings[i].state;
        const stateName = crossings[i].state_name;
        const currentOdometer = crossings[i].odometer;
        const nextOdometer = crossings[i + 1].odometer;
        const milesDriven = nextOdometer - currentOdometer;

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

    // Convert map to array and sort by miles
    return Array.from(stateTotals.values())
      .sort((a, b) => b.miles - a.miles);
  }, [completedTripCrossings]);

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
            <h3 className="font-medium">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-xl p-4 mb-6 flex items-start">
          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Success</h3>
            <p className="text-sm">{success}</p>
          </div>
        </div>
      )}

      <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-sm inline-flex mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center ${activeTab === 'active'
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-600'
            }`}
        >
          <Truck className="h-4 w-4 mr-2" />
          Active Trips
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-5 py-2.5 mx-2 rounded-lg font-medium transition-all duration-200 flex items-center ${activeTab === 'past'
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-600'
            }`}
        >
          <History className="h-4 w-4 mr-2" />
          Past Trips
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center ${activeTab === 'summary'
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md'
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-600'
            }`}
        >
          <BarChart2 className="h-4 w-4 mr-2" />
          Summary
        </button>
      </div>

      {activeTab === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active trips section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Active Trips
                </h2>
                <button
                  onClick={() => {
                    setSelectedTrip(null);
                    // Reset crossing form when switching to new trip
                    setCrossingForm({
                      state: "",
                      odometer: "",
                      date: getCurrentDateLocal()
                    });
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-medium rounded-md shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
                >
                  <Plus size={18} className="mr-1.5" />
                  New Trip
                </button>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800">
                {activeTrips.length === 0 ? (
                  <div className="text-center py-6">
                    <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No active trips</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Start a new trip to track state mileage</p>
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
                          // Reset crossing form when switching trips
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
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mt-6 border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Start New Trip</h2>
                </div>
                <div className="p-4">
                  <form onSubmit={handleStartTrip}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select Vehicle
                      </label>
                      <select
                        name="vehicle_id"
                        value={newTripForm.vehicle_id}
                        onChange={handleNewTripChange}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Vehicle</option>
                        {vehicles.map(vehicle => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.name}{vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Starting State
                      </label>
                      <select
                        name="start_state"
                        value={newTripForm.start_state}
                        onChange={handleNewTripChange}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select State</option>
                        {states.map(state => (
                          <option key={state.code} value={state.code}>{state.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Starting Odometer
                      </label>
                      <input
                        type="number"
                        name="start_odometer"
                        value={newTripForm.start_odometer}
                        onChange={handleNewTripChange}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Odometer reading"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={newTripForm.date}
                        onChange={handleNewTripChange}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm flex items-center justify-center"
                    >
                      <Plus size={16} className="mr-2" />
                      Start Trip
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Trip details */}
          <div className="lg:col-span-2">
            {selectedTrip ? (
              <div className="space-y-6">
                {/* Trip header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {vehicles.find(v => v.id === selectedTrip.vehicle_id)?.name || selectedTrip.vehicle_id}
                        </h2>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          Started on {formatDateForDisplayMMDDYYYY(selectedTrip.start_date)}
                        </div>
                      </div>
                      <button
                        onClick={handleEndTrip}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm flex items-center"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <RefreshCw size={16} className="animate-spin mr-2" />
                            Ending...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} className="mr-2" />
                            End Trip
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* State crossings */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">State Crossings</h3>
                  </div>
                  <div className="p-4">
                    {selectedTripData.crossings.length === 0 ? (
                      <div className="text-center py-6">
                        <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-700">No state crossings recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2 mb-6">
                        {selectedTripData.crossings.map((crossing, index) => (
                          <StateCrossing
                            key={index}
                            crossing={crossing}
                            index={index}
                            onDelete={index > 0 && index === selectedTripData.crossings.length - 1 ? handleDeleteCrossing : null}
                            isFirst={index === 0}
                            isLast={index === selectedTripData.crossings.length - 1}
                          />
                        ))}
                      </div>
                    )}

                    {/* Add crossing form */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-md font-medium mb-3 text-gray-900">Add State Crossing</h4>
                      <form onSubmit={handleAddCrossing} className="flex flex-wrap items-end gap-3">
                        <div className="flex-grow min-w-[200px]">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Entering State
                          </label>
                          <select
                            name="state"
                            value={crossingForm.state}
                            onChange={handleCrossingChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select State</option>
                            {states.map(state => (
                              <option key={state.code} value={state.code}>{state.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-grow min-w-[180px]">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Odometer Reading
                          </label>
                          <input
                            type="number"
                            name="odometer"
                            value={crossingForm.odometer}
                            onChange={handleCrossingChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Current reading"
                            required
                          />
                        </div>

                        <div className="flex-grow min-w-[160px]">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                            <Calendar size={14} className="mr-1 text-gray-400" />
                            Crossing Date
                          </label>
                          <input
                            type="date"
                            name="date"
                            value={crossingForm.date}
                            onChange={handleCrossingChange}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div className="flex-shrink-0">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm h-[42px] flex items-center"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <RefreshCw size={16} className="animate-spin mr-2" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus size={16} className="mr-2" />
                                Add
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Mileage by State */}
                {selectedTrip && stateMileage.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <BarChart2 className="h-5 w-5 text-blue-600 mr-2" />
                        Miles by State
                      </h2>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3 mb-4">
                        {stateMileage.map(entry => (
                          <div key={entry.state} className="p-2">
                            <div className="flex justify-between items-center mb-1">
                              <div className="font-medium text-gray-900">{entry.state_name}</div>
                              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{entry.miles.toLocaleString()} mi</div>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${(entry.miles / stateMileage[0].miles) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total miles */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <div className="font-medium text-gray-900">Total</div>
                          <div className="text-lg font-semibold text-blue-600">
                            {stateMileage.reduce((total, entry) => total + entry.miles, 0).toLocaleString()} mi
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTrips.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-10 text-center">
                  <Truck className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3">Select an Active Trip</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-5">
                    You have {activeTrips.length} active trip{activeTrips.length !== 1 ? 's' : ''}.
                    Please select one from the list on the left to view details or add state crossings.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {activeTrips.slice(0, 3).map(trip => (
                      <button
                        key={trip.id}
                        onClick={() => handleSelectTrip(trip)}
                        className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-md text-blue-700 font-medium hover:bg-blue-100 transition-colors"
                      >
                        {vehicles.find(v => v.id === trip.vehicle_id)?.name || trip.vehicle_id}
                      </button>
                    ))}
                    {activeTrips.length > 3 && (
                      <span className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-500 dark:text-gray-400">
                        +{activeTrips.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-10 text-center">
                  <MapPin className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Select or Create a Trip</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    To start tracking your state mileage, select an existing trip from the list or create a new one.
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
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Completed Trips
                </h2>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading completed trips...</p>
                  </div>
                ) : completedTrips.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No completed trips</h3>
                    <p className="text-gray-500 dark:text-gray-400">Complete active trips to see history</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {completedTrips.map(trip => (
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
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Trip Details - {vehicles.find(v => v.id === selectedPastTrip.vehicle_id)?.name || selectedPastTrip.vehicle_id}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            setError(null);
                            const now = new Date();
                            const quarter = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
                            const result = await importMileageTripToIFTA(user.id, quarter, selectedPastTrip.id);
                            if (result.alreadyImported) {
                              setSuccess("This trip has already been imported to the IFTA calculator");
                            } else if (result.importedCount === 0) {
                              setSuccess("No mileage data to import");
                            } else {
                              setSuccess(`Successfully imported ${result.importedCount} state records to IFTA calculator for ${quarter}`);
                            }
                            setTimeout(() => setSuccess(null), 4000);
                          } catch (error) {
                            console.error("Error importing to IFTA:", error);
                            setError("Failed to import to IFTA calculator. Please try again.");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading || selectedPastTripData.mileageByState.length === 0}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                          <Fuel className="h-4 w-4 mr-1.5" />
                        )}
                        Import to IFTA
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
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Trip Duration</div>
                      <div className="text-lg font-medium flex items-center text-gray-900 dark:text-gray-100">
                        <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                        {formatDateForDisplayMMDDYYYY(selectedPastTrip.start_date)}
                        <ArrowRight className="h-4 w-4 mx-2" />
                        {formatDateForDisplayMMDDYYYY(selectedPastTrip.end_date)}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Miles</div>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {selectedPastTripData.loading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                            <span>Calculating...</span>
                          </div>
                        ) : selectedPastTripData.crossings.length > 1 ? (
                          (selectedPastTripData.crossings[selectedPastTripData.crossings.length - 1].odometer -
                            selectedPastTripData.crossings[0].odometer).toLocaleString()
                        ) : (
                          'No mileage data available'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* State mileage for past trip */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <h3 className="text-md font-medium mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                      <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                      State Crossings
                    </h3>
                    {selectedPastTripData.loading ? (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
                        <p className="text-gray-700 dark:text-gray-400">Loading trip data...</p>
                      </div>
                    ) : selectedPastTripData.crossings.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        <p>No state crossings found for this trip</p>
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
                        Miles by State
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
                  <History className="h-16 w-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Select a Past Trip</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Select a completed trip from the list to view details and mileage breakdown.
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
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <BarChart2 className="h-5 w-5 text-blue-600 mr-2" />
                Mileage Summary by State (All Time)
              </h2>
            </div>
            <div className="p-4">
              {totalHistoricalMileage.length === 0 ? (
                <div className="text-center py-10 text-gray-700 dark:text-gray-400">
                  <MapPin className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p>No historical mileage data available</p>
                  <p className="text-sm mt-1">Complete trips to see your mileage summary</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {totalHistoricalMileage.slice(0, 6).map(entry => (
                      <div key={entry.state} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{entry.state_name}</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{entry.miles.toLocaleString()} mi</div>
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
                      Total Mileage Stats
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Total States Driven</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalHistoricalMileage.length}</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Miles</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {totalHistoricalMileage.reduce((sum, item) => sum + item.miles, 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed Trips</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{completedTrips.length}</div>
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
        }}
        onConfirm={confirmDeleteTrip}
        isDeleting={isDeleting}
        tripDetails={tripToDelete}
      />
    </div>
  );
}