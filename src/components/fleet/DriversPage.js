"use client";

import { useState, useEffect, useCallback } from "react";
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
  FileCheck,
  Download,
  Eye,
  Clock,
  FileText,
  CheckCircle
} from "lucide-react";
import { fetchDrivers, deleteDriver, checkDriverDocumentStatus } from "@/lib/services/driverService";
import DriverFormModal from "@/components/fleet/DriverFormModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

export default function DriversPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  
  // Document expiry statistics
  const [expiryStats, setExpiryStats] = useState({
    total: 0,
    expiringSoon: 0,
    expired: 0,
    valid: 0
  });
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    documentStatus: 'all',
    search: ''
  });
  
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
        
        // Calculate expiry statistics
        calculateExpiryStats(data);
      } catch (error) {
        console.error('Error loading drivers:', error);
        setError('Failed to load drivers. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Calculate document expiry statistics
  const calculateExpiryStats = (driversData) => {
    let expiringSoon = 0;
    let expired = 0;
    let valid = 0;
    
    driversData.forEach(driver => {
      const status = checkDriverDocumentStatus(driver);
      
      if (status.licenseStatus === 'expired' || status.medicalCardStatus === 'expired') {
        expired++;
      } else if (status.licenseStatus === 'expiring' || status.medicalCardStatus === 'expiring') {
        expiringSoon++;
      } else {
        valid++;
      }
    });
    
    setExpiryStats({
      total: driversData.length,
      expiringSoon,
      expired,
      valid
    });
  };
  
  // Apply filters
  useEffect(() => {
    if (!drivers) return;
    
    let results = [...drivers];
    
    // Apply search term
    if (filters.search) {
      const term = filters.search.toLowerCase();
      results = results.filter(driver => 
        driver.name?.toLowerCase().includes(term) ||
        driver.license_number?.toLowerCase().includes(term) ||
        driver.phone?.toLowerCase().includes(term) ||
        driver.email?.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      results = results.filter(driver => driver.status === filters.status);
    }
    
    // Apply document status filter
    if (filters.documentStatus !== 'all') {
      results = results.filter(driver => {
        const status = checkDriverDocumentStatus(driver);
        
        switch (filters.documentStatus) {
          case 'expired':
            return status.licenseStatus === 'expired' || status.medicalCardStatus === 'expired';
          case 'expiring':
            return status.licenseStatus === 'expiring' || status.medicalCardStatus === 'expiring';
          case 'valid':
            return status.licenseStatus === 'valid' && status.medicalCardStatus === 'valid';
          default:
            return true;
        }
      });
    }
    
    setFilteredDrivers(results);
  }, [drivers, filters]);
  
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
      
      // Recalculate expiry stats
      calculateExpiryStats(data);
      
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
      
      // Recalculate expiry stats
      calculateExpiryStats(updatedDrivers);
      
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
    setFilters({
      status: 'all',
      documentStatus: 'all',
      search: ''
    });
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
      case 'Inactive':
        classes += " bg-red-100 text-red-800";
        break;
      case 'On Leave':
        classes += " bg-blue-100 text-blue-800";
        break;
      default:
        classes += " bg-gray-100 text-gray-800";
    }
    
    return <span className={classes}>{status}</span>;
  };

  // Document Status Badge component
  const DocumentStatusBadge = ({ driver }) => {
    const status = checkDriverDocumentStatus(driver);
    let classes = "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium";
    let text = "All Valid";
    
    if (status.licenseStatus === 'expired' || status.medicalCardStatus === 'expired') {
      classes += " bg-red-100 text-red-800";
      text = "Documents Expired";
    } else if (status.licenseStatus === 'expiring' || status.medicalCardStatus === 'expiring') {
      classes += " bg-yellow-100 text-yellow-800";
      text = "Expiring Soon";
    } else {
      classes += " bg-green-100 text-green-800";
    }
    
    return <span className={classes}>{text}</span>;
  };

  // Stat Card component for displaying statistics
  const StatCard = ({ title, value, icon, color }) => {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`bg-${color}-100 p-3 rounded-xl`}>
            {icon}
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">Driver document status</span>
        </div>
      </div>
    );
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
                    <h1 className="text-3xl font-bold mb-1">Driver Management</h1>
                    <p className="text-blue-100">Manage your drivers and monitor document expirations</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAddDriver}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Add Driver
                </button>
                <button
                  onClick={() => alert('Export functionality would be implemented here')}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Download size={18} className="mr-2" />
                  Export Drivers
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

          {/* Document Expiry Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Drivers"
              value={expiryStats.total}
              icon={<Users size={20} className="text-blue-600" />}
              color="blue"
            />
            <StatCard
              title="Valid Documents"
              value={expiryStats.valid}
              icon={<CheckCircle size={20} className="text-green-600" />}
              color="green"
            />
            <StatCard
              title="Expiring Soon"
              value={expiryStats.expiringSoon}
              icon={<Clock size={20} className="text-yellow-600" />}
              color="yellow"
            />
            <StatCard
              title="Expired Documents"
              value={expiryStats.expired}
              icon={<AlertTriangle size={20} className="text-red-600" />}
              color="red"
            />
          </div>

          {/* Document expiration alert */}
          {expiryStats.expired > 0 && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-700 font-medium">Document Expiration Alert</p>
                  <p className="text-sm text-red-700 mt-1">
                    {expiryStats.expired} driver{expiryStats.expired !== 1 ? 's' : ''} {expiryStats.expired !== 1 ? 'have' : 'has'} expired documents. Please update these documents as soon as possible to maintain compliance.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-800 flex items-center">
                <Filter size={18} className="mr-2 text-gray-500" />
                Filter Drivers
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
                    className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Status</label>
                  <select
                    name="documentStatus"
                    value={filters.documentStatus}
                    onChange={(e) => setFilters(prev => ({ ...prev, documentStatus: e.target.value }))}
                    className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Document Statuses</option>
                    <option value="valid">Valid</option>
                    <option value="expiring">Expiring Soon</option>
                    <option value="expired">Expired</option>
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
                      placeholder="Search by name, license, phone, email..."
                      className="block w-full pl-10 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between">
                <div className="text-sm text-gray-500">
                  Showing {filteredDrivers.length} of {drivers.length} drivers
                </div>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  disabled={
                    filters.status === "all" && 
                    filters.documentStatus === "all" && 
                    filters.search === ""
                  }
                >
                  <RefreshCw size={14} className="mr-1" />
                  Reset filters
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions buttons */}
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

          {/* Drivers Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium text-gray-800 flex items-center">
                <Users size={18} className="mr-2 text-blue-600" />
                Drivers List
              </h3>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-3">{filteredDrivers.length} drivers found</span>
                <button
                  onClick={handleAddDriver}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} className="mr-1.5" />
                  Add Driver
                </button>
              </div>
            </div>
            
            {filteredDrivers.length === 0 ? (
              <div className="p-8 text-center">
                {drivers.length === 0 ? (
                  <div className="max-w-sm mx-auto">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No drivers found</h3>
                    <p className="text-gray-500 mb-4">Get started by adding your first driver to your team.</p>
                    <button
                      onClick={handleAddDriver}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Driver
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500 mb-2">No drivers match your current filters</p>
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
                        Driver
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        License #
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDrivers.map(driver => {
                      const status = checkDriverDocumentStatus(driver);
                      
                      return (
                        <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a 
                              className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer" 
                              onClick={() => window.location.href = `/dashboard/fleet/drivers/${driver.id}`}
                            >
                              {driver.name}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-gray-900">{driver.position || 'Driver'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-gray-900">{driver.phone || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-gray-900">{driver.license_number || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={driver.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <DocumentStatusBadge driver={driver} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center space-x-3">
                              <button
                                onClick={() => window.location.href = `/dashboard/fleet/drivers/${driver.id}`}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                                title="View Details"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => handleEditDriver(driver)}
                                className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md"
                                title="Edit Driver"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(driver)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                                title="Delete Driver"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Table footer with pagination placeholder */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredDrivers.length} of {drivers.length} drivers
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
                <h3 className="text-lg font-medium text-blue-900 mb-2">Driver Management Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div className="flex items-start">
                    <CheckCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Set up document expiration reminders to ensure compliance with regulatory requirements.</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Maintain accurate contact information for emergency situations.</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Regularly verify that all driver licenses and medical cards are up to date.</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Store copies of all driver documents in a secure location for easy access during inspections.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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