"use client";

import { 
  Truck, 
  Fuel, 
  DollarSign, 
  Calculator, 
  MapPin, 
  TrendingUp,
  TrendingDown,
  RefreshCw
} from "lucide-react";

export default function IFTASummary({ trips = [], rates = [], stats = {}, isLoading = false }) {
  // Format numbers with localization and proper decimal places
  const formatNumber = (value, decimals = 0) => {
    return parseFloat(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Calculate summaries from trips
  const calculateSummaries = () => {
    if (!trips || trips.length === 0) {
      return {
        totalMiles: 0,
        totalGallons: 0,
        totalFuelCost: 0,
        avgMpg: 0,
        fuelCostPerMile: 0,
        uniqueJurisdictions: 0
      };
    }

    const totalMiles = trips.reduce((sum, trip) => sum + parseFloat(trip.miles || 0), 0);
    const totalGallons = trips.reduce((sum, trip) => sum + parseFloat(trip.gallons || 0), 0);
    const totalFuelCost = trips.reduce((sum, trip) => sum + parseFloat(trip.fuelCost || 0), 0);
    
    // Calculate averages
    const avgMpg = totalGallons > 0 ? totalMiles / totalGallons : 0;
    const fuelCostPerMile = totalMiles > 0 ? totalFuelCost / totalMiles : 0;
    
    // Count unique jurisdictions
    const allJurisdictions = [
      ...trips.map(trip => trip.startJurisdiction),
      ...trips.map(trip => trip.endJurisdiction)
    ].filter(Boolean);
    const uniqueJurisdictions = new Set(allJurisdictions).size;
    
    return {
      totalMiles,
      totalGallons,
      totalFuelCost,
      avgMpg,
      fuelCostPerMile,
      uniqueJurisdictions
    };
  };

  // Either use passed-in stats or calculate from trips
  const summaries = stats && Object.keys(stats).length > 0 
    ? stats 
    : calculateSummaries();

  // Card component for each stat
  const StatCard = ({ title, value, icon, color, trend, trendValue }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
      color === 'blue' ? 'border-blue-500' :
      color === 'green' ? 'border-green-500' :
      color === 'yellow' ? 'border-yellow-500' :
      color === 'purple' ? 'border-purple-500' :
      color === 'red' ? 'border-red-500' :
      'border-gray-500'
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {trend && trendValue !== undefined && (
            <div className="mt-1 flex items-center">
              {trend === 'up' ? (
                <TrendingUp size={14} className="text-green-600" />
              ) : (
                <TrendingDown size={14} className="text-red-600" />
              )}
              <span className={`ml-1 text-xs ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendValue}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-md ${
          color === 'blue' ? 'bg-blue-100 text-blue-600' :
          color === 'green' ? 'bg-green-100 text-green-600' :
          color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
          color === 'purple' ? 'bg-purple-100 text-purple-600' :
          color === 'red' ? 'bg-red-100 text-red-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          {icon}
        </div>
      </div>
    </div>
  );

  // Placeholder for loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(index => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-200 animate-pulse">
            <div className="flex justify-between items-start">
              <div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
                <div className="mt-1 h-6 w-16 bg-gray-300 rounded"></div>
              </div>
              <div className="p-2 rounded-md bg-gray-200 h-8 w-8"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">IFTA Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Distance"
          value={`${formatNumber(summaries.totalMiles)} miles`}
          icon={<Truck size={20} />}
          color="blue"
        />
        
        <StatCard
          title="Total Fuel"
          value={`${formatNumber(summaries.totalGallons, 3)} gallons`}
          icon={<Fuel size={20} />}
          color="green"
        />
        
        <StatCard
          title="Total Fuel Cost"
          value={`${formatNumber(summaries.totalFuelCost, 2)}`}
          icon={<DollarSign size={20} />}
          color="purple"
        />
        
        <StatCard
          title="Average MPG"
          value={formatNumber(summaries.avgMpg, 2)}
          icon={<Calculator size={20} />}
          color="yellow"
        />
        
        <StatCard
          title="Fuel Cost per Mile"
          value={`${formatNumber(summaries.fuelCostPerMile, 3)}`}
          icon={<DollarSign size={20} />}
          color="red"
        />
        
        <StatCard
          title="Jurisdictions"
          value={summaries.uniqueJurisdictions}
          icon={<MapPin size={20} />}
          color="blue"
        />
      </div>
      
      {trips.length > 0 && (
        <div className="mt-6 bg-blue-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <Calculator className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                {rates.length > 0 ? (
                  <>Based on your trips and current tax rates, your estimated IFTA tax liability is <strong className="font-medium">${formatNumber(stats.estimatedTaxLiability || 0, 2)}</strong>.</>
                ) : (
                  <>Your IFTA tax liability will be calculated when tax rate data is available.</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}