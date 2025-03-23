"use client";

import { useState } from "react";
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
  CheckCircle
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
    // Apply filters first
    let filteredTrips = trips.filter(trip => {
      // Search filter
      if (filters.search && !Object.values(trip).some(value => 
        String(value).toLowerCase().includes(filters.search.toLowerCase())
      )) {
        return false;
      }
      
      // Jurisdiction filter
      if (filters.jurisdiction && 
        !(trip.start_jurisdiction === filters.jurisdiction || 
          trip.end_jurisdiction === filters.jurisdiction)) {
        return false;
      }
      
      // Vehicle filter
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
    
    // Then sort
    return filteredTrips.sort((a, b) => {
      // Special case for numeric values
      if (['total_miles', 'gallons', 'fuel_cost'].includes(sortConfig.key)) {
        if (sortConfig.direction === 'asc') {
          return parseFloat(a[sortConfig.key] || 0) - parseFloat(b[sortConfig.key] || 0);
        } else {
          return parseFloat(b[sortConfig.key] || 0) - parseFloat(a[sortConfig.key] || 0);
        }
      }
      
      // Default string sort
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const sortedAndFilteredTrips = getSortedAndFilteredTrips();
  
  // Calculate totals
  const totalMiles = sortedAndFilteredTrips.reduce((sum, trip) => sum + parseFloat(trip.total_miles || 0), 0);
  const totalGallons = sortedAndFilteredTrips.reduce((sum, trip) => sum + parseFloat(trip.gallons || 0), 0);
  const totalFuelCost = sortedAndFilteredTrips.reduce((sum, trip) => sum + parseFloat(trip.fuel_cost || 0), 0);

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

  return (
    <div>
      {/* Filters */}
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
                        <option key={vehicle} value={vehicle}>{vehicle}</option>
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
      
      <div className="overflow-x-auto">
        {trips.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No trips recorded yet. Add a trip using the form above.</p>
          </div>
        ) : sortedAndFilteredTrips.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No trips match your filters. Try adjusting your search criteria.</p>
          </div>
        ) : (
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
              {sortedAndFilteredTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.start_date}
                    {trip.end_date && trip.end_date !== trip.start_date && 
                      <span className="text-xs text-gray-500 ml-1">to {trip.end_date}</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {trip.vehicle_id}
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
                      onClick={() => onRemoveTrip(trip)}
                      className="text-red-600 hover:text-red-900 focus:outline-none"
                      title="Delete Trip"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
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
                  {/* Display source counts */}
                  {showSourceBadges && (
                    <div className="flex flex-wrap gap-2">
                      <div className="text-xs inline-flex items-center">
                        <MapPin size={10} className="mr-1 text-blue-600" />
                        {trips.filter(t => t.mileage_trip_id).length} from mileage
                      </div>
                      <div className="text-xs inline-flex items-center">
                        <Truck size={10} className="mr-1 text-green-600" />
                        {trips.filter(t => t.load_id).length} from loads
                      </div>
                      <div className="text-xs inline-flex items-center">
                        <Plus size={10} className="mr-1 text-purple-600" />
                        {trips.filter(t => !t.load_id && !t.mileage_trip_id).length} manual
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}