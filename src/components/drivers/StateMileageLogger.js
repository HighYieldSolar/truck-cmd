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
    ? new Date(tripDetails.date).toLocaleDateString()
    : 'unknown date';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Delete Trip
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isDeleting}
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                Delete this trip?
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete the trip with {vehicleName} from {tripDate}? This will permanently remove all state crossings and mileage data associated with this trip.
              </p>
              <p className="mt-2 text-sm font-medium text-red-500">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none flex items-center"
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
  return (
    <div className="flex items-center mb-2">
      <div className="flex-shrink-0 mr-2">
        {isFirst ? (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-green-600" />
          </div>
        ) : isLast ? (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-blue-600" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <CornerDownRight className="h-4 w-4 text-gray-600" />
          </div>
        )}
      </div>
      <div className="flex-grow p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-medium text-gray-900">{crossing.state_name}</span>
            <div className="text-sm text-gray-700">Odometer: {crossing.odometer.toLocaleString()}</div>
            {crossing.timestamp && (
              <div className="text-xs text-gray-600">
                {new Date(crossing.timestamp).toLocaleString()}
              </div>
            )}
          </div>
          {!isFirst && (
            <button
              onClick={() => onDelete(index)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// TripCard component for completed trips
const TripCard = ({ trip, vehicles, onSelect, isSelected, onDelete }) => {
  const vehicleName = vehicles.find(v => v.id === trip.vehicle_id)?.name || trip.vehicle_id;
  const tripDuration = trip.end_date ? 
    `${new Date(trip.start_date).toLocaleDateString()} - ${new Date(trip.end_date).toLocaleDateString()}` :
    `Started ${new Date(trip.start_date).toLocaleDateString()}`;
  
  return (
    <div 
      className={`p-4 rounded-lg border mb-2 transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="cursor-pointer flex-grow" onClick={() => onSelect(trip)}>
          <h3 className="font-medium text-gray-900">{vehicleName}</h3>
          <div className="flex items-center text-sm text-gray-700">
            <Calendar size={14} className="mr-1" /> 
            <span>{tripDuration}</span>
          </div>
        </div>
        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering onSelect
              onDelete(trip, vehicleName);
            }}
            className="text-red-500 hover:text-red-700 p-2"
            title="Delete trip"
          >
            <Trash size={16} />
          </button>
          <ChevronRight className={`h-5 w-5 text-gray-500 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
        </div>
      </div>
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
    date: new Date().toISOString().split('T')[0]
  });
  
  // Crossing form state
  const [crossingForm, setCrossingForm] = useState({
    state: "",
    odometer: ""
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
  
  // Select a trip to view/edit
  const handleSelectTrip = useCallback(async (trip) => {
    try {
      setSelectedTrip(trip);
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
      console.error('Error loading trip details:', error);
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
    }
    
    // Remove from completedTripCrossings
    const updatedCrossings = { ...completedTripCrossings };
    delete updatedCrossings[tripToDelete.id];
    setCompletedTripCrossings(updatedCrossings);
    
    // Remove from completedTrips
    setCompletedTrips(prev => prev.filter(trip => trip.id !== tripToDelete.id));
    
    // Show success message
    setSuccess('Trip deleted successfully');
    setTimeout(() => setSuccess(null), 3000);
    
    // Close modal
    setDeleteModalOpen(false);
    setTripToDelete(null);
    
  } catch (error) {
    console.error('Error deleting trip:', error);
    setError('Failed to delete trip. Please try again.');
  } finally {
    setIsDeleting(false);
  }
};

// Load vehicles
const loadVehicles = useCallback(async (userId) => {
  try {
    // First try to get trucks from the vehicles table
    let { data, error } = await supabase
      .from('vehicles')
      .select('id, name, license_plate')
      .eq('user_id', userId);
    
    // If that fails, try the trucks table instead
    if (error || !data || data.length === 0) {
      const { data: trucksData, error: trucksError } = await supabase
        .from('trucks')
        .select('id, name, license_plate')
        .eq('user_id', userId);
        
      if (!trucksError) {
        data = trucksData;
      }
    }
    
    // If we still don't have data, create some sample vehicles
    if (!data || data.length === 0) {
      data = [
        { id: 'truck1', name: 'Truck 1', license_plate: 'ABC123' },
        { id: 'truck2', name: 'Truck 2', license_plate: 'XYZ789' }
      ];
    }
    
    setVehicles(data);
    
  } catch (error) {
    console.error('Error loading vehicles:', error);
    
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
      handleSelectTrip(data[0]);
    }
    
  } catch (error) {
    console.error('Error loading active trips:', error);
    setError('Failed to load active trips. Please refresh the page.');
  }
}, [handleSelectTrip]);

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
    
    // Load crossings for all completed trips
    if (data && data.length > 0) {
      const tripIds = data.map(trip => trip.id);
      const { data: crossings, error: crossingsError } = await supabase
        .from('driver_mileage_crossings')
        .select('*')
        .in('trip_id', tripIds)
        .order('timestamp', { ascending: true });
        
      if (crossingsError) throw crossingsError;
      
      // Organize crossings by trip_id
      const crossingsByTrip = {};
      
      if (crossings) {
        crossings.forEach(crossing => {
          if (!crossingsByTrip[crossing.trip_id]) {
            crossingsByTrip[crossing.trip_id] = [];
          }
          crossingsByTrip[crossing.trip_id].push(crossing);
        });
      }
      
      setCompletedTripCrossings(crossingsByTrip);
    }
    
  } catch (error) {
    console.error('Error loading completed trips:', error);
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
    if (completedTripCrossings[trip.id]) {
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
    
    setSelectedPastTripData({
      crossings: data || [],
      loading: false,
      mileageByState
    });
    
  } catch (error) {
    console.error('Error loading past trip details:', error);
    setError('Failed to load trip details. Please try again.');
    setSelectedPastTripData({
      crossings: [],
      loading: false,
      mileageByState: []
    });
  }
}, [selectedPastTrip, completedTripCrossings]);

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
      console.error('Error checking authentication:', error);
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
      date: new Date().toISOString().split('T')[0]
    });
    
    await loadActiveTrips(user.id);
    
    // Switch to active tab
    setActiveTab('active');
    
    setSuccess('Trip started successfully!');
    setTimeout(() => setSuccess(null), 3000);
    
  } catch (error) {
    console.error('Error starting trip:', error);
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
    if (!crossingForm.state || !crossingForm.odometer) {
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
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    const { error: crossingError } = await supabase
      .from('driver_mileage_crossings')
      .insert([crossingData]);
      
    if (crossingError) throw crossingError;
    
    // Reset form and reload trip data
    setCrossingForm({
      state: "",
      odometer: ""
    });
    
    // Reload crossings for this trip
    await handleSelectTrip(selectedTrip);
    
    setSuccess('State crossing added successfully!');
    setTimeout(() => setSuccess(null), 3000);
    
  } catch (error) {
    console.error('Error adding crossing:', error);
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
    console.error('Error deleting crossing:', error);
    setError('Failed to delete crossing. Please try again.');
  } finally {
    setLoading(false);
  }
};

// End a trip
const handleEndTrip = async () => {
  if (!selectedTrip) return;
  
  try {
    setLoading(true);
    
    // Update trip status to 'completed'
    const { error } = await supabase
      .from('driver_mileage_trips')
      .update({
        status: 'completed',
        end_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedTrip.id);
      
    if (error) throw error;
    
    // Update the completed trip crossings
    const tripId = selectedTrip.id;
    setCompletedTripCrossings(prev => ({
      ...prev,
      [tripId]: selectedTripData.crossings
    }));
    
    // Reload trips
    await loadActiveTrips(user.id);
    await loadCompletedTrips(user.id);
    
    setSelectedTrip(null);
    setSelectedTripData({
      crossings: [],
      loading: false
    });
    
    setSuccess('Trip completed successfully!');
    setTimeout(() => setSuccess(null), 3000);
    
  } catch (error) {
    console.error('Error ending trip:', error);
    setError('Failed to end trip. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Calculate miles for each state in the current trip
const calculateStateMileage = () => {
  return calculateStateMileageFromCrossings(selectedTripData.crossings);
};

// Shared function to calculate mileage by state from crossings
const calculateStateMileageFromCrossings = (crossings) => {
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
  <div className="max-w-6xl mx-auto p-4">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">State Mileage Tracker</h1>
        <p className="text-gray-700">Track and record miles driven in each state for IFTA reporting</p>
      </div>
      
      {/* Tabs navigation */}
      <div className="flex space-x-2 mt-4 md:mt-0">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active Trips
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'past' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Trip History
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'summary' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Summary
        </button>
      </div>
    </div>
    
    {/* Error and success messages */}
    {error && (
      <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )}
    
    {success && (
      <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
        <div className="flex">
          <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
          <p className="text-green-700">{success}</p>
        </div>
      </div>
    )}
    
    {/* Active Trips Tab */}
    {activeTab === 'active' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - New trip form or active trip */}
        <div className="lg:col-span-2">
          {selectedTrip ? (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                <Truck className="h-5 w-5 text-blue-500 mr-2" />
                Active Trip
              </h2>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700">Vehicle</div>
                <div className="text-lg font-medium text-gray-900">
                  {vehicles.find(v => v.id === selectedTrip.vehicle_id)?.name || selectedTrip.vehicle_id}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700">Trip Started</div>
                <div className="text-lg font-medium text-gray-900">
                  {new Date(selectedTrip.start_date).toLocaleDateString()}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700">Total Miles</div>
                <div className="text-lg font-medium text-gray-900">
                  {selectedTripData.crossings.length > 0 
                    ? (selectedTripData.crossings[selectedTripData.crossings.length - 1].odometer - 
                       selectedTripData.crossings[0].odometer).toLocaleString()
                    : 0}
                </div>
              </div>
              
              <button
                onClick={handleEndTrip}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Complete Trip
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Start New Trip</h2>
                <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Step 1</div>
              </div>
              
              <form onSubmit={handleStartTrip}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle
                  </label>
                  <select
                    name="vehicle_id"
                    value={newTripForm.vehicle_id}
                    onChange={handleNewTripChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} {vehicle.license_plate ? `(${vehicle.license_plate})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starting State
                  </label>
                  <select
                    name="start_state"
                    value={newTripForm.start_state}
                    onChange={handleNewTripChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state.code} value={state.code}>{state.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starting Odometer
                  </label>
                  <input
                    type="number"
                    name="start_odometer"
                    value={newTripForm.start_odometer}
                    onChange={handleNewTripChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Odometer reading"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={newTripForm.date}
                    onChange={handleNewTripChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Truck className="h-4 w-4 mr-2" />
                  )}
                  Start Trip
                </button>
              </form>
            </div>
          )}
          
          {/* State crossings */}
          {selectedTrip && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center text-gray-900">
                  <MapPin className="h-5 w-5 text-blue-500 mr-2" />
                  State Crossings
                </h2>
                <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Step 2</div>
              </div>
              
              {selectedTripData.loading ? (
                <div className="py-8 flex justify-center">
                  <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : selectedTripData.crossings.length === 0 ? (
                <div className="py-8 text-center text-gray-700">
                  No state crossings recorded yet.
                </div>
              ) : (
                <div className="mb-6">
{selectedTripData.crossings.map((crossing, index) => (
                      <StateCrossing
                        key={index}
                        crossing={crossing}
                        index={index}
                        onDelete={handleDeleteCrossing}
                        isFirst={index === 0}
                        isLast={index === selectedTripData.crossings.length - 1}
                      />
                    ))}
                  </div>
                )}
                
                {/* Add new crossing form */}
                <form onSubmit={handleAddCrossing} className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-md font-medium mb-3 text-gray-900">Add State Crossing</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entering State
                      </label>
                      <select
                        name="state"
                        value={crossingForm.state}
                        onChange={handleCrossingChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select State</option>
                        {states.map(state => (
                          <option key={state.code} value={state.code}>{state.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Odometer
                      </label>
                      <input
                        type="number"
                        name="odometer"
                        value={crossingForm.odometer}
                        onChange={handleCrossingChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Odometer reading"
                        required
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add State Crossing
                  </button>
                </form>
              </div>
            )}
          </div>
          
          {/* Right column - Active trips and state mileage */}
          <div className="space-y-6">
            {/* Active trips list */}
            {activeTrips.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-gray-900">Active Trips</h2>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activeTrips.map(trip => (
                    <div 
                      key={trip.id} 
                      className={`p-3 rounded-lg border ${selectedTrip && selectedTrip.id === trip.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'} cursor-pointer`}
                      onClick={() => handleSelectTrip(trip)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">
                            {vehicles.find(v => v.id === trip.vehicle_id)?.name || trip.vehicle_id}
                          </div>
                          <div className="text-sm text-gray-700">
                            Started: {new Date(trip.start_date).toLocaleDateString()}
                          </div>
                        </div>
                        <Truck className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* State mileage summary for active trip */}
            {selectedTrip && stateMileage.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-900">
                  <BarChart2 className="h-5 w-5 text-blue-500 mr-2" />
                  Miles by State
                </h2>
                
                <div className="space-y-2 mb-4">
                  {stateMileage.map(entry => (
                    <div key={entry.state} className="p-2">
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-medium text-gray-900">{entry.state_name}</div>
                        <div className="text-lg font-semibold text-gray-900">{entry.miles.toLocaleString()} mi</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${(entry.miles / stateMileage[0].miles) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Total miles */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-gray-900">Total</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {stateMileage.reduce((total, entry) => total + entry.miles, 0).toLocaleString()} mi
                    </div>
                  </div>
                </div>
                
                {/* Export button */}
                <div className="mt-4">
                  <ExportMileageButton 
                    tripId={selectedTrip.id} 
                    stateMileage={stateMileage} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Past Trips Tab */}
      {activeTab === 'past' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Past Trips List */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-900">
                <History className="h-5 w-5 text-blue-500 mr-2" />
                Trip History
              </h2>
              
              {completedTrips.length === 0 ? (
                <div className="text-center py-10 text-gray-700">
                  <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p>No completed trips found</p>
                  <p className="text-sm mt-1">Complete a trip to see it here</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {completedTrips.map(trip => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      vehicles={vehicles}
                      onSelect={handleSelectPastTrip}
                      isSelected={selectedPastTrip && selectedPastTrip.id === trip.id}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right column - Trip Details */}
          <div className="lg:col-span-2">
            {selectedPastTrip ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                  Trip Details - {vehicles.find(v => v.id === selectedPastTrip.vehicle_id)?.name || selectedPastTrip.vehicle_id}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Trip Duration</div>
                    <div className="text-lg font-medium flex items-center text-gray-900">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      {new Date(selectedPastTrip.start_date).toLocaleDateString()} 
                      <ArrowRight className="h-4 w-4 mx-2" /> 
                      {new Date(selectedPastTrip.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Total Miles</div>
                    <div className="text-lg font-medium text-gray-900">
                      {selectedPastTripData.crossings.length > 0 
                        ? (selectedPastTripData.crossings[selectedPastTripData.crossings.length - 1].odometer - 
                           selectedPastTripData.crossings[0].odometer).toLocaleString()
                        : 'Calculating...'}
                    </div>
                  </div>
                </div>
                
                {/* State mileage for past trip */}
                {selectedPastTripData.mileageByState.length > 0 ? (
                  <>
                    <h3 className="text-md font-medium mb-3 text-gray-900">Miles by State</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {selectedPastTripData.mileageByState.map(entry => (
                        <div key={entry.state} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <div className="font-medium text-gray-900">{entry.state_name}</div>
                            <div className="text-lg font-semibold text-gray-900">{entry.miles.toLocaleString()} mi</div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${(entry.miles / selectedPastTripData.mileageByState[0].miles) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Export button */}
                    <ExportMileageButton 
                      tripId={selectedPastTrip.id} 
                      stateMileage={selectedPastTripData.mileageByState} 
                    />
                  </>
                ) : selectedPastTripData.loading ? (
                  <div className="flex justify-center items-center py-10">
                    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-700">
                    <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p>No state crossings found for this trip</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a trip to view details</h3>
                <p className="text-gray-700">
                  Select any completed trip from the list to view state-by-state mileage information
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
              <BarChart2 className="h-5 w-5 text-blue-500 mr-2" />
              Mileage Summary by State (All Time)
            </h2>
            
            {totalHistoricalMileage.length === 0 ? (
              <div className="text-center py-10 text-gray-700">
                <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p>No historical mileage data available</p>
                <p className="text-sm mt-1">Complete trips to see your mileage summary</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {totalHistoricalMileage.slice(0, 6).map(entry => (
                    <div key={entry.state} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-medium text-gray-900">{entry.state_name}</div>
                        <div className="text-lg font-semibold text-gray-900">{entry.miles.toLocaleString()} mi</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${(entry.miles / totalHistoricalMileage[0].miles) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-md font-medium mb-3 text-gray-900">Total Mileage Stats</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">Total States Driven</div>
                      <div className="text-2xl font-bold text-blue-600">{totalHistoricalMileage.length}</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">Total Miles</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {totalHistoricalMileage.reduce((sum, item) => sum + item.miles, 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">Completed Trips</div>
                      <div className="text-2xl font-bold text-blue-600">{completedTrips.length}</div>
                    </div>
                  </div>
                </div>
              </>
            )}
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