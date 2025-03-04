"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import {
  Calculator,
  FileDown,
  Plus,
  Trash2,
  Save,
  ChevronsUpDown,
  Search,
  Filter,
  HelpCircle,
  AlertCircle,
  Info,
  Download,
  Truck,
  Calendar,
  FileText,
  MapPin,
  Fuel,
  DollarSign,
  RefreshCw,
} from "lucide-react";

// Component for displaying the sidebar navigation
const Sidebar = ({ activePage = "ifta" }) => {
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg></div> },
    { name: 'Dispatching', href: '/dashboard/dispatching', icon: <Truck size={18} /> },
    { name: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={18} /> },
    { name: 'IFTA Calculator', href: '/dashboard/ifta', icon: <Calculator size={18} /> },
  ];

  return (
    <div className="hidden md:flex w-64 flex-col bg-white shadow-lg">
      <div className="p-4 border-b">
        <Image 
          src="/images/tc-name-tp-bg.png" 
          alt="Truck Command Logo"
          width={150}
          height={50}
          className="h-10"
        />
      </div>
      
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                activePage === item.name.toLowerCase() 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

// IFTA Tax Rate Table Component
const IFTARatesTable = ({ rates }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Current IFTA Tax Rates</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jurisdiction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate ($ per gallon)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Surcharge
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rates.map((rate, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {rate.jurisdiction}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${rate.rate.toFixed(3)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${rate.surcharge.toFixed(3)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${rate.totalRate.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Trip Entry Form Component
const TripEntryForm = ({ onAddTrip }) => {
  const [tripData, setTripData] = useState({
    date: "",
    vehicleId: "",
    startJurisdiction: "",
    endJurisdiction: "",
    miles: "",
    gallons: "",
    fuelCost: ""
  });

  const jurisdictions = [
    "Alabama (AL)", "Alaska (AK)", "Arizona (AZ)", "Arkansas (AR)", "California (CA)",
    "Colorado (CO)", "Connecticut (CT)", "Delaware (DE)", "Florida (FL)", "Georgia (GA)",
    "Idaho (ID)", "Illinois (IL)", "Indiana (IN)", "Iowa (IA)", "Kansas (KS)",
    "Kentucky (KY)", "Louisiana (LA)", "Maine (ME)", "Maryland (MD)", "Massachusetts (MA)",
    "Michigan (MI)", "Minnesota (MN)", "Mississippi (MS)", "Missouri (MO)", "Montana (MT)",
    "Nebraska (NE)", "Nevada (NV)", "New Hampshire (NH)", "New Jersey (NJ)", "New Mexico (NM)",
    "New York (NY)", "North Carolina (NC)", "North Dakota (ND)", "Ohio (OH)", "Oklahoma (OK)",
    "Oregon (OR)", "Pennsylvania (PA)", "Rhode Island (RI)", "South Carolina (SC)", "South Dakota (SD)",
    "Tennessee (TN)", "Texas (TX)", "Utah (UT)", "Vermont (VT)", "Virginia (VA)",
    "Washington (WA)", "West Virginia (WV)", "Wisconsin (WI)", "Wyoming (WY)",
    "Alberta (AB)", "British Columbia (BC)", "Manitoba (MB)", "New Brunswick (NB)",
    "Newfoundland (NL)", "Nova Scotia (NS)", "Ontario (ON)", "Prince Edward Island (PE)",
    "Quebec (QC)", "Saskatchewan (SK)"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTripData({
      ...tripData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTrip({
      ...tripData,
      miles: parseFloat(tripData.miles) || 0,
      gallons: parseFloat(tripData.gallons) || 0,
      fuelCost: parseFloat(tripData.fuelCost) || 0,
      id: Date.now() // Simple unique ID
    });
    // Reset form
    setTripData({
      date: "",
      vehicleId: "",
      startJurisdiction: "",
      endJurisdiction: "",
      miles: "",
      gallons: "",
      fuelCost: ""
    });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Add New Trip</h3>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={tripData.date}
                onChange={handleChange}
                className="bg-gray-300 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700">Vehicle ID</label>
              <input
                type="text"
                id="vehicleId"
                name="vehicleId"
                placeholder="Enter truck/vehicle ID"
                value={tripData.vehicleId}
                onChange={handleChange}
                className="bg-gray-300 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startJurisdiction" className="block text-sm font-medium text-gray-700">Starting Jurisdiction</label>
              <select
                id="startJurisdiction"
                name="startJurisdiction"
                value={tripData.startJurisdiction}
                onChange={handleChange}
                className="bg-gray-300 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Select Jurisdiction</option>
                {jurisdictions.map((j) => (
                  <option key={`start-${j}`} value={j}>{j}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="endJurisdiction" className="block text-sm font-medium text-gray-700">Ending Jurisdiction</label>
              <select
                id="endJurisdiction"
                name="endJurisdiction"
                value={tripData.endJurisdiction}
                onChange={handleChange}
                className="bg-gray-300 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Select Jurisdiction</option>
                {jurisdictions.map((j) => (
                  <option key={`end-${j}`} value={j}>{j}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="miles" className="block text-sm font-medium text-gray-700">Miles Driven</label>
              <input
                type="number"
                id="miles"
                name="miles"
                placeholder="0.0"
                min="0"
                step="0.1"
                value={tripData.miles}
                onChange={handleChange}
                className="bg-gray-300 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="gallons" className="block text-sm font-medium text-gray-700">Gallons Purchased</label>
              <input
                type="number"
                id="gallons"
                name="gallons"
                placeholder="0.0"
                min="0"
                step="0.1"
                value={tripData.gallons}
                onChange={handleChange}
                className="bg-gray-300 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="fuelCost" className="block text-sm font-medium text-gray-700">Fuel Cost ($)</label>
              <input
                type="number"
                id="fuelCost"
                name="fuelCost"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={tripData.fuelCost}
                onChange={handleChange}
                className="bg-gray-300 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              <Plus size={16} className="mr-2" />
              Add Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Trip List Component
const TripsList = ({ trips, onRemoveTrip }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Recorded Trips</h3>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Total Trips: {trips.length}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        {trips.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No trips recorded yet. Add a trip using the form above.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Miles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gallons
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fuel Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.vehicleId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {trip.startJurisdiction} → {trip.endJurisdiction}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {trip.miles.toLocaleString()} mi
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {trip.gallons.toLocaleString()} gal
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${trip.fuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onRemoveTrip(trip.id)}
                      className="text-red-600 hover:text-red-900"
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
    </div>
  );
};

// IFTA Summary Component
const IFTASummary = ({ trips, rates }) => {
  // Calculate totals
  const totalMiles = trips.reduce((sum, trip) => sum + trip.miles, 0);
  const totalGallons = trips.reduce((sum, trip) => sum + trip.gallons, 0);
  const totalFuelCost = trips.reduce((sum, trip) => sum + trip.fuelCost, 0);
  
  // Calculate MPG
  const mpg = totalMiles > 0 && totalGallons > 0 ? totalMiles / totalGallons : 0;
  
  // Calculate cost per mile
  const costPerMile = totalMiles > 0 && totalFuelCost > 0 ? totalFuelCost / totalMiles : 0;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">IFTA Summary</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center">
              <Truck size={20} className="text-blue-500 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">Total Miles</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {totalMiles.toLocaleString()} mi
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center">
              <Fuel size={20} className="text-green-500 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">Total Gallons</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {totalGallons.toLocaleString()} gal
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center">
              <DollarSign size={20} className="text-purple-500 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">Total Fuel Cost</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <div className="flex items-center">
              <Calculator size={20} className="text-yellow-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">Average MPG</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {mpg.toFixed(2)} miles/gallon
            </p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
            <div className="flex items-center">
              <Calculator size={20} className="text-red-500 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">Fuel Cost per Mile</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${costPerMile.toFixed(3)}/mile
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-4">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
            <FileDown size={16} className="mr-2" />
            Export Summary
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
            <Save size={16} className="mr-2" />
            Save Report
          </button>
        </div>
      </div>
    </div>
  );
};

// Main IFTA Calculator Page Component
export default function IFTACalculatorPage() {
  const [trips, setTrips] = useState([]);
  const [rates, setRates] = useState([
    { jurisdiction: "Alabama (AL)", rate: 0.290, surcharge: 0.000, totalRate: 0.290 },
    { jurisdiction: "Arizona (AZ)", rate: 0.260, surcharge: 0.010, totalRate: 0.270 },
    { jurisdiction: "Arkansas (AR)", rate: 0.285, surcharge: 0.005, totalRate: 0.290 },
    { jurisdiction: "California (CA)", rate: 0.668, surcharge: 0.000, totalRate: 0.668 },
    { jurisdiction: "Colorado (CO)", rate: 0.220, surcharge: 0.000, totalRate: 0.220 },
    { jurisdiction: "Florida (FL)", rate: 0.350, surcharge: 0.000, totalRate: 0.350 }
  ]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeQuarter, setActiveQuarter] = useState("2025-Q1");

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        if (user) {
          setUser(user);
          // In a real app, you would fetch saved trips and IFTA data here
          // fetchIFTAData(user.id);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getUser();
  }, []);

  const handleAddTrip = (newTrip) => {
    setTrips([...trips, newTrip]);
  };

  const handleRemoveTrip = (tripId) => {
    setTrips(trips.filter(trip => trip.id !== tripId));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activePage="ifta calculator" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">IFTA Tax Calculator</h1>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={activeQuarter}
                onChange={(e) => setActiveQuarter(e.target.value)}
                className="pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="2025-Q1">2025 - Q1 (Jan-Mar)</option>
                <option value="2024-Q4">2024 - Q4 (Oct-Dec)</option>
                <option value="2024-Q3">2024 - Q3 (Jul-Sep)</option>
                <option value="2024-Q2">2024 - Q2 (Apr-Jun)</option>
                <option value="2024-Q1">2024 - Q1 (Jan-Mar)</option>
              </select>
            </div>
            
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <RefreshCw size={16} className="mr-2" />
              Update Rates
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Use this calculator to track your mileage and fuel purchases by jurisdiction for IFTA reporting. 
                    Keep your records up-to-date for easier quarterly filings.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Trip Entry Form */}
            <TripEntryForm onAddTrip={handleAddTrip} />
            
            {/* Trips List */}
            <TripsList trips={trips} onRemoveTrip={handleRemoveTrip} />
            
            {/* IFTA Summary */}
            <IFTASummary trips={trips} rates={rates} />
            
            {/* IFTA Tax Rates */}
            <IFTARatesTable rates={rates} />
          </div>
        </main>
      </div>
    </div>
  );
}