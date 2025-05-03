// src/components/dispatching/NewLoadModal.js
import React, { useState, useEffect } from 'react';
import { X, Truck, Calendar, MapPin, DollarSign } from 'lucide-react';

const STORAGE_KEY = 'new_load_form_data';

export default function NewLoadModal({ onClose, onSave, customers = [] }) {
  // Add debugging
  console.log('Customers prop received:', customers);
  
  const [formData, setFormData] = useState({
    loadNumber: '',
    customer: '',
    origin: '',
    destination: '',
    pickupDate: '',
    deliveryDate: '',
    rate: '',
    distance: '',
    description: '',
    status: 'Pending'
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('Loaded from localStorage:', parsedData);
        setFormData(prev => ({
          ...prev,
          ...parsedData
        }));
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

  // Save to localStorage whenever formData changes
  useEffect(() => {
    console.log('Saving to localStorage:', formData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create load object with all needed data
    const newLoad = {
      ...formData,
      loadNumber: formData.loadNumber || `L${Math.floor(10000 + Math.random() * 90000)}`,
      rate: parseFloat(formData.rate) || 0,
      distance: parseFloat(formData.distance) || 0,
      createdAt: new Date().toISOString()
    };
    
    // Save the load
    await onSave(newLoad);
    
    // Clear localStorage after successful save
    localStorage.removeItem(STORAGE_KEY);
    
    onClose();
  };

  const handleClear = () => {
    setFormData({
      loadNumber: '',
      customer: '',
      origin: '',
      destination: '',
      pickupDate: '',
      deliveryDate: '',
      rate: '',
      distance: '',
      description: '',
      status: 'Pending'
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleCloseModal = () => {
    // Don't clear localStorage when closing
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-500 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Truck size={24} className="mr-3" />
            Create New Load
          </h2>
          <button 
            onClick={handleCloseModal}
            className="text-white hover:text-blue-100 rounded-full p-1 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Load Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Load Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Truck size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="loadNumber"
                  value={formData.loadNumber}
                  onChange={handleChange}
                  placeholder="Auto-generated if empty"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Customer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              >
                <option value="" style={{ backgroundColor: 'black', color: 'white' }}>
                  Select a customer
                </option>
                {customers && customers.length > 0 ? (
                  customers.map(customer => (
                    <option 
                      key={customer.id} 
                      value={customer.company_name || customer.name}
                      style={{ backgroundColor: 'black', color: 'white' }}
                    >
                      {customer.company_name || customer.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled style={{ backgroundColor: 'black', color: 'white' }}>
                    No customers available
                  </option>
                )}
              </select>
            </div>

            {/* Origin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origin *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  placeholder="Enter pickup location"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="Enter delivery location"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Pickup Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={18} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  name="pickupDate"
                  value={formData.pickupDate}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={18} className="text-gray-400" />
                </div>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={18} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance (miles)
              </label>
              <input
                type="number"
                name="distance"
                value={formData.distance}
                onChange={handleChange}
                placeholder="Enter distance"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                min="0"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add any additional notes about this load..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              rows="3"
            />
          </div>

          {/* Footer */}
          <div className="mt-8 flex flex-col-reverse md:flex-row md:justify-between md:items-center gap-4">
            {/* Draft notice */}
            <div className="text-sm text-gray-500 text-center md:text-left">
              Your data is automatically saved as you type
            </div>
            
            {/* Buttons */}
            <div className="flex justify-center md:justify-end space-x-4">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Clear Form
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Create Load
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}