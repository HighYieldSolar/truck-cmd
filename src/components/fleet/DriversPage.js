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
  User,
  Users,
  Edit,
  Trash2,
  AlertTriangle,
  AlertCircle,
  ChevronLeft,
  Calendar,
  FileCheck
} from "lucide-react";
import { fetchDrivers, deleteDriver, checkDriverDocumentStatus } from "@/lib/services/driverService";
import DriverFormModal from "@/components/fleet/DriverFormModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

// DriverCard component
const DriverCard = ({ driver, onEdit, onDelete }) => {
  const statusColors = {
    'Active': 'bg-green-100 text-green-800',
    'Inactive': 'bg-red-100 text-red-800',
    'On Leave': 'bg-blue-100 text-blue-800'
  };

  // Check document status
  const documentStatus = checkDriverDocumentStatus(driver);

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium text-gray-900">{driver.name}</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => onEdit(driver)} 
            className="p-1 text-blue-600 hover:text-blue-800"
            aria-label="Edit driver"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(driver)} 
            className="p-1 text-red-600 hover:text-red-800"
            aria-label="Delete driver"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center text-gray-500 mt-2 mb-3">
        <User size={16} className="mr-2" />
        <span>{driver.position || 'Driver'}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <p className="text-gray-500">Phone</p>
          <p className="text-black font-medium">{driver.phone || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500">Status</p>
          <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[driver.status] || 'bg-gray-100 text-gray-800'}`}>
            {driver.status}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-gray-500">License</p>
          <div className="flex items-center">
            <span className="text-black mr-1">{driver.license_number ? driver.license_number.slice(-4) : 'N/A'}</span>
            {documentStatus.licenseStatus !== 'valid' && (
              <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                documentStatus.licenseStatus === 'expired' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {documentStatus.licenseStatus === 'expired' ? 'Expired' : `${documentStatus.licenseExpiryDays} days`}
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-gray-500">Medical Card</p>
          <div className="text-black flex items-center">
            <span>{driver.medical_card_expiry ? 'Valid' : 'N/A'}</span>
            {documentStatus.medicalCardStatus !== 'valid' && (
              <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                documentStatus.medicalCardStatus === 'expired' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {documentStatus.medicalCardStatus === 'expired' ? 'Expired' : `${documentStatus.medicalCardExpiryDays} days`}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <Link 
        href={`/dashboard/fleet/drivers/${driver.id}`}
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
      <Users size={24} className="text-gray-400" />
    </div>
    <h3 className="mt-3 text-lg font-medium text-gray-900">No drivers found</h3>
    <p className="mt-1 text-gray-500">Get started by adding your first driver</p>
    <div className="mt-6">
      <button
        type="button"
        onClick={onAddNew}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
      >
        <Plus size={16} className="mr-2" />
        Add Driver
      </button>
    </div>
  </div>
);

// Document Expiry Alert component
const DocumentExpiryAlerts = ({ drivers }) => {
  // Get drivers with documents expiring soon or already expired
  const getExpiringDrivers = () => {
    const now = new Date();
    return drivers.filter(driver => {
      const status = checkDriverDocumentStatus(driver);
      return status.licenseStatus !== 'valid' || status.medicalCardStatus !== 'valid';
    }).sort((a, b) => {
      const statusA = checkDriverDocumentStatus(a);
      const statusB = checkDriverDocumentStatus(b);
      
      // Sort expired first, then by days remaining
      if (statusA.licenseStatus === 'expired' && statusB.licenseStatus !== 'expired') return -1;
      if (statusA.licenseStatus !== 'expired' && statusB.licenseStatus === 'expired') return 1;
      
      return (statusA.licenseExpiryDays || 999) - (statusB.licenseExpiryDays || 999);
    });
  };
  
  const expiringDrivers = getExpiringDrivers();
  
  if (expiringDrivers.length === 0) return null;
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
      <div className="flex">
        <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
        <div>
          <p className="text-sm text-yellow-700 font-medium">Document Alerts</p>
          <ul className="mt-2 text-sm text-yellow-700 space-y-1">
            {expiringDrivers.slice(0, 3).map(driver => {
              const status = checkDriverDocumentStatus(driver);
              return (
                <li key={driver.id}>
                  <span className="text-black font-medium">{driver.name}:</span> 
                  {status.licenseStatus !== 'valid' && (
                    <span className="ml-1">
                      License {status.licenseStatus === 'expired' ? 'expired' : `expires in ${status.licenseExpiryDays} days`}
                    </span>
                  )}
                  {status.medicalCardStatus !== 'valid' && status.licenseStatus !== 'valid' && (
                    <span>, </span>
                  )}
                  {status.medicalCardStatus !== 'valid' && (
                    <span>
                      Medical card {status.medicalCardStatus === 'expired' ? 'expired' : `expires in ${status.medicalCardExpiryDays} days`}
                    </span>
                  )}
                </li>
              );
            })}
            {expiringDrivers.length > 3 && (
              <li>
                <span className="text-yellow-600">+{expiringDrivers.length - 3} more with expiring documents</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Main component
export default function DriversPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [driverToEdit, setDriverToEdit] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);
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
        
        // Load drivers
        const data = await fetchDrivers(user.id);
        setDrivers(data);
        setFilteredDrivers(data);
      } catch (error) {
        console.error('Error loading drivers:', error);
        setError('Failed to load drivers. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Apply filters
  useEffect(() => {
    if (!drivers) return;
    
    let results = [...drivers];
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(driver => 
        driver.name?.toLowerCase().includes(term) ||
        driver.license_number?.toLowerCase().includes(term) ||
        driver.phone?.toLowerCase().includes(term) ||
        driver.email?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'All') {
      results = results.filter(driver => driver.status === statusFilter);
    }
    
    setFilteredDrivers(results);
  }, [drivers, searchTerm, statusFilter]);
  
  // Handle adding a new driver
  const handleAddDriver = () => {
    setDriverToEdit(null);
    setFormModalOpen(true);
  };
  
  // Handle editing a driver
  const handleEditDriver = (driver) => {
    setDriverToEdit(driver);
    setFormModalOpen(true);
  };
  
  // Handle driver form submission
  const handleDriverSubmit = async (formData) => {
    try {
      if (!user) return;
      
      // After successful save, refresh the drivers list
      const data = await fetchDrivers(user.id);
      setDrivers(data);
      setFilteredDrivers(data);
      return true;
    } catch (error) {
      console.error('Error after saving driver:', error);
      return false;
    }
  };
  
  // Handle deleting a driver
  const handleDeleteClick = (driver) => {
    setDriverToDelete(driver);
    setDeleteModalOpen(true);
  };
  
  // Confirm driver deletion
  const confirmDelete = async () => {
    if (!driverToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteDriver(driverToDelete.id);
      
      // Update the drivers list
      const updatedDrivers = drivers.filter(d => d.id !== driverToDelete.id);
      setDrivers(updatedDrivers);
      setFilteredDrivers(updatedDrivers);
      
      setDeleteModalOpen(false);
      setDriverToDelete(null);
    } catch (error) {
      console.error('Error deleting driver:', error);
      setError('Failed to delete driver. Please try again later.');
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
                <h1 className="text-2xl font-semibold text-gray-900">Drivers</h1>
                <p className="text-gray-600">Manage your fleet drivers</p>
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

          {/* Document expiry alerts */}
          <DocumentExpiryAlerts drivers={drivers} />

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
                  placeholder="Search drivers..."
                />
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-black block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
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
                  onClick={handleAddDriver}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus size={16} className="mr-2" />
                  Add Driver
                </button>
              </div>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Link
              href="/dashboard/fleet/drivers/documents"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FileCheck size={16} className="mr-2" />
              Document Check
            </Link>
            <Link
              href="/dashboard/fleet/drivers/schedule"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Calendar size={16} className="mr-2" />
              Driver Schedule
            </Link>
          </div>

          {/* Drivers Grid */}
          {filteredDrivers.length === 0 ? (
            drivers.length === 0 ? (
              <EmptyState onAddNew={handleAddDriver} />
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <p className="text-gray-500">No drivers match your filters</p>
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
              {filteredDrivers.map((driver) => (
                <DriverCard 
                  key={driver.id} 
                  driver={driver} 
                  onEdit={handleEditDriver} 
                  onDelete={handleDeleteClick} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DriverFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        driver={driverToEdit}
        userId={user?.id}
        onSubmit={handleDriverSubmit}
      />
      
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDriverToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Driver"
        message={`Are you sure you want to delete "${driverToDelete?.name}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
}