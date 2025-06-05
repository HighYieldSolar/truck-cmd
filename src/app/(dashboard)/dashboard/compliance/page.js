"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  AlertCircle,
  Plus,
  Download,
  Filter,
  Search,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  Edit,
  Eye,
  Trash2
} from "lucide-react";
import { COMPLIANCE_TYPES } from "@/lib/constants/complianceConstants";
import {
  fetchComplianceItems,
  createComplianceItem,
  updateComplianceItem,
  deleteComplianceItem,
  uploadComplianceDocument,
  deleteComplianceDocument
} from "@/lib/services/complianceService";

// Import components
import ComplianceFilters from "@/components/compliance/ComplianceFilters";
import ComplianceTable from "@/components/compliance/ComplianceTable";
import ComplianceFormModal from "@/components/compliance/ComplianceFormModal";
import ViewComplianceModal from "@/components/compliance/ViewComplianceModal";
import DeleteConfirmationModal from "@/components/compliance/DeleteConfirmationModal";
import ComplianceSummary from "@/components/compliance/ComplianceSummary";
import UpcomingExpirations from "@/components/compliance/UpcomingExpirations";
import ComplianceTypes from "@/components/compliance/ComplianceTypes";

// Main Compliance Dashboard Component
export default function Page() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Compliance items state
  const [complianceItems, setComplianceItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  // Filter state
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
    entity: "all",
    search: ""
  });

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function to get an item's status based on its expiration date
  const getItemStatus = useCallback((item) => {
    if (!item.expiration_date) return "Unknown";

    const today = new Date();
    const expirationDate = new Date(item.expiration_date);
    const differenceInTime = expirationDate - today;
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

    if (differenceInDays < 0) return "Expired";
    if (differenceInDays <= 30) return "Expiring Soon";
    return "Active";
  }, []);

  // Apply filters to compliance items
  const applyFilters = useCallback((items, currentFilters) => {
    let result = [...items];

    // Filter by status
    if (currentFilters.status !== "all") {
      result = result.filter(item => {
        if (!item.expiration_date) return currentFilters.status.toLowerCase() === "unknown";

        // Calculate current status
        const today = new Date();
        const expirationDate = new Date(item.expiration_date);
        const differenceInTime = expirationDate - today;
        const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

        let calculatedStatus;
        if (differenceInDays < 0) {
          calculatedStatus = "expired";
        } else if (differenceInDays <= 30) {
          calculatedStatus = "expiring soon";
        } else {
          calculatedStatus = "active";
        }

        // Use pending status from database if exists, otherwise use calculated status
        const displayStatus = item.status?.toLowerCase() === "pending"
          ? "pending"
          : calculatedStatus;

        return displayStatus === currentFilters.status.toLowerCase();
      });
    }

    // Filter by compliance type
    if (currentFilters.type !== "all") {
      result = result.filter(item => item.compliance_type === currentFilters.type);
    }

    // Filter by entity type
    if (currentFilters.entity !== "all") {
      result = result.filter(item => item.entity_type === currentFilters.entity);
    }

    // Filter by search term
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      result = result.filter(item =>
        (item.title && item.title.toLowerCase().includes(searchLower)) ||
        (item.entity_name && item.entity_name.toLowerCase().includes(searchLower)) ||
        (item.document_number && item.document_number.toLowerCase().includes(searchLower))
      );
    }

    setFilteredItems(result);
  }, []);

  // Fetch user and compliance items on mount
  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          // Redirect to login if not authenticated
          window.location.href = '/login';
          return;
        }

        setUser(user);

        // Fetch compliance items
        const items = await fetchComplianceItems(user.id);
        setComplianceItems(items);
        applyFilters(items, filters);

        setLoading(false);
      } catch (error) {
        console.error("Error initializing compliance dashboard:", error);
        setError("Failed to load compliance data. Please try again.");
        setLoading(false);
      }
    }

    initialize();
  }, [applyFilters, filters]);

  // Update compliance item statuses based on expiration dates
  useEffect(() => {
    const updateComplianceStatuses = async () => {
      if (!user || complianceItems.length === 0) return;

      const today = new Date();
      const itemsToUpdate = [];

      // Check if any items need their status updated based on expiration date
      for (const item of complianceItems) {
        if (!item.expiration_date) continue;

        const expirationDate = new Date(item.expiration_date);
        const differenceInTime = expirationDate - today;
        const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

        let calculatedStatus;
        if (differenceInDays < 0) {
          calculatedStatus = "Expired";
        } else if (differenceInDays <= 30) {
          calculatedStatus = "Expiring Soon";
        } else {
          calculatedStatus = "Active";
        }

        // If the stored status doesn't match the calculated status based on date
        if (item.status !== calculatedStatus) {
          itemsToUpdate.push({
            id: item.id,
            newStatus: calculatedStatus,
            currentStatus: item.status
          });
        }
      }

      // Update items with incorrect statuses in database
      if (itemsToUpdate.length > 0) {
        console.log(`Updating status for ${itemsToUpdate.length} compliance items`);

        for (const item of itemsToUpdate) {
          try {
            await updateComplianceItem(item.id, { status: item.newStatus });
            console.log(`Updated item ${item.id} status from ${item.currentStatus} to ${item.newStatus}`);
          } catch (error) {
            console.error(`Failed to update status for item ${item.id}:`, error);
          }
        }

        // Refresh compliance items after updates
        const updatedItems = await fetchComplianceItems(user.id);
        setComplianceItems(updatedItems);
        applyFilters(updatedItems, filters);
      }
    };

    updateComplianceStatuses();
  }, [user, complianceItems, filters, applyFilters]);

  // Handle filter changes
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      applyFilters(complianceItems, newFilters);
      return newFilters;
    });
  }, [applyFilters, complianceItems]);

  // Handle search
  const handleSearch = useCallback((e) => {
    const value = e.target.value;
    setFilters(prev => {
      const newFilters = { ...prev, search: value };
      applyFilters(complianceItems, newFilters);
      return newFilters;
    });
  }, [applyFilters, complianceItems]);

  // Handle type selection from the sidebar
  const handleTypeSelect = useCallback((type) => {
    setFilters(prev => {
      const newFilters = { ...prev, type };
      applyFilters(complianceItems, newFilters);
      return newFilters;
    });
  }, [applyFilters, complianceItems]);

  // Modal handlers
  const handleOpenFormModal = useCallback((item = null) => {
    setCurrentItem(item);
    setFormModalOpen(true);
  }, []);

  const handleOpenViewModal = useCallback((item) => {
    setCurrentItem(item);
    setViewModalOpen(true);
  }, []);

  const handleOpenDeleteModal = useCallback((item) => {
    setCurrentItem(item);
    setDeleteModalOpen(true);
  }, []);

  // Save compliance item
  const handleSaveComplianceItem = useCallback(async (formData) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      // Upload document if provided
      let documentUrl = currentItem?.document_url;

      if (formData.document_file) {
        try {
          documentUrl = await uploadComplianceDocument(user.id, formData.document_file);
        } catch (uploadErr) {
          console.error("Upload process error:", uploadErr);
          throw uploadErr;
        }
      }

      // Prepare compliance data
      const complianceData = {
        title: formData.title,
        compliance_type: formData.compliance_type,
        entity_type: formData.entity_type,
        entity_name: formData.entity_name,
        document_number: formData.document_number,
        issue_date: formData.issue_date || null,
        expiration_date: formData.expiration_date,
        issuing_authority: formData.issuing_authority || null,
        notes: formData.notes || null,
        status: formData.status,
        document_url: documentUrl || null,
        user_id: user.id
      };

      if (currentItem) {
        // Update existing item
        await updateComplianceItem(currentItem.id, complianceData);
      } else {
        // Insert new item
        await createComplianceItem(complianceData);
      }

      // Refresh compliance items
      const updatedItems = await fetchComplianceItems(user.id);
      setComplianceItems(updatedItems);
      applyFilters(updatedItems, filters);

      // Close the modal
      setFormModalOpen(false);
      setCurrentItem(null);
    } catch (error) {
      console.error("Error saving compliance item:", error);
      setError(error.message || "Failed to save compliance item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [applyFilters, currentItem, filters, user]);

  // Delete compliance item
  const handleDeleteComplianceItem = useCallback(async () => {
    if (!currentItem || !user) return;

    try {
      setIsDeleting(true);

      // Delete document from storage if exists
      if (currentItem.document_url) {
        try {
          await deleteComplianceDocument(currentItem.document_url);
        } catch (storageError) {
          console.warn("Error removing document file:", storageError);
          // Continue with deletion even if removing file fails
        }
      }

      // Delete the compliance item
      await deleteComplianceItem(currentItem.id);

      // Refresh compliance items
      const updatedItems = await fetchComplianceItems(user.id);
      setComplianceItems(updatedItems);
      applyFilters(updatedItems, filters);

      // Close the modal
      setDeleteModalOpen(false);
      setCurrentItem(null);
    } catch (error) {
      console.error("Error deleting compliance item:", error);
      setError(error.message || "Failed to delete compliance item. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [applyFilters, currentItem, filters, user]);

  // Get summary statistics
  const getSummaryStats = useCallback(() => {
    const total = complianceItems.length;

    // Calculate current status for each item
    const itemsWithCalculatedStatus = complianceItems.map(item => {
      if (!item.expiration_date) return { ...item, calculatedStatus: "Unknown" };

      const today = new Date();
      const expirationDate = new Date(item.expiration_date);
      const differenceInTime = expirationDate - today;
      const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

      let calculatedStatus;
      if (differenceInDays < 0) {
        calculatedStatus = "Expired";
      } else if (differenceInDays <= 30) {
        calculatedStatus = "Expiring Soon";
      } else {
        calculatedStatus = "Active";
      }

      return {
        ...item,
        calculatedStatus: item.status === "Pending" ? "Pending" : calculatedStatus
      };
    });

    const active = itemsWithCalculatedStatus.filter(item =>
      item.calculatedStatus === "Active"
    ).length;

    const expiringSoon = itemsWithCalculatedStatus.filter(item =>
      item.calculatedStatus === "Expiring Soon"
    ).length;

    const expired = itemsWithCalculatedStatus.filter(item =>
      item.calculatedStatus === "Expired"
    ).length;

    const pending = itemsWithCalculatedStatus.filter(item =>
      item.calculatedStatus === "Pending"
    ).length;

    return { total, active, expiringSoon, expired, pending };
  }, [complianceItems]);

  // Get upcoming expirations (items expiring in the next 30 days)
  const getUpcomingExpirations = useCallback(() => {
    const today = new Date();
    return complianceItems
      .filter(item => {
        if (!item.expiration_date) return false;

        const expirationDate = new Date(item.expiration_date);
        const differenceInTime = expirationDate - today;
        const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

        return differenceInDays >= 0 && differenceInDays <= 30;
      })
      .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date))
      .slice(0, 5); // Get top 5 upcoming expirations
  }, [complianceItems]);

  const stats = getSummaryStats();
  const upcomingExpirations = getUpcomingExpirations();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Export compliance data to CSV
  const handleExportData = () => {
    if (complianceItems.length === 0) return;

    // Convert data to CSV
    const headers = [
      "Title",
      "Type",
      "Entity",
      "Entity Name",
      "Document Number",
      "Issue Date",
      "Expiration Date",
      "Status",
      "Issuing Authority",
      "Notes"
    ];

    const csvData = complianceItems.map((item) => [
      item.title || "",
      COMPLIANCE_TYPES[item.compliance_type]?.name || item.compliance_type || "",
      item.entity_type || "",
      item.entity_name || "",
      item.document_number || "",
      item.issue_date || "",
      item.expiration_date || "",
      item.status || getItemStatus(item) || "",
      item.issuing_authority || "",
      item.notes || ""
    ]);

    // Create CSV content
    let csvContent = headers.join(",") + "\n";
    csvData.forEach(row => {
      // Escape fields with commas or quotes
      const escapedRow = row.map(field => {
        // Convert to string
        const str = String(field);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          // Escape double quotes with double quotes
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvContent += escapedRow.join(",") + "\n";
    });

    // Download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `compliance_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout activePage="compliance">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Header with background */}
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold mb-1">Compliance Management</h1>
                <p className="text-blue-100">Track and manage all your regulatory compliance documents</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleOpenFormModal()}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium"
                >
                  <Plus size={18} className="mr-2" />
                  Add Record
                </button>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center font-medium"
                  disabled={complianceItems.length === 0}
                >
                  <Download size={18} className="mr-2" />
                  Export Report
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

          {/* Statistics */}
          <ComplianceSummary stats={stats} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              {/* Upcoming Expirations Card */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="bg-orange-500 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <Clock size={18} className="mr-2" />
                    Upcoming Expirations
                  </h3>
                </div>
                <div className="p-4">
                  {upcomingExpirations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle size={36} className="mx-auto mb-2 text-green-500" />
                      <p>No documents expiring soon</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingExpirations.map(item => {
                        const daysLeft = Math.ceil(
                          (new Date(item.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
                        );

                        return (
                          <div
                            key={item.id}
                            className="p-3 bg-gray-50 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                            onClick={() => handleOpenViewModal(item)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm truncate">{item.title}</p>
                                <p className="text-sm text-gray-500">{item.entity_name}</p>
                              </div>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${daysLeft <= 7 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                {daysLeft} days
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      <div className="mt-2 pt-2 border-t border-gray-200 text-center">
                        <button
                          onClick={() => setFilters({ ...filters, status: 'expiring soon' })}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center w-full"
                        >
                          View all expiring items
                          <ArrowRight size={14} className="ml-1" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance Types */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="bg-blue-500 px-5 py-4 text-white">
                  <h3 className="font-semibold flex items-center">
                    <FileText size={18} className="mr-2" />
                    Compliance Categories
                  </h3>
                </div>
                <div className="p-4">
                  {Object.entries(COMPLIANCE_TYPES).map(([key, type]) => {
                    const count = complianceItems.filter(item => item.compliance_type === key).length;
                    if (count === 0) return null;

                    return (
                      <div
                        key={key}
                        className={`mb-3 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${filters.type === key ? 'bg-blue-50 border-blue-200 border' : 'bg-gray-50 hover:bg-blue-50'
                          }`}
                        onClick={() => handleTypeSelect(key)}
                      >
                        <div className="flex items-center">
                          {type.icon}
                          <span className="ml-2 text-sm font-medium text-gray-700">{type.name}</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-white rounded-full text-gray-600 shadow-sm">
                          {count}
                        </span>
                      </div>
                    );
                  })}

                  {Object.entries(COMPLIANCE_TYPES).every(([key]) =>
                    complianceItems.filter(item => item.compliance_type === key).length === 0
                  ) && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText size={36} className="mx-auto mb-2 text-gray-400" />
                        <p>No compliance items found</p>
                      </div>
                    )}

                  <div className="mt-2 pt-2 border-t border-gray-200 text-center">
                    <button
                      onClick={() => handleOpenFormModal()}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center w-full"
                    >
                      Add compliance record
                      <Plus size={14} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 border border-gray-200">
                <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                  <h3 className="font-medium flex items-center text-gray-700">
                    <Filter size={18} className="mr-2 text-gray-500" />
                    Filter Compliance Records
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="expiring soon">Expiring Soon</option>
                        <option value="expired">Expired</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        name="type"
                        value={filters.type}
                        onChange={handleFilterChange}
                        className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All Types</option>
                        {Object.entries(COMPLIANCE_TYPES).map(([key, type]) => (
                          <option key={key} value={key}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Entity</label>
                      <select
                        name="entity"
                        value={filters.entity}
                        onChange={handleFilterChange}
                        className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All Entities</option>
                        <option value="Vehicle">Vehicles</option>
                        <option value="Driver">Drivers</option>
                        <option value="Company">Company</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Search size={16} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={filters.search}
                          onChange={handleSearch}
                          placeholder="Search records..."
                          className="block w-full pl-10 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {filteredItems.length} of {complianceItems.length} records
                    </div>
                    <button
                      onClick={() => setFilters({
                        status: "all",
                        type: "all",
                        entity: "all",
                        search: ""
                      })}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      disabled={
                        filters.status === "all" &&
                        filters.type === "all" &&
                        filters.entity === "all" &&
                        filters.search === ""
                      }
                    >
                      <RefreshCw size={14} className="mr-1" />
                      Reset filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Compliance Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-medium text-gray-700">Compliance Records</h3>
                  <button
                    onClick={() => handleOpenFormModal()}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus size={16} className="mr-1" />
                    Add New
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Compliance Item
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issue Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expiration Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            {complianceItems.length === 0 ? (
                              <div className="max-w-sm mx-auto">
                                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No compliance records</h3>
                                <p className="text-gray-500 mb-4">Start tracking your compliance documents and stay on top of expirations.</p>
                                <button
                                  onClick={() => handleOpenFormModal()}
                                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                  <Plus size={16} className="mr-2" />
                                  Add Compliance Record
                                </button>
                              </div>
                            ) : (
                              <div>
                                <p className="text-gray-500 mb-2">No records match your current filters</p>
                                <button
                                  onClick={() => setFilters({
                                    status: "all",
                                    type: "all",
                                    entity: "all",
                                    search: ""
                                  })}
                                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <RefreshCw size={14} className="mr-1" />
                                  Reset Filters
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map(item => {
                          // Calculate days until expiration
                          const today = new Date();
                          const expirationDate = new Date(item.expiration_date);
                          const daysUntil = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));

                          // Calculate current status based on expiration date
                          let calculatedStatus;
                          if (daysUntil < 0) {
                            calculatedStatus = "Expired";
                          } else if (daysUntil <= 30) {
                            calculatedStatus = "Expiring Soon";
                          } else {
                            calculatedStatus = "Active";
                          }

                          // Use Pending status from database if it exists, otherwise use calculated status
                          const displayStatus = item.status === "Pending" ? "Pending" : calculatedStatus;

                          // Determine status class
                          let statusClass = "bg-green-100 text-green-800"; // Default: Active
                          switch (displayStatus) {
                            case "Expired":
                              statusClass = "bg-red-100 text-red-800";
                              break;
                            case "Expiring Soon":
                              statusClass = "bg-orange-100 text-orange-800";
                              break;
                            case "Pending":
                              statusClass = "bg-blue-100 text-blue-800";
                              break;
                          }

                          return (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleOpenViewModal(item)}
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {item.title}
                                </button>
                              </td>
                              <td className="text-black px-6 py-4 whitespace-nowrap">
                                {item.entity_name}
                              </td>
                              <td className="text-black px-6 py-4 whitespace-nowrap">
                                {item.issue_date ? new Date(item.issue_date).toLocaleDateString() : '-'}
                              </td>
                              <td className="text-black px-6 py-4 whitespace-nowrap">
                                {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                                  {displayStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => handleOpenViewModal(item)}
                                    className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                                    title="View"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenFormModal(item)}
                                    className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                                    title="Edit"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteModal(item)}
                                    className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination placeholder - can be implemented if needed */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {filteredItems.length} of {complianceItems.length} records
                  </div>
                  <div>
                    {/* Pagination controls would go here */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <ComplianceFormModal
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setCurrentItem(null);
          }}
          compliance={currentItem}
          onSave={handleSaveComplianceItem}
          isSubmitting={isSubmitting}
        />

        <ViewComplianceModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setCurrentItem(null);
          }}
          compliance={currentItem}
        />

        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setCurrentItem(null);
          }}
          onConfirm={handleDeleteComplianceItem}
          complianceTitle={currentItem?.title || "this compliance record"}
          isDeleting={isDeleting}
        />
      </main>
    </DashboardLayout>
  );
}