"use client";

import { 
  Truck, 
  Fuel, 
  DollarSign, 
  Calculator, 
  MapPin
} from "lucide-react";

export default function IFTASummary({ trips = [], stats = {}, isLoading = false }) {
  // Format numbers with localization and proper decimal places
  const formatNumber = (value, decimals = 0) => {
    return parseFloat(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Card component for each stat
  const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
      color === 'blue' ? 'border-blue-500' :
      color === 'green' ? 'border-green-500' :
      color === 'yellow' ? 'border-yellow-500' :
      color === 'purple' ? 'border-purple-500' :
      color === 'red' ? 'border-red-500' :
      'border-gray-500'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
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

  // If no stats are provided, show default values
  const {
    totalMiles = 0,
    totalGallons = 0,
    avgMpg = 0,
    fuelCostPerMile = 0,
    uniqueJurisdictions = 0
  } = stats;

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">IFTA Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Distance"
          value={`${formatNumber(totalMiles)} miles`}
          icon={<Truck size={20} />}
          color="blue"
        />
        
        <StatCard
          title="Total Fuel"
          value={`${formatNumber(totalGallons, 3)} gallons`}
          icon={<Fuel size={20} />}
          color="green"
        />
        
        <StatCard
          title="Average MPG"
          value={formatNumber(avgMpg, 2)}
          icon={<Calculator size={20} />}
          color="yellow"
        />
        
        <StatCard
          title="Fuel Cost per Mile"
          value={`$${formatNumber(fuelCostPerMile, 3)}`}
          icon={<DollarSign size={20} />}
          color="red"
        />
        
        <StatCard
          title="Jurisdictions"
          value={uniqueJurisdictions}
          icon={<MapPin size={20} />}
          color="purple"
        />
        
        <StatCard
          title="Total Trips"
          value={trips.length}
          icon={<Truck size={20} />}
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
                Your IFTA tax liability will be determined based on the Net Taxable Gallons for each jurisdiction shown in the table below. Check with your tax professional for current tax rates in each jurisdiction.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                This report includes data from {trips.length} trips across {uniqueJurisdictions} jurisdictions. 
                Average MPG: {formatNumber(avgMpg, 2)}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}