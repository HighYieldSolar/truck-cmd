// src/components/ifta/SimplifiedTripsList.js
import { useState } from "react";
import { 
  Truck, 
  Calendar, 
  Trash2, 
  Filter, 
  RefreshCw,
  MapPin,
  Fuel,
  ArrowRight,
  Search,
  ChevronDown,
  X
} from "lucide-react";

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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
      <div className="overflow-x-auto">
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    {sorting.field === 'date' ? (
                      <ChevronDown
                        size={16}
                        className={`ml-1 ${sorting.direction === 'desc' ? '' : 'transform rotate-180'}`}
                      />
                    ) : null}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('vehicle')}
                >
                  <div className="flex items-center">
                    Vehicle
                    {sorting.field === 'vehicle' ? (
                      <ChevronDown
                        size={16}
                        className={`ml-1 ${sorting.direction === 'desc' ? '' : 'transform rotate-180'}`}
                      />
                    ) : null}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  States
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('miles')}
                >
                  <div className="flex items-center">
                    Miles
                    {sorting.field === 'miles' ? (
                      <ChevronDown
                        size={16}
                        className={`ml-1 ${sorting.direction === 'desc' ? '' : 'transform rotate-180'}`}
                      />
                    ) : null}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gallons
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{formatDate(trip.start_date)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{trip.vehicle_id || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        <MapPin size={16} className="text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{trip.start_jurisdiction}</span>
                      </div>
                      {trip.start_jurisdiction !== trip.end_jurisdiction && (
                        <>
                          <ArrowRight size={16} className="mx-2 text-gray-400" />
                          <div className="flex items-center">
                            <MapPin size={16} className="text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">{trip.end_jurisdiction}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{parseFloat(trip.total_miles).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Fuel size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {parseFloat(trip.gallons || 0).toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onDeleteTrip(trip)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete trip"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Summary footer */}
      {filteredTrips.length > 0 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <p className="text-sm text-gray-500">Total Gallons</p>
              <p className="text-black text-lg font-medium">
                {filteredTrips.reduce((sum, trip) => sum + parseFloat(trip.gallons || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}