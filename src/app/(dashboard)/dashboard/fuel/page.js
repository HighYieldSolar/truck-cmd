"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, 
  Truck, 
  FileText, 
  Wallet, 
  Users, 
  Package, 
  CheckCircle, 
  Calculator, 
  Fuel, 
  Settings,
  LogOut,
  Bell, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2,
  Calendar,
  X,
  AlertCircle,
  DollarSign,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  CreditCard,
  RefreshCw,
  Download,
  Upload,
  Map,
  FileImage,
  ZoomIn,
  Maximize2,
  BarChart2,
  PieChart,
  TrendingUp,
  Flag,
  Eye
} from "lucide-react";

// Navigation Sidebar Component
const Sidebar = ({ activePage = "fuel tracker" }) => {
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Dispatching', href: '/dashboard/dispatching', icon: <Truck size={18} /> },
    { name: 'Invoices', href: '/dashboard/invoices', icon: <FileText size={18} /> },
    { name: 'Expenses', href: '/dashboard/expenses', icon: <Wallet size={18} /> },
    { name: 'Customers', href: '/dashboard/customers', icon: <Users size={18} /> },
    { name: 'Fleet', href: '/dashboard/fleet', icon: <Package size={18} /> },
    { name: 'Compliance', href: '/dashboard/compliance', icon: <CheckCircle size={18} /> },
    { name: 'IFTA Calculator', href: '/dashboard/ifta', icon: <Calculator size={18} /> },
    { name: 'Fuel Tracker', href: '/dashboard/fuel', icon: <Fuel size={18} /> },
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
        
        <div className="pt-4 mt-4 border-t">
          <Link 
            href="/dashboard/settings" 
            className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md hover:text-blue-600 transition-colors"
          >
            <Settings size={18} className="mr-3" />
            <span>Settings</span>
          </Link>
          <button 
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md hover:text-blue-600 transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// Fuel Stats Card Component
const FuelStatsCard = ({ title, value, subValue, icon, color }) => {
  const bgColorClass = `bg-${color}-50`;
  const textColorClass = `text-${color}-600`;
  const iconBgColorClass = `bg-${color}-100`;
  
  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className={`${iconBgColorClass} p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline mb-2">
        <h2 className="text-2xl font-bold">{value}</h2>
      </div>
      {subValue && (
        <div className="text-sm text-gray-500">{subValue}</div>
      )}
    </div>
  );
};

// US State Selector Component
const StateSelector = ({ value, onChange }) => {
  const states = [
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
    { code: "WY", name: "Wyoming" }
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">Select State</option>
      {states.map((state) => (
        <option key={state.code} value={state.code}>
          {state.name} ({state.code})
        </option>
      ))}
    </select>
  );
};

// Fuel Entry Item Component
const FuelEntryItem = ({ fuelEntry, onEdit, onDelete, onViewReceipt }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{fuelEntry.state_name} ({fuelEntry.state})</div>
        <div className="text-sm text-gray-500">{fuelEntry.location}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{new Date(fuelEntry.date).toLocaleDateString()}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{fuelEntry.gallons.toFixed(3)} gal</div>
        <div className="text-sm text-gray-500">${fuelEntry.price_per_gallon.toFixed(3)}/gal</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">${fuelEntry.total_amount.toFixed(2)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{fuelEntry.vehicle_id}</div>
        {fuelEntry.odometer && (
          <div className="text-sm text-gray-500">{fuelEntry.odometer.toLocaleString()} mi</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {fuelEntry.receipt_image ? (
          <div className="flex items-center">
            <button 
              onClick={() => onViewReceipt(fuelEntry)} 
              className="flex items-center text-blue-600 hover:text-blue-900"
            >
              <FileImage size={16} className="mr-1" />
              <span>View</span>
            </button>
          </div>
        ) : (
          <span className="text-sm text-gray-500">No receipt</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button 
          onClick={() => onEdit(fuelEntry)} 
          className="text-blue-600 hover:text-blue-900 mr-3"
        >
          <Edit size={16} />
        </button>
        <button 
          onClick={() => onDelete(fuelEntry.id)} 
          className="text-red-600 hover:text-red-900"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

// Fuel Entry Form Modal Component
const FuelEntryFormModal = ({ isOpen, onClose, fuelEntry, onSave }) => {
  const [formData, setFormData] = useState({
    date: '',
    state: '',
    location: '',
    gallons: '',
    price_per_gallon: '',
    total_amount: '',
    vehicle_id: '',
    odometer: '',
    fuel_type: 'Diesel',
    notes: '',
    receipt_image: null,
    receipt_file: null,
    receipt_preview: null
  });

  const [calculationMode, setCalculationMode] = useState('total');

  useEffect(() => {
    if (fuelEntry) {
      setFormData({
        ...fuelEntry,
        // Format date to YYYY-MM-DD for the date input
        date: fuelEntry.date ? new Date(fuelEntry.date).toISOString().split('T')[0] : '',
        gallons: fuelEntry.gallons.toString(),
        price_per_gallon: fuelEntry.price_per_gallon.toString(),
        total_amount: fuelEntry.total_amount.toString(),
        odometer: fuelEntry.odometer ? fuelEntry.odometer.toString() : '',
        receipt_preview: fuelEntry.receipt_image
      });
    } else {
      // Reset form for new fuel entry
      setFormData({
        date: new Date().toISOString().split('T')[0], // Today's date
        state: '',
        location: '',
        gallons: '',
        price_per_gallon: '',
        total_amount: '',
        vehicle_id: '',
        odometer: '',
        fuel_type: 'Diesel',
        notes: '',
        receipt_image: null,
        receipt_file: null,
        receipt_preview: null
      });
      setCalculationMode('total');
    }
  }, [fuelEntry, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files && files[0]) {
      const file = files[0];
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      
      setFormData({
        ...formData,
        receipt_file: file,
        receipt_preview: previewUrl
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Auto-calculate total amount or price per gallon
      if (name === 'gallons' || name === 'price_per_gallon' || name === 'total_amount') {
        const gallons = parseFloat(name === 'gallons' ? value : formData.gallons) || 0;
        const pricePerGallon = parseFloat(name === 'price_per_gallon' ? value : formData.price_per_gallon) || 0;
        const totalAmount = parseFloat(name === 'total_amount' ? value : formData.total_amount) || 0;
        
        if (calculationMode === 'total' && gallons > 0 && pricePerGallon > 0) {
          // Calculate total from gallons and price per gallon
          const calculatedTotal = (gallons * pricePerGallon).toFixed(2);
          setFormData(current => ({
            ...current,
            total_amount: calculatedTotal
          }));
        } else if (calculationMode === 'price' && gallons > 0 && totalAmount > 0) {
          // Calculate price per gallon from total and gallons
          const calculatedPrice = (totalAmount / gallons).toFixed(3);
          setFormData(current => ({
            ...current,
            price_per_gallon: calculatedPrice
          }));
        }
      }
    }
  };

  // Toggle calculation mode between total and price per gallon
  const toggleCalculationMode = () => {
    setCalculationMode(calculationMode === 'total' ? 'price' : 'total');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In a real app, you would upload the receipt image to storage
    // and get back a URL to store in the database
    const fuelEntryToSave = {
      ...formData,
      gallons: parseFloat(formData.gallons),
      price_per_gallon: parseFloat(formData.price_per_gallon),
      total_amount: parseFloat(formData.total_amount),
      odometer: formData.odometer ? parseFloat(formData.odometer) : null,
      // For now, we'll just use the preview URL for the receipt_image
      // In a real app, this would be the URL from your storage
      receipt_image: formData.receipt_preview
    };
    
    onSave(fuelEntryToSave);
  };

  // Get state name from state code
  const getStateName = (stateCode) => {
    const states = {
      "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
      "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
      "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
      "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
      "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
      "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
      "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
      "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
      "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
      "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"
    };
    return states[stateCode] || "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {fuelEntry ? "Edit Fuel Purchase" : "Add New Fuel Purchase"}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <StateSelector 
                  value={formData.state}
                  onChange={(value) => {
                    setFormData({
                      ...formData,
                      state: value,
                      state_name: getStateName(value)
                    });
                  }}
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location/Station *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  placeholder="E.g., Flying J Truck Stop"
                  value={formData.location}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="gallons" className="block text-sm font-medium text-gray-700 mb-1">
                  Gallons *
                </label>
                <input
                  type="number"
                  id="gallons"
                  name="gallons"
                  placeholder="0.000"
                  step="0.001"
                  min="0"
                  value={formData.gallons}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price_per_gallon" className="block text-sm font-medium text-gray-700 mb-1">
                    Price/Gallon *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      id="price_per_gallon"
                      name="price_per_gallon"
                      placeholder="0.000"
                      step="0.001"
                      min="0"
                      value={formData.price_per_gallon}
                      onChange={handleChange}
                      className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                      required={calculationMode === 'total'}
                      disabled={calculationMode === 'price'}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      id="total_amount"
                      name="total_amount"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={formData.total_amount}
                      onChange={handleChange}
                      className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                      required={calculationMode === 'price'}
                      disabled={calculationMode === 'total'}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={toggleCalculationMode}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Switch to {calculationMode === 'total' ? 'calculate price per gallon' : 'calculate total amount'}
                </button>
              </div>
              
              <div>
                <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle ID *
                </label>
                <input
                  type="text"
                  id="vehicle_id"
                  name="vehicle_id"
                  placeholder="E.g., Truck-101"
                  value={formData.vehicle_id}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="odometer" className="block text-sm font-medium text-gray-700 mb-1">
                  Odometer Reading
                </label>
                <input
                  type="number"
                  id="odometer"
                  name="odometer"
                  placeholder="Current mileage"
                  min="0"
                  value={formData.odometer}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Type
                </label>
                <select
                  id="fuel_type"
                  name="fuel_type"
                  value={formData.fuel_type}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="Gasoline">Gasoline</option>
                  <option value="DEF">DEF</option>
                  <option value="CNG">CNG</option>
                  <option value="LNG">LNG</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  placeholder="Any additional information"
                  value={formData.notes}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
            </div>
            
            {/* Right Column - Receipt Upload and Preview */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt Image
                </label>
                <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="receipt_image"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <input
                          id="receipt_image"
                          name="receipt_image"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Receipt Preview */}
              {formData.receipt_preview && (
                <div className="border rounded-md p-4">
                  <div className="mb-2 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-700">Receipt Preview</h3>
                    {/* Expand/Zoom button would open a modal with larger image */}
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                  <div className="relative aspect-[3/4] max-h-96 overflow-hidden bg-gray-100 rounded-md flex items-center justify-center">
                    <image
                      src={formData.receipt_preview}
                      alt="Receipt preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              )}
              
              {/* Receipt Upload Instructions */}
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Receipt Upload Tips:</h3>
                <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                  <li>Take clear, well-lit photos of receipts</li>
                  <li>Ensure the total amount, gallons, and price are visible</li>
                  <li>Include the station name and location</li>
                  <li>Keep receipts for at least 4 years for IFTA audits</li>
                </ul>
              </div>
              
              {/* IFTA Information */}
              <div className="bg-yellow-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">IFTA Reporting Information:</h3>
                <p className="text-sm text-yellow-700 mb-2">
                  This fuel purchase will be included in your IFTA quarterly reports. Accurate state information is critical for proper tax reporting.
                </p>
                <p className="text-sm text-yellow-700">
                  Current IFTA Quarter: Q1 2025 (Jan-Mar)
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {fuelEntry ? "Update Fuel Entry" : "Save Fuel Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Receipt Viewer Modal Component
const ReceiptViewerModal = ({ isOpen, onClose, receipt }) => {
  if (!isOpen || !receipt) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Fuel Receipt - {receipt.location}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100">
          <image 
            src={receipt.receipt_image} 
            alt="Fuel receipt" 
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
        
        <div className="border-t p-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Date:</p>
              <p>{new Date(receipt.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">State:</p>
              <p>{receipt.state_name} ({receipt.state})</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Gallons:</p>
              <p>{receipt.gallons.toFixed(3)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Total:</p>
              <p>${receipt.total_amount.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, fuelEntryLocation }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-center mb-4 text-red-600">
          <AlertCircle size={48} />
        </div>
        <h3 className="text-lg font-medium text-center text-gray-900 mb-2">
          Delete Fuel Entry
        </h3>
        <p className="text-center text-gray-500 mb-6">
          Are you sure you want to delete fuel purchase from &quot;<strong>{fuelEntryLocation}</strong>&quot;? This action cannot be undone.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// State Summary Component
const StateSummary = ({ fuelData }) => {
  // Group and calculate fuel by state
  const stateData = fuelData.reduce((acc, entry) => {
    if (!acc[entry.state]) {
      acc[entry.state] = {
        state: entry.state,
        state_name: entry.state_name,
        gallons: 0,
        amount: 0,
        purchases: 0
      };
    }
    
    acc[entry.state].gallons += entry.gallons;
    acc[entry.state].amount += entry.total_amount;
    acc[entry.state].purchases += 1;
    
    return acc;
  }, {});
  
  // Convert to array and sort by gallons (descending)
  const stateArray = Object.values(stateData).sort((a, b) => b.gallons - a.gallons);
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Fuel by State</h3>
        <div>
          <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            <Download size={14} className="mr-1" />
            Export for IFTA
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gallons
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchases
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg. Price/Gal
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stateArray.map((state) => (
              <tr key={state.state} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Flag size={16} className="text-gray-400 mr-2" />
                    <div className="text-sm font-medium text-gray-900">
                      {state.state_name} ({state.state})
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{state.gallons.toFixed(3)} gal</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">${state.amount.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{state.purchases}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ${(state.amount / state.gallons).toFixed(3)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main Fuel Tracker Page Component
export default function FuelTrackerPage() {
  const [user, setUser] = useState(null);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('This Quarter');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [currentFuelEntry, setCurrentFuelEntry] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fuelEntryToDelete, setFuelEntryToDelete] = useState(null);
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  
  // Sample fuel entry data for demonstration
  const sampleFuelEntries = [
    {
      id: 1,
      date: "2025-02-28",
      state: "TX",
      state_name: "Texas",
      location: "Flying J Truck Stop - Dallas",
      gallons: 125.789,
      price_per_gallon: 3.699,
      total_amount: 465.29,
      vehicle_id: "TRK-103",
      odometer: 145872,
      fuel_type: "Diesel",
      notes: "Full tank fill-up",
      receipt_image: "https://via.placeholder.com/300x400?text=Receipt+1"
    },
    {
      id: 2,
      date: "2025-02-25",
      state: "OK",
      state_name: "Oklahoma",
      location: "Love's Travel Stop - Oklahoma City",
      gallons: 98.456,
      price_per_gallon: 3.599,
      total_amount: 354.34,
      vehicle_id: "TRK-101",
      odometer: 139564,
      fuel_type: "Diesel",
      notes: "",
      receipt_image: "https://via.placeholder.com/300x400?text=Receipt+2"
    },
    {
      id: 3,
      date: "2025-02-22",
      state: "AR",
      state_name: "Arkansas",
      location: "Pilot Travel Center - Little Rock",
      gallons: 112.345,
      price_per_gallon: 3.649,
      total_amount: 410.05,
      vehicle_id: "TRK-102",
      odometer: 152387,
      fuel_type: "Diesel",
      notes: "Added DEF fluid as well",
      receipt_image: "https://via.placeholder.com/300x400?text=Receipt+3"
    },
    {
      id: 4,
      date: "2025-02-18",
      state: "TX",
      state_name: "Texas",
      location: "TA Travel Center - Houston",
      gallons: 118.632,
      price_per_gallon: 3.719,
      total_amount: 441.18,
      vehicle_id: "TRK-103",
      odometer: 145122,
      fuel_type: "Diesel",
      notes: "",
      receipt_image: null
    },
    {
      id: 5,
      date: "2025-02-15",
      state: "LA",
      state_name: "Louisiana",
      location: "Petro Stopping Center - Shreveport",
      gallons: 105.875,
      price_per_gallon: 3.679,
      total_amount: 389.51,
      vehicle_id: "TRK-101",
      odometer: 138765,
      fuel_type: "Diesel",
      notes: "",
      receipt_image: "https://via.placeholder.com/300x400?text=Receipt+5"
    },
    {
      id: 6,
      date: "2025-02-12",
      state: "MS",
      state_name: "Mississippi",
      location: "Chevron Truck Stop - Jackson",
      gallons: 95.452,
      price_per_gallon: 3.729,
      total_amount: 355.94,
      vehicle_id: "TRK-102",
      odometer: 151604,
      fuel_type: "Diesel",
      notes: "Truck maintenance scheduled for next week",
      receipt_image: "https://via.placeholder.com/300x400?text=Receipt+6"
    }
  ];

  useEffect(() => {
    async function getData() {
      try {
        setLoading(true);
        
        // Get user information
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }
        
        if (user) {
          setUser(user);
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Set sample data
          setFuelEntries(sampleFuelEntries);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    getData();
  }, []);

  // Calculate fuel summaries
  const calculateSummaries = () => {
    const totalGallons = fuelEntries.reduce((sum, entry) => sum + entry.gallons, 0);
    const totalAmount = fuelEntries.reduce((sum, entry) => sum + entry.total_amount, 0);
    const avgPricePerGallon = totalGallons > 0 ? totalAmount / totalGallons : 0;
    
    // Count unique states
    const uniqueStates = new Set(fuelEntries.map(entry => entry.state)).size;
    
    return {
      totalGallons,
      totalAmount,
      avgPricePerGallon,
      uniqueStates,
      entryCount: fuelEntries.length
    };
  };

  const summaries = calculateSummaries();

  // Filter fuel entries based on search term and filters
  const filteredFuelEntries = fuelEntries.filter(entry => {
    const matchesSearch = 
      entry.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.vehicle_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = stateFilter === '' || entry.state === stateFilter;
    const matchesVehicle = vehicleFilter === '' || entry.vehicle_id === vehicleFilter;
    
    let matchesDate = true;
    if (dateFilter === 'This Quarter') {
      const entryDate = new Date(entry.date);
      const now = new Date();
      // Simple quarter calculation
      const entryQuarter = Math.floor(entryDate.getMonth() / 3);
      const currentQuarter = Math.floor(now.getMonth() / 3);
      matchesDate = entryQuarter === currentQuarter && 
                    entryDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'Last Quarter') {
      const entryDate = new Date(entry.date);
      const now = new Date();
      let lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      let yearOfLastQuarter = now.getFullYear();
      
      if (lastQuarter < 0) {
        lastQuarter = 3; // Q4 of previous year
        yearOfLastQuarter -= 1;
      }
      
      const entryQuarter = Math.floor(entryDate.getMonth() / 3);
      matchesDate = entryQuarter === lastQuarter && 
                    entryDate.getFullYear() === yearOfLastQuarter;
    } else if (dateFilter === 'Custom' && dateRange.start && dateRange.end) {
      const entryDate = new Date(entry.date);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDate = entryDate >= startDate && entryDate <= endDate;
    }
    
    return matchesSearch && matchesState && matchesVehicle && matchesDate;
  });

  // Get unique vehicles for filter
  const vehicles = [...new Set(fuelEntries.map(entry => entry.vehicle_id))];

  // Handle fuel entry form submission
  const handleSaveFuelEntry = (formData) => {
    if (currentFuelEntry) {
      // Update existing fuel entry
      const updatedFuelEntries = fuelEntries.map(e => 
        e.id === currentFuelEntry.id ? { ...formData, id: e.id } : e
      );
      setFuelEntries(updatedFuelEntries);
    } else {
      // Add new fuel entry
      const newFuelEntry = {
        ...formData,
        id: Math.max(0, ...fuelEntries.map(e => e.id)) + 1 // Generate a new ID
      };
      setFuelEntries([...fuelEntries, newFuelEntry]);
    }
    
    // Close modal and reset current fuel entry
    setFormModalOpen(false);
    setCurrentFuelEntry(null);
  };

  // Handle fuel entry edit
  const handleEditFuelEntry = (entry) => {
    setCurrentFuelEntry(entry);
    setFormModalOpen(true);
  };

  // Handle fuel entry delete
  const handleDeleteFuelEntry = (id) => {
    const entryToRemove = fuelEntries.find(e => e.id === id);
    setFuelEntryToDelete(entryToRemove);
    setDeleteModalOpen(true);
  };

  // Confirm fuel entry deletion
  const confirmDeleteFuelEntry = () => {
    if (fuelEntryToDelete) {
      const updatedFuelEntries = fuelEntries.filter(e => e.id !== fuelEntryToDelete.id);
      setFuelEntries(updatedFuelEntries);
      setDeleteModalOpen(false);
      setFuelEntryToDelete(null);
    }
  };

  // Handle opening receipt viewer
  const handleViewReceipt = (entry) => {
    setSelectedReceipt(entry);
    setReceiptViewerOpen(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Handle date filter change
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    
    // If "Custom" is selected, keep the current date range
    // Otherwise, reset it
    if (value !== 'Custom') {
      setDateRange({
        start: '',
        end: ''
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activePage="fuel tracker" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-white shadow-sm">
          <button className="md:hidden p-2 text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="relative flex-1 max-w-md mx-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search fuel entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <button className="p-2 text-gray-600 hover:text-blue-600 mx-2 relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </button>
            
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            
            <div className="relative">
              <button className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-2">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block">{user?.user_metadata?.full_name?.split(' ')[0] || 'User'}</span>
                <ChevronDown size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Fuel Tracker</h1>
                <p className="text-gray-600">Track fuel purchases by state for IFTA reporting</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button
                  onClick={() => {
                    setCurrentFuelEntry(null);
                    setFormModalOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  <Plus size={16} className="mr-2" />
                  Add Fuel Purchase
                </button>
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
                >
                  <Download size={16} className="mr-2" />
                  Export IFTA Data
                </button>
              </div>
            </div>

            {/* Fuel Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <FuelStatsCard 
                title="Total Gallons" 
                value={`${summaries.totalGallons.toFixed(3)} gal`} 
                subValue="This quarter"
                icon={<Fuel size={20} className="text-yellow-600" />} 
                color="yellow"
              />
              <FuelStatsCard 
                title="Total Spent" 
                value={`$${summaries.totalAmount.toFixed(2)}`} 
                subValue="This quarter"
                icon={<DollarSign size={20} className="text-green-600" />} 
                color="green"
              />
              <FuelStatsCard 
                title="Average Price" 
                value={`$${summaries.avgPricePerGallon.toFixed(3)}/gal`} 
                subValue={`${summaries.uniqueStates} states tracked`}
                icon={<TrendingUp size={20} className="text-blue-600" />} 
                color="blue"
              />
              <FuelStatsCard 
                title="IFTA Status" 
                value="On Track" 
                subValue="Q1 2025 (Jan-Mar)"
                icon={<CheckCircle size={20} className="text-purple-600" />} 
                color="purple"
              />
            </div>

            {/* Filters */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 flex flex-col space-y-2">
                  <label htmlFor="state-filter" className="text-sm font-medium text-gray-700">
                    State
                  </label>
                  <StateSelector 
                    value={stateFilter}
                    onChange={setStateFilter}
                  />
                </div>
                
                <div className="flex-1 flex flex-col space-y-2">
                  <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
                    Date Range
                  </label>
                  <select
                    id="date-filter"
                    value={dateFilter}
                    onChange={(e) => handleDateFilterChange(e.target.value)}
                    className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                  >
                    <option value="All">All Time</option>
                    <option value="This Quarter">This Quarter</option>
                    <option value="Last Quarter">Last Quarter</option>
                    <option value="Custom">Custom Range</option>
                  </select>
                </div>
                
                {dateFilter === 'Custom' && (
                  <div className="flex-1 flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Custom Range
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="block flex-1 pl-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="block flex-1 pl-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex-1 flex flex-col space-y-2">
                  <label htmlFor="vehicle-filter" className="text-sm font-medium text-gray-700">
                    Vehicle
                  </label>
                  <select
                    id="vehicle-filter"
                    value={vehicleFilter}
                    onChange={(e) => setVehicleFilter(e.target.value)}
                    className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                  >
                    <option value="">All Vehicles</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle} value={vehicle}>{vehicle}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-none flex md:items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStateFilter('');
                      setDateFilter('This Quarter');
                      setVehicleFilter('');
                      setDateRange({ start: '', end: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <RefreshCw size={16} className="mr-2 inline-block" />
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
                
            {/* State Summary (per-state totals for IFTA) */}
            {filteredFuelEntries.length > 0 && (
              <div className="mb-6">
                <StateSummary fuelData={filteredFuelEntries} />
              </div>
            )}
            
            {/* Fuel Entries Table */}
            <div className="bg-white shadow overflow-hidden rounded-md">
              <div className="overflow-x-auto">
                {filteredFuelEntries.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                      <Fuel size={28} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No fuel entries found</h3>
                    <p className="text-gray-500 mb-6">
                      {searchTerm || stateFilter || vehicleFilter || dateFilter !== 'This Quarter' 
                        ? "Try adjusting your search or filters." 
                        : "You haven't recorded any fuel purchases yet."}
                    </p>
                    {!searchTerm && !stateFilter && !vehicleFilter && dateFilter === 'This Quarter' && (
                      <button
                        onClick={() => {
                          setCurrentFuelEntry(null);
                          setFormModalOpen(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      >
                        <Plus size={16} className="mr-2" />
                        Record Your First Fuel Purchase
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gallons
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Receipt
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredFuelEntries.map(entry => (
                        <FuelEntryItem 
                          key={entry.id} 
                          fuelEntry={entry} 
                          onEdit={handleEditFuelEntry}
                          onDelete={handleDeleteFuelEntry}
                          onViewReceipt={handleViewReceipt}
                        />
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="2" className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          Total ({filteredFuelEntries.length} entries)
                        </td>
                        <td className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          {filteredFuelEntries.reduce((sum, entry) => sum + entry.gallons, 0).toFixed(3)} gal
                        </td>
                        <td colSpan="4" className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                          ${filteredFuelEntries.reduce((sum, entry) => sum + entry.total_amount, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>

            {/* Entry Count */}
            <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
              <div>
                <span className="font-medium">{filteredFuelEntries.length}</span> of{" "}
                <span className="font-medium">{fuelEntries.length}</span> fuel purchases
              </div>
              
              {/* Simple Pagination */}
              {filteredFuelEntries.length > 0 && (
                <div className="flex space-x-1">
                  <button className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <FuelEntryFormModal 
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setCurrentFuelEntry(null);
        }}
        fuelEntry={currentFuelEntry}
        onSave={handleSaveFuelEntry}
      />
      
      <ReceiptViewerModal
        isOpen={receiptViewerOpen}
        onClose={() => {
          setReceiptViewerOpen(false);
          setSelectedReceipt(null);
        }}
        receipt={selectedReceipt}
      />
      
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setFuelEntryToDelete(null);
        }}
        onConfirm={confirmDeleteFuelEntry}
        fuelEntryLocation={fuelEntryToDelete?.location}
      />
    </div>
  );
}