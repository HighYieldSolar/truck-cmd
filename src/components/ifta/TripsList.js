"use client";

import { useState, useEffect } from "react";
import { 
  Trash2, 
  Download, 
  Filter, 
  Search, 
  MapPin, 
  Truck, 
  Calendar, 
  DollarSign, 
  Fuel,
  ChevronsUpDown,
  FileText,
  Link as LinkIcon,
  Plus,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";
import Link from "next/link";

export default function TripsList({ 
  trips = [], 
  onRemoveTrip, 
  isLoading = false,
  showSourceBadges = true
}) {
  const [filters, setFilters] = useState({
    search: "",
    jurisdiction: "",
    vehicle: "",
    source: "all" // 'all', 'mileage', 'load', 'manual'
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'start_date',
    direction: 'desc'
  });
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState({});

  // Get unique values for filter dropdowns
  const getUniqueValues = (key) => {
    const values = new Set();
    
    trips.forEach(trip => {
      if (key === 'jurisdiction') {
        if (trip.start_jurisdiction) values.add(trip.start_jurisdiction);
        if (trip.end_jurisdiction) values.add(trip.end_jurisdiction);
      } else if (key === 'vehicle') {
        if (trip.vehicle_id) values.add(trip.vehicle_id);
      }
    });
    
    return Array.from(values).sort();
  };

  const uniqueJurisdictions = getUniqueValues('jurisdiction');
  const uniqueVehicles = getUniqueValues('vehicle');

  // Format vehicle display with name and plate if available
  const formatVehicleDisplay = (vehicleId) => {
    if (!vehicleId) return 'Unknown';
    
    const details = vehicleDetails[vehicleId];
    if (!details) return vehicleId;
    
    return details.name + (details.licensePlate ? ` (${details.licensePlate})` : '');
  };

  // Handle sort
  const requestSort = (key) => {
    let direction = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Sort and filter trips
  const getSortedAndFilteredTrips = () => {
    // Defensive check to ensure trips is an array
    if (!Array.isArray(trips)) {
      console.error("Trips is not an array:", trips);
      return [];
    }
    
    try {
      // Apply filters first
      let filteredTrips = trips.filter(trip => {
        // Handle null/undefined trip values
        if (!trip) return false;
        
        // Search filter - safely access properties
        if (filters.search && !Object.entries(trip).some(([key, value]) => 
          value !== null && 
          value !== undefined && 
          String(value).toLowerCase().includes(filters.search.toLowerCase())
        )) {
          return false;
        }
        
        // Jurisdiction filter - account for null values
        if (filters.jurisdiction && 
          !((trip.start_jurisdiction && trip.start_jurisdiction === filters.jurisdiction) || 
            (trip.end_jurisdiction && trip.end_jurisdiction === filters.jurisdiction))) {
          return false;
        }
        
        // Vehicle filter - account for null values
        if (filters.vehicle && trip.vehicle_id !== filters.vehicle) {
          return false;
        }
        
        // Source filter
        if (filters.source === 'mileage' && !trip.mileage_trip_id) {
          return false;
        } else if (filters.source === 'load' && !trip.load_id) {
          return false;
        } else if (filters.source === 'manual' && (trip.load_id || trip.mileage_trip_id)) {
          return false;
        }
        
        return true;
      });

      // Then sort - handle potential null/undefined values safely
      return filteredTrips.sort((a, b) => {
        // Default values if null/undefined
        const aValue = a[sortConfig.key] !== undefined && a[sortConfig.key] !== null 
          ? a[sortConfig.key] 
          : '';
        const bValue = b[sortConfig.key] !== undefined && b[sortConfig.key] !== null 
          ? b[sortConfig.key] 
          : '';
        
        // Special case for numeric values
        if (['total_miles', 'gallons', 'fuel_cost'].includes(sortConfig.key)) {
          const aNum = parseFloat(aValue) || 0;
          const bNum = parseFloat(bValue) || 0;
          
          return sortConfig.direction === 'asc'
            ? aNum - bNum
            : bNum - aNum;
        }
        
        // Default string sort with nullish handling
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } catch (error) {
      console.error("Error in sorting/filtering trips:", error);
      return [];
    }
  };

  // Safely get the sorted and filtered trips - error handling wrapper
  const safeGetSortedAndFilteredTrips = () => {
    try {
      return getSortedAndFilteredTrips();
    } catch (error) {
      console.error("Error getting sorted and filtered trips:", error);
      return [];
    }
  };

  const sortedAndFilteredTrips = safeGetSortedAndFilteredTrips();
  
  // Calculate totals with error handling
  const calculateTotals = () => {
    try {
      return {
        totalMiles: sortedAndFilteredTrips.reduce((sum, trip) => sum + parseFloat(trip.total_miles || 0), 0),
        totalGallons: sortedAndFilteredTrips.reduce((sum, trip) => sum + parseFloat(trip.gallons || 0), 0),
        totalFuelCost: sortedAndFilteredTrips.reduce((sum, trip) => sum + parseFloat(trip.fuel_cost || 0), 0)
      };
    } catch (error) {
      console.error("Error calculating totals:", error);
      return { totalMiles: 0, totalGallons: 0, totalFuelCost: 0 };
    }
  };

  const { totalMiles, totalGallons, totalFuelCost } = calculateTotals();

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown size={14} className="ml-1 text-gray-400" />;
    }
    
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} className="ml-1 text-blue-500" />
    ) : (
      <ArrowDown size={14} className="ml-1 text-blue-500" />
    );
  };

  // Get source badge component
  const SourceBadge = ({ trip }) => {
    if (!trip) return null;
    
    if (trip.mileage_trip_id) {
      return (
        <Link 
          href={`/dashboard/mileage?trip=${trip.mileage_trip_id}`}
          className="inline-flex items-center text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200"
          target="_blank"
        >
          <MapPin size={12} className="mr-1" />
          State Mileage
          <LinkIcon size={10} className="ml-1" />
        </Link>
      );
    } else if (trip.load_id) {
      return (
        <Link 
          href={`/dashboard/dispatching/${trip.load_id}`}
          className="inline-flex items-center text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2 py-1 rounded border border-green-200"
          target="_blank"
        >
          <Truck size={12} className="mr-1" />
          From Load
          <LinkIcon size={10} className="ml-1" />
        </Link>
      );
    } else {
      return (
        <span className="inline-flex items-center text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-200">
          <Plus size={12} className="mr-1" />
          Manual Entry
        </span>
      );
    }
  };

  // Format jurisdiction for display
  const formatJurisdiction = (jurisdictionCode) => {
    return jurisdictionCode || '—';
  };

  // Empty State Component
  const EmptyState = ({ filtered = false }) => (
    <div className="bg-white rounded-lg shadow py-10 px-6 text-center">
      <div className="mx-auto mb-4 flex justify-center">
        <div className="rounded-full bg-gray-100 p-4">
          {filtered ? (
            <Filter size={32} className="text-gray-400" />
          ) : (
            <Truck size={32} className="text-gray-400" />
          )}
        </div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {filtered ? "No matching trips found" : "No trips recorded yet"}
      </h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        {filtered 
          ? "Try adjusting your filters or search criteria to see more results."
          : "Start by adding trips manually or import data from your state mileage tracker or loads."}
      </p>
      
      {filtered && (
        <button
          onClick={() => setFilters({ search: "", jurisdiction: "", vehicle: "", source: "all" })}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Filter size={16} className="mr-2" />
          Clear Filters
        </button>
      )}
      
      {!filtered && (
        <div className="flex flex-col items-center">
          <div className="flex gap-2">
            <div className="inline-flex items-center text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200">
              <MapPin size={12} className="mr-1" />
              State Mileage
            </div>
            <div className="inline-flex items-center text-xs bg-green-50 text-green-600 px-2 py-1 rounded border border-green-200">
              <Truck size={12} className="mr-1" />
              From Load
            </div>
            <div className="inline-flex items-center text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-200">
              <Plus size={12} className="mr-1" />
              Manual Entry
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            IFTA tracks data from multiple sources to ensure accurate reporting
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Truck size={20} className="text-blue-600 mr-2" />
          IFTA Trip Records
        </h3>
        {trips && trips.length > 0 && (
          <span className="text-sm text-gray-500">{trips.length} trip{trips.length !== 1 ? 's' : ''} recorded</span>
        )}
      </div>
      
      {trips && trips.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search input */}
              <div className="flex-1 relative">
                <label htmlFor="search-filter" className="sr-only">Search</label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  id="search-filter"
                  type="text"
                  placeholder="Search trips..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              
              {/* Data source filter */}
              <div className="md:w-48">
                <label htmlFor="source-filter" className="sr-only">Data Source</label>
                <div className="relative">
                  <select
                    id="source-filter"
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={filters.source}
                    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                  >
                    <option value="all">All Sources</option>
                    <option value="mileage">State Mileage</option>
                    <option value="load">Load Import</option>
                    <option value="manual">Manual Entry</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Filter size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
              
              {/* Toggle advanced filters button */}
              <button
                type="button"
                onClick={() => setExpandedFilters(!expandedFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                <Filter size={16} className="mr-1.5" />
                {expandedFilters ? 'Hide Filters' : 'More Filters'}
                <ChevronDown size={16} className={`ml-1 transform transition-transform ${expandedFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Reset filters */}
              <button
                type="button"
                onClick={() => setFilters({ search: "", jurisdiction: "", vehicle: "", source: "all" })}
                className="md:w-24 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Reset
              </button>
            </div>
            
            {/* Advanced filters (expandable) */}
            {expandedFilters && (
              <div className="flex flex-col md:flex-row gap-4 pt-3 border-t border-gray-200">
                {/* Jurisdiction filter */}
                {uniqueJurisdictions.length > 0 && (
                  <div className="md:w-48">
                    <label htmlFor="jurisdiction-filter" className="sr-only">Jurisdiction</label>
                    <div className="relative">
                      <select
                        id="jurisdiction-filter"
                        className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={filters.jurisdiction}
                        onChange={(e) => setFilters({ ...filters, jurisdiction: e.target.value })}
                      >
                        <option value="">All Jurisdictions</option>
                        {uniqueJurisdictions.map((jurisdiction) => (
                          <option key={jurisdiction} value={jurisdiction}>{formatJurisdiction(jurisdiction)}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <MapPin size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Vehicle filter */}
                {uniqueVehicles.length > 0 && (
                  <div className="md:w-48">
                    <label htmlFor="vehicle-filter" className="sr-only">Vehicle</label>
                    <div className="relative">
                      <select
                        id="vehicle-filter"
                        className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={filters.vehicle}
                        onChange={(e) => setFilters({ ...filters, vehicle: e.target.value })}
                      >
                        <option value="">All Vehicles</option>
                        {uniqueVehicles.map((vehicle) => (
                          <option key={vehicle} value={vehicle}>
                            {formatVehicleDisplay(vehicle)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <Truck size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="px-6 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading trip records...</p>
        </div>
      ) : !trips || trips.length === 0 ? (
        <EmptyState filtered={false} />
      ) : sortedAndFilteredTrips.length === 0 ? (
        <EmptyState filtered={true} />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('start_date')}
                >
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    Date
                    {getSortIcon('start_date')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('vehicle_id')}
                >
                  <div className="flex items-center">
                    <Truck size={14} className="mr-1" />
                    Vehicle
                    {getSortIcon('vehicle_id')}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <MapPin size={14} className="mr-1" />
                    Route
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('total_miles')}
                >
                  <div className="flex items-center">
                    Miles
                    {getSortIcon('total_miles')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('gallons')}
                >
                  <div className="flex items-center">
                    <Fuel size={14} className="mr-1" />
                    Gallons
                    {getSortIcon('gallons')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('fuel_cost')}
                >
                  <div className="flex items-center">
                    <DollarSign size={14} className="mr-1" />
                    Fuel Cost
                    {getSortIcon('fuel_cost')}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span>Source</span>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndFilteredTrips.map((trip) => {
                // Skip rendering if trip is null or undefined
                if (!trip) return null;
                
                return (
                  <tr key={trip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trip.start_date}
                      {trip.end_date && trip.end_date !== trip.start_date && 
                        <span className="text-xs text-gray-500 ml-1">to {trip.end_date}</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      {formatVehicleDisplay(trip.vehicle_id)}
                      {trip.driver_id && <div className="text-xs text-gray-400">Driver: {trip.driver_id}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {formatJurisdiction(trip.start_jurisdiction)}
                        </span>
                        <span className="mx-2">→</span>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {formatJurisdiction(trip.end_jurisdiction)}
                        </span>
                      </div>
                      {/* Show load reference if it exists */}
                      {trip.load_id && trip.notes && trip.notes.includes('Load #') && (
                        <div className="text-xs text-gray-400 mt-1">{trip.notes.split(':')[0]}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {parseFloat(trip.total_miles || 0).toLocaleString()} mi
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {parseFloat(trip.gallons || 0).toLocaleString()} gal
                      {trip.gallons === 0 && (
                        <div className="text-xs text-amber-500 flex items-center mt-1">
                          <AlertTriangle size={10} className="mr-1" />
                          Needs update
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${parseFloat(trip.fuel_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {trip.fuel_cost === 0 && (
                        <div className="text-xs text-amber-500 flex items-center mt-1">
                          <AlertTriangle size={10} className="mr-1" />
                          Needs update
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {showSourceBadges && <SourceBadge trip={trip} />}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => trip && onRemoveTrip && onRemoveTrip(trip)}
                        className="text-red-600 hover:text-red-900 focus:outline-none"
                        title="Delete Trip"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Totals
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {totalMiles.toLocaleString()} mi
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {totalGallons.toLocaleString()} gal
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {/* Display source counts - with safety checks */}
                  {showSourceBadges && trips && Array.isArray(trips) && (
                    <div className="flex flex-wrap gap-2">
                      <div className="text-xs inline-flex items-center">
                        <MapPin size={10} className="mr-1 text-blue-600" />
                        {trips.filter(t => t && t.mileage_trip_id).length} from mileage
                      </div>
                      <div className="text-xs inline-flex items-center">
                        <Truck size={10} className="mr-1 text-green-600" />
                        {trips.filter(t => t && t.load_id).length} from loads
                      </div>
                      <div className="text-xs inline-flex items-center">
                        <Plus size={10} className="mr-1 text-purple-600" />
                        {trips.filter(t => t && !t.load_id && !t.mileage_trip_id).length} manual
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      
      {trips && trips.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 text-gray-500 text-xs border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span>
              <Info size={12} className="mr-1 text-blue-500 inline" />
              Trip records are used to calculate your IFTA tax liability by jurisdiction
            </span>
          </div>
        </div>
      )}
    </div>
  );
}