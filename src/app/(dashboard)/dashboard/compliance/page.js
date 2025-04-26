"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AlertCircle, Plus, Download } from "lucide-react";
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
        const status = item.status ? item.status.toLowerCase() : getItemStatus(item).toLowerCase();
        return status === currentFilters.status.toLowerCase();
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
  }, [getItemStatus]);
  
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
    const active = complianceItems.filter(item => 
      (item.status && item.status.toLowerCase() === "active") || 
      (!item.status && getItemStatus(item) === "Active")
    ).length;
    
    const expiringSoon = complianceItems.filter(item => 
      (item.status && item.status.toLowerCase() === "expiring soon") || 
      (!item.status && getItemStatus(item) === "Expiring Soon")
    ).length;
    
    const expired = complianceItems.filter(item => 
      (item.status && item.status.toLowerCase() === "expired") || 
      (!item.status && getItemStatus(item) === "Expired")
    ).length;
    
    const pending = complianceItems.filter(item => 
      item.status && item.status.toLowerCase() === "pending"
    ).length;
    
    return { total, active, expiringSoon, expired, pending };
  }, [complianceItems, getItemStatus]);
  
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
        <div className="max-w-7xl mx-auto ">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Compliance Management</h1>
              <p className="text-gray-500 mt-1">Track and manage all your regulatory compliance documents</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-4">
              <button
                onClick={() => handleOpenFormModal()}
                className="btn btn-primary">
                <Plus size={16} className="mr-2" />
                Add Compliance Record
              </button>
              <button 
                onClick={handleExportData}
                className="btn btn-secondary"
                disabled={complianceItems.length === 0}
              >
                <Download size={16} className="mr-2" />
                Export Report
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md ">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Statistics */}
          <ComplianceSummary stats={stats} />

          {/* Two-column layout: Upcoming Expirations + Filters/Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Upcoming Expirations */}
            <div>
              <UpcomingExpirations
                expirations={upcomingExpirations} 
                onViewItem={handleOpenViewModal} 
              />
              
              {/* Compliance Type Breakdown */}
              <ComplianceTypes 
                types={COMPLIANCE_TYPES} 
                complianceItems={complianceItems} 
                onTypeSelect={handleTypeSelect} 
              />
            </div>
              {/* Right column: Filters and Table */}
             
            <div className="lg:col-span-3">
              {/* Filters */}
              <ComplianceFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
              />
              
              {/* Compliance Items Table */}
              <ComplianceTable 
                complianceItems={complianceItems}
                filteredItems={filteredItems}
                onEdit={handleOpenFormModal}
                onDelete={handleOpenDeleteModal}
                onView={handleOpenViewModal}
                onAddNew={() => handleOpenFormModal()}
              />
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