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
  RefreshCw,
  ChevronsUpDown
} from "lucide-react";

export default function TripsList({ trips = [], onRemoveTrip, isLoading = false }) {
  const [filters, setFilters] = useState({
    search: "",
    jurisdiction: "",
    vehicle: ""
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });

  // Get unique values for filter dropdowns
  const getUniqueValues = (key) => {
    return [...new Set(trips.map(trip => {
      // Special case for jurisdictions
      if (key === 'jurisdiction') {
        return [trip.startJurisdiction, trip.endJurisdiction];
      }
      return trip[key];
    }).flat())];
  };

  const uniqueJurisdictions = getUniqueValues('jurisdiction');
  const uniqueVehicles = getUniqueValues('vehicleId');

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
        !(trip.startJurisdiction === filters.jurisdiction || 
          trip.endJurisdiction === filters.jurisdiction)) {
        return false;
      }
      
      // Vehicle filter
      if (filters.vehicle && trip.vehicleId !== filters.vehicle) {
        return false;
      }
      
      return true;
    });
    
    // Then sort
    return filteredTrips.sort((a, b) => {
      // Special case for numeric values
      if (['miles', 'gallons', 'fuelCost'].includes(sortConfig.key)) {
        if (sortConfig.direction === 'asc') {
          return parseFloat(a[sortConfig.key]) - parseFloat(b[sortConfig.key]);
        } else {
          return parseFloat(b[sortConfig.key]) - parseFloat(a[sortConfig.key]);
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
  const totalMiles = sortedAndFilteredTrips.reduce((sum, trip) => sum + parseFloat(trip.miles), 0);
  const totalGallons = sortedAndFilteredTrips.reduce((sum, trip) => sum + parseFloat(trip.gallons), 0);
  const totalFuelCost = sortedAndFilteredTrips.reduce((sum, trip) => sum + parseFloat(trip.fuelCost), 0);

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown size={14} className="ml-1 text-gray-400" />;
    }
    
    return sortConfig.direction === 'asc' ? (
      <span className="ml-1 text-blue-500">↑</span>
    ) : (
      <span className="ml-1 text-blue-500">↓</span>
    );
  };

  // Format jurisdiction for display (extract from parentheses)
  const formatJurisdiction = (jurisdictionCode) => {
    return jurisdictionCode || '—';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Recorded Trips</h3>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-4">Total Trips: {sortedAndFilteredTrips.length}</span>
        </div>
      </div>
      
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
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
                  <Filter size={16} className="text-gray-400" />
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
          
          {/* Reset filters */}
          <div className="md:w-32">
            <button
              type="button"
              onClick={() => setFilters({ search: "", jurisdiction: "", vehicle: "" })}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-500">Loading trips...</p>
          </div>
        ) : trips.length === 0 ? (
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
                  onClick={() => requestSort('date')}
                >
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    Date
                    {getSortIcon('date')}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('vehicleId')}
                >
                  <div className="flex items-center">
                    <Truck size={14} className="mr-1" />
                    Vehicle
                    {getSortIcon('vehicleId')}
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
                  onClick={() => requestSort('miles')}
                >
                  <div className="flex items-center">
                    Miles
                    {getSortIcon('miles')}
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
                  onClick={() => requestSort('fuelCost')}
                >
                  <div className="flex items-center">
                    <DollarSign size={14} className="mr-1" />
                    Fuel Cost
                    {getSortIcon('fuelCost')}
                  </div>
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
                    {trip.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {trip.vehicleId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {formatJurisdiction(trip.startJurisdiction)}
                      </span>
                      <span className="mx-2">→</span>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {formatJurisdiction(trip.endJurisdiction)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {parseFloat(trip.miles).toLocaleString()} mi
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {parseFloat(trip.gallons).toLocaleString()} gal
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${parseFloat(trip.fuelCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}