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
  ChevronLeft,
  Download,
  CheckCircle,
  Eye,
  FileText
} from "lucide-react";
import { fetchTrucks, deleteTruck } from "@/lib/services/truckService";
import TruckFormModal from "@/components/fleet/TruckFormModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

export default function TrucksPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trucks, setTrucks] = useState([]);
  const [filteredTrucks, setFilteredTrucks] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    year: 'all',
    search: '',
  });
  
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
    if (filters.search) {
      const term = filters.search.toLowerCase();
      results = results.filter(truck => 
        truck.name?.toLowerCase().includes(term) ||
        truck.make?.toLowerCase().includes(term) ||
        truck.model?.toLowerCase().includes(term) ||
        truck.vin?.toLowerCase().includes(term) ||
        truck.license_plate?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      results = results.filter(truck => truck.status === filters.status);
    }
    
    // Apply year filter
    if (filters.year !== 'all') {
      results = results.filter(truck => truck.year === filters.year);
    }
    
    setFilteredTrucks(results);
  }, [trucks, filters]);
  
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
      
      // Clear local storage for truck form data
      localStorage.removeItem("truckFormData");
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
    setFilters({
      status: 'all',
      year: 'all',
      search: '',
    });
  };

  // Get available years for filter
  const getYears = () => {
    const years = trucks
      .map(truck => truck.year)
      .filter(year => year) // Remove null or undefined
      .filter((year, index, self) => self.indexOf(year) === index) // Remove duplicates
      .sort((a, b) => b - a); // Sort descending
    
    return years;
  };

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString || "N/A";
    }
  };

  // Status Badge component
  const StatusBadge = ({ status }) => {
    let classes = "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'Active':
        classes += " bg-green-100 text-green-800";
        break;
      case 'In Maintenance':
        classes += " bg-yellow-100 text-yellow-800";
        break;
      case 'Out of Service':
        classes += " bg-red-100 text-red-800";
        break;
      case 'Idle':
        classes += " bg-blue-100 text-blue-800";
        break;
      default:
        classes += " bg-gray-100 text-gray-800";
    }
    
    return <span className={classes}>{status}</span>;
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
          {/* Header with background */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center">
                  <Link href="/dashboard/fleet" className="mr-2 p-2 rounded-full hover:bg-blue-500/40">
                    <ChevronLeft size={20} />
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold mb-1">Vehicle Management</h1>
                    <p className="text-blue-100">Add, edit and delete vehicles in your fleet</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAddTruck}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Add Vehicle
                </button>
                <button
                  onClick={() => alert('Export functionality would be implemented here')}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Download size={18} className="mr-2" />
                  Export Vehicles
                </button>
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
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-800 flex items-center">
                <Filter size={18} className="mr-2 text-gray-500" />
                Filter Vehicles
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="In Maintenance">In Maintenance</option>
                    <option value="Out of Service">Out of Service</option>
                    <option value="Idle">Idle</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    name="year"
                    value={filters.year}
                    onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Years</option>
                    {getYears().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      placeholder="Search by name, make, model, VIN..."
                      className="block w-full pl-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between">
                <div className="text-sm text-gray-500">
                  Showing {filteredTrucks.length} of {trucks.length} vehicles
                </div>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  disabled={
                    filters.status === "all" && 
                    filters.year === "all" && 
                    filters.search === ""
                  }
                >
                  <RefreshCw size={14} className="mr-1" />
                  Reset filters
                </button>
              </div>
            </div>
          </div>

          {/* Vehicles Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium text-gray-800 flex items-center">
                <Truck size={18} className="mr-2 text-blue-600" />
                Vehicles List
              </h3>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-3">{filteredTrucks.length} vehicles found</span>
                <button
                  onClick={handleAddTruck}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} className="mr-1.5" />
                  Add Vehicle
                </button>
              </div>
            </div>
            
            {filteredTrucks.length === 0 ? (
              <div className="p-8 text-center">
                {trucks.length === 0 ? (
                  <div className="max-w-sm mx-auto">
                    <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No vehicles found</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first vehicle to your fleet.</p>
                    <button
                      onClick={handleAddTruck}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Vehicle
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500 mb-2">No vehicles match your current filters</p>
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <RefreshCw size={14} className="mr-1" />
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year/Make/Model
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        License Plate
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        VIN
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added On
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTrucks.map(truck => (
                      <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a 
                            className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer" 
                            onClick={() => window.location.href = `/dashboard/fleet/trucks/${truck.id}`}
                          >
                            {truck.name}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-900">{truck.year} {truck.make} {truck.model}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-900">{truck.license_plate || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-900">{truck.vin ? `...${truck.vin.slice(-6)}` : 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={truck.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-500">{formatDate(truck.created_at)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center space-x-3">
                            <button
                              onClick={() => window.location.href = `/dashboard/fleet/trucks/${truck.id}`}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditTruck(truck)}
                              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md"
                              title="Edit Vehicle"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(truck)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                              title="Delete Vehicle"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Table footer with pagination placeholder */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredTrucks.length} of {trucks.length} vehicles
              </div>
              <div>
                {/* Pagination controls would go here */}
              </div>
            </div>
          </div>

          {/* Helpful tips section */}
          <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <FileText size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">Vehicle Management Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div className="flex items-start">
                    <CheckCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Keep your vehicle records updated to ensure accurate reporting and compliance tracking.</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Schedule regular maintenance to prevent unexpected breakdowns and costly repairs.</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Track service history for each vehicle to identify recurring issues and predict future maintenance needs.</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Export vehicle data regularly to maintain backup records for audit purposes.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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