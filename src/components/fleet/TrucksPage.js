"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Plus, 
  Search, 
  Filter,
  RefreshCw,
  Truck,
  Edit,
  Trash2,
  AlertCircle,
  ChevronLeft
} from "lucide-react";
import { fetchTrucks, deleteTruck } from "@/lib/services/truckService";
import TruckFormModal from "@/components/fleet/TruckFormModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

// TruckCard component
const TruckCard = ({ truck, onEdit, onDelete }) => {
  const statusColors = {
    'Active': 'bg-green-100 text-green-800',
    'In Maintenance': 'bg-yellow-100 text-yellow-800',
    'Out of Service': 'bg-red-100 text-red-800',
    'Idle': 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium text-gray-900">{truck.name}</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => onEdit(truck)} 
            className="p-1 text-blue-600 hover:text-blue-800"
            aria-label="Edit truck"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(truck)} 
            className="p-1 text-red-600 hover:text-red-800"
            aria-label="Delete truck"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center text-gray-500 mt-2 mb-3">
        <Truck size={16} className="mr-2" />
        <span>{truck.year} {truck.make} {truck.model}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-sm mb-3">
        <div>
          <p className="text-gray-500">VIN</p>
          <p className="font-medium truncate">{truck.vin ? truck.vin.slice(-6) : 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500">License</p>
          <p className="font-medium">{truck.license_plate || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500">Status</p>
          <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[truck.status] || 'bg-gray-100 text-gray-800'}`}>
            {truck.status}
          </span>
        </div>
      </div>
      
      <Link 
        href={`/dashboard/fleet/trucks/${truck.id}`}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        View Details
      </Link>
    </div>
  );
};

// EmptyState component
const EmptyState = ({ onAddNew }) => (
  <div className="text-center py-12">
    <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
      <Truck size={24} className="text-gray-400" />
    </div>
    <h3 className="mt-3 text-lg font-medium text-gray-900">No vehicles found</h3>
    <p className="mt-1 text-gray-500">Get started by adding your first vehicle</p>
    <div className="mt-6">
      <button
        type="button"
        onClick={onAddNew}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
      >
        <Plus size={16} className="mr-2" />
        Add Vehicle
      </button>
    </div>
  </div>
);

// Main component
export default function TrucksPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trucks, setTrucks] = useState([]);
  const [filteredTrucks, setFilteredTrucks] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [truckToEdit, setTruckToEdit] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [truckToDelete, setTruckToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Get user and load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        
        // Load trucks
        const data = await fetchTrucks(user.id);
        setTrucks(data);
        setFilteredTrucks(data);
      } catch (error) {
        console.error('Error loading trucks:', error);
        setError('Failed to load vehicles. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Apply filters
  useEffect(() => {
    if (!trucks) return;
    
    let results = [...trucks];
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(truck => 
        truck.name?.toLowerCase().includes(term) ||
        truck.make?.toLowerCase().includes(term) ||
        truck.model?.toLowerCase().includes(term) ||
        truck.vin?.toLowerCase().includes(term) ||
        truck.license_plate?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'All') {
      results = results.filter(truck => truck.status === statusFilter);
    }
    
    setFilteredTrucks(results);
  }, [trucks, searchTerm, statusFilter]);
  
  // Handle adding a new truck
  const handleAddTruck = () => {
    setTruckToEdit(null);
    setFormModalOpen(true);
  };
  
  // Handle editing a truck
  const handleEditTruck = (truck) => {
    setTruckToEdit(truck);
    setFormModalOpen(true);
  };
  
  // Handle truck form submission
  const handleTruckSubmit = async (formData) => {
    try {
      if (!user) return;
      
      // After successful save, refresh the trucks list
      const data = await fetchTrucks(user.id);
      setTrucks(data);
      setFilteredTrucks(data);
      return true;
    } catch (error) {
      console.error('Error after saving truck:', error);
      return false;
    }
  };
  
  // Handle deleting a truck
  const handleDeleteClick = (truck) => {
    setTruckToDelete(truck);
    setDeleteModalOpen(true);
  };
  
  // Confirm truck deletion
  const confirmDelete = async () => {
    if (!truckToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteTruck(truckToDelete.id);
      
      // Update the trucks list
      const updatedTrucks = trucks.filter(t => t.id !== truckToDelete.id);
      setTrucks(updatedTrucks);
      setFilteredTrucks(updatedTrucks);
      
      setDeleteModalOpen(false);
      setTruckToDelete(null);
    } catch (error) {
      console.error('Error deleting truck:', error);
      setError('Failed to delete vehicle. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
  };

  if (loading) {
    return (
      <DashboardLayout activePage="fleet">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="fleet">
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center">
              <Link href="/dashboard/fleet" className="mr-2 p-2 rounded-full hover:bg-gray-200">
                <ChevronLeft size={20} className="text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Vehicles</h1>
                <p className="text-gray-600">Manage your fleet vehicles</p>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search vehicles..."
                />
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="In Maintenance">In Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                    <option value="Idle">Idle</option>
                  </select>
                </div>
                
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Reset
                </button>
                
                <button
                  onClick={handleAddTruck}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus size={16} className="mr-2" />
                  Add Vehicle
                </button>
              </div>
            </div>
          </div>

          {/* Trucks Grid */}
          {filteredTrucks.length === 0 ? (
            trucks.length === 0 ? (
              <EmptyState onAddNew={handleAddTruck} />
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <p className="text-gray-500">No vehicles match your filters</p>
                <button
                  onClick={resetFilters}
                  className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Reset Filters
                </button>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrucks.map((truck) => (
                <TruckCard 
                  key={truck.id} 
                  truck={truck} 
                  onEdit={handleEditTruck} 
                  onDelete={handleDeleteClick} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TruckFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        truck={truckToEdit}
        userId={user?.id}
        onSubmit={handleTruckSubmit}
      />
      
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTruckToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete "${truckToDelete?.name}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
}