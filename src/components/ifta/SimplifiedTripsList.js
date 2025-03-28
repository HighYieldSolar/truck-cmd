// src/components/ifta/SimplifiedTripsList.js
import { useState, useEffect } from "react";
import { 
  Truck, 
  Calendar, 
  Trash2, 
  Filter, 
  RefreshCw,
  MapPin,
  ArrowRight,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Clock
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function SimplifiedTripsList({ trips = [], onDeleteTrip, isLoading = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    state: '',
    vehicle: ''
  });
  const [sorting, setSorting] = useState({
    field: 'date',
    direction: 'desc' // desc = newest first
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState({});

  // Get unique states from trips
  const getUniqueStates = () => {
    const states = new Set();
    trips.forEach(trip => {
      if (trip.start_jurisdiction) states.add(trip.start_jurisdiction);
      if (trip.end_jurisdiction) states.add(trip.end_jurisdiction);
    });
    return Array.from(states).sort();
  };

  // Get unique vehicles from trips
  const getUniqueVehicles = () => {
    const vehicles = new Set();
    trips.forEach(trip => {
      if (trip.vehicle_id) vehicles.add(trip.vehicle_id);
    });
    return Array.from(vehicles).sort();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format vehicle name with license plate if available
  const formatVehicleName = (vehicleId) => {
    if (!vehicleId) return 'Unknown Vehicle';
    
    if (vehicleDetails[vehicleId]) {
      const vehicle = vehicleDetails[vehicleId];
      return vehicle.licensePlate 
        ? `${vehicle.name} (${vehicle.licensePlate})` 
        : vehicle.name;
    }
    
    return vehicleId;
  };

  // Fetch vehicle details on component mount
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        // Get unique vehicle IDs from trips
        const vehicleIds = [...new Set(trips.map(trip => trip.vehicle_id))].filter(Boolean);
        
        if (vehicleIds.length === 0) return;
        
        // Try to get vehicles from both possible tables
        let { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, name, license_plate')
          .in('id', vehicleIds);
        
        // If we couldn't find vehicles, try the trucks table
        if (vehiclesError || !vehiclesData || vehiclesData.length === 0) {
          const { data: trucksData, error: trucksError } = await supabase
            .from('trucks')
            .select('id, name, license_plate')
            .in('id', vehicleIds);
            
          if (!trucksError && trucksData && trucksData.length > 0) {
            vehiclesData = trucksData;
          }
        }
        
        // Build a lookup object for vehicle details
        if (vehiclesData && vehiclesData.length > 0) {
          const detailsMap = {};
          vehiclesData.forEach(vehicle => {
            detailsMap[vehicle.id] = {
              name: vehicle.name || vehicle.id,
              licensePlate: vehicle.license_plate || ''
            };
          });
          setVehicleDetails(detailsMap);
        }
      } catch (err) {
        console.error("Error fetching vehicle details:", err);
      }
    };
    
    fetchVehicleDetails();
  }, [trips]);

  const uniqueStates = getUniqueStates();
  const uniqueVehicles = getUniqueVehicles();

  // Apply filters and search to trips
  const filteredTrips = trips.filter(trip => {
    // Apply state filter
    if (filters.state && !trip.start_jurisdiction.includes(filters.state) && !trip.end_jurisdiction.includes(filters.state)) {
      return false;
    }
    
    // Apply vehicle filter
    if (filters.vehicle && trip.vehicle_id !== filters.vehicle) {
      return false;
    }
    
    // Apply search (on vehicle_id and state)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (trip.vehicle_id && trip.vehicle_id.toLowerCase().includes(searchLower)) ||
        (trip.start_jurisdiction && trip.start_jurisdiction.toLowerCase().includes(searchLower)) ||
        (trip.end_jurisdiction && trip.end_jurisdiction.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Apply sorting to filtered trips
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    switch(sorting.field) {
      case 'date':
        return sorting.direction === 'asc' 
          ? new Date(a.start_date) - new Date(b.start_date)
          : new Date(b.start_date) - new Date(a.start_date);
      case 'miles':
        return sorting.direction === 'asc'
          ? (parseFloat(a.total_miles) || 0) - (parseFloat(b.total_miles) || 0)
          : (parseFloat(b.total_miles) || 0) - (parseFloat(a.total_miles) || 0);
      case 'vehicle':
        return sorting.direction === 'asc'
          ? (a.vehicle_id || '').localeCompare(b.vehicle_id || '')
          : (b.vehicle_id || '').localeCompare(a.vehicle_id || '');
      default:
        return 0;
    }
  });

  // Handle sorting change
  const handleSort = (field) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      state: '',
      vehicle: ''
    });
  };

  // Toggle trip selection
  const handleSelectTrip = (trip) => {
    if (selectedTrip && selectedTrip.id === trip.id) {
      setSelectedTrip(null);
    } else {
      setSelectedTrip(trip);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <Truck size={20} className="text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">IFTA Trips</h3>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1 text-sm rounded-md inline-flex items-center ${
              showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Filter size={16} className="mr-1" />
            {Object.values(filters).some(f => f) || searchTerm ? 'Filters Active' : 'Filter'}
          </button>
          
          <span className="text-sm text-gray-500">
            {filteredTrips.length} of {trips.length} trips
          </span>
        </div>
      </div>
      
      {/* Search and filters */}
      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                />
                {searchTerm && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="state-filter" className="sr-only">Filter by State</label>
              <select
                id="state-filter"
                value={filters.state}
                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">All States</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="vehicle-filter" className="sr-only">Filter by Vehicle</label>
              <select
                id="vehicle-filter"
                value={filters.vehicle}
                onChange={(e) => setFilters(prev => ({ ...prev, vehicle: e.target.value }))}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">All Vehicles</option>
                {uniqueVehicles.map(vehicle => (
                  <option key={vehicle} value={vehicle}>{vehicle}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-3 flex justify-end">
            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Trips list or loading state */}
      <div className="overflow-y-auto max-h-96">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-500">Loading trips...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="p-12 text-center">
            <Truck size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Trips Recorded</h3>
            <p className="text-gray-500 mb-6">
              Start recording your interstate trips to generate your IFTA report.
            </p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="p-12 text-center">
            <Filter size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Trips</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search filters to see more trips.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {sortedTrips.map((trip) => (
              <div key={trip.id}>
                <div 
                  className={`p-4 rounded-lg border mb-2 transition-all ${
                    selectedTrip && selectedTrip.id === trip.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  } cursor-pointer`}
                  onClick={() => handleSelectTrip(trip)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-900 flex items-center">
                        <Truck size={16} className="mr-2 text-gray-500" />
                        {formatVehicleName(trip.vehicle_id)}
                      </h3>
                      <div className="flex items-center text-sm text-gray-700 mt-1">
                        <Calendar size={14} className="mr-1 text-gray-400" /> 
                        <span>{formatDate(trip.start_date)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700 mt-1">
                        <MapPin size={14} className="mr-1 text-gray-400" />
                        <span>{trip.start_jurisdiction}</span>
                        {trip.start_jurisdiction !== trip.end_jurisdiction && (
                          <>
                            <ArrowRight size={14} className="mx-1 text-gray-400" />
                            <span>{trip.end_jurisdiction}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="font-medium text-gray-900">
                        {parseFloat(trip.total_miles).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} mi
                      </div>
                      <div className="flex items-center mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTrip(trip);
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete trip"
                        >
                          <Trash2 size={16} />
                        </button>
                        <ChevronRight 
                          className={`h-5 w-5 text-gray-500 transition-transform ${selectedTrip && selectedTrip.id === trip.id ? 'rotate-90' : ''}`} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded details */}
                {selectedTrip && selectedTrip.id === trip.id && (
                  <div className="ml-6 mb-4 pl-4 border-l-2 border-blue-300 space-y-3">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Trip Details</h4>
                          <p className="text-sm">
                            <span className="font-medium">Vehicle:</span> {formatVehicleName(trip.vehicle_id)}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Date:</span> {formatDate(trip.start_date)}
                          </p>
                          {trip.driver_id && (
                            <p className="text-sm">
                              <span className="font-medium">Driver:</span> {trip.driver_id}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Jurisdiction</h4>
                          <p className="text-sm">
                            <span className="font-medium">From:</span> {trip.start_jurisdiction}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">To:</span> {trip.end_jurisdiction}
                          </p>
                          {trip.notes && (
                            <p className="text-sm">
                              <span className="font-medium">Notes:</span> {trip.notes}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Measurements</h4>
                          <p className="text-sm">
                            <span className="font-medium">Miles:</span> {parseFloat(trip.total_miles || 0).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Gallons:</span> {parseFloat(trip.gallons || 0).toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}
                          </p>
                          {trip.fuel_cost > 0 && (
                            <p className="text-sm">
                              <span className="font-medium">Fuel Cost:</span> ${parseFloat(trip.fuel_cost || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Record created date */}
                      {trip.created_at && (
                        <div className="mt-4 pt-2 border-t border-gray-100 text-xs text-gray-500 flex items-center">
                          <Clock size={12} className="mr-1" />
                          Record created: {new Date(trip.created_at).toLocaleDateString()} 
                          {trip.created_at !== trip.updated_at && ` (updated: ${new Date(trip.updated_at).toLocaleDateString()})`}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Summary footer */}
      {filteredTrips.length > 0 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Trips</p>
                <p className="text-black text-lg font-medium">{filteredTrips.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Miles</p>
                <p className="text-black text-lg font-medium">
                  {filteredTrips.reduce((sum, trip) => sum + parseFloat(trip.total_miles || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}
                </p>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}