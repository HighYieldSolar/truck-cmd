// src/components/dashboard/CustomersPage.js - with fixed keys
"use client";

import React, { useState, useEffect, useCallback, CustomerItem, CustomerDetailRow } from "react"; // Add React import here
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Plus, 
  Search, 
  RefreshCw,
  AlertCircle,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Download,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { fetchCustomers, deleteCustomer } from "@/lib/services/customerService";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import EmptyState from "@/components/common/EmptyState";

// You'll need to implement or import these components
// Adjust according to your actual component structure
import CustomerFormModal from "@/lib/services/CustomerFormModal";

// Additional components remain the same...

// Main Customers Page Component
export default function CustomersPage() {
  // State variables remain the same...
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  
  // Filter states remain the same...
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  
  // Modal states remain the same...
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail expansion state
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);

  // Stats state
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomers: 0
  });

  // All functions remain the same...

  // JSX render remains the same until we get to the customers table...
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DashboardLayout activePage="customers">
      {/* Main Content */}
      <div className="p-4 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Page Header and other content remain the same... */}
          
          {/* Customers Table - this is where we need to fix keys */}
          <div className="bg-white shadow overflow-hidden rounded-md">
            <div className="overflow-x-auto">
              {customersLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-500">Loading customers...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <EmptyState 
                  message={searchTerm || stateFilter !== 'All' 
                    ? "No customers found matching your search or filters." 
                    : "You haven't added any customers yet."}
                  icon={<Users size={28} className="text-gray-400" />}
                  buttonText="Add Your First Customer"
                  onAction={() => {
                    setCurrentCustomer(null);
                    setFormModalOpen(true);
                  }}
                />
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* THIS IS THE FIXED SECTION - using React.Fragment with a key */}
                    {filteredCustomers.map(customer => (
                      <React.Fragment key={customer.id}>
                        <CustomerItem 
                          customer={customer} 
                          onEdit={handleEditCustomer}
                          onDelete={handleDeleteCustomer}
                          onViewDetails={handleViewDetails}
                        />
                        <CustomerDetailRow
                          customer={customer}
                          isOpen={expandedCustomerId === customer.id}
                          onClose={() => setExpandedCustomerId(null)}
                        />
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {formModalOpen ? (
  <CustomerFormModal 
    isOpen={formModalOpen}
    onClose={() => {
      setFormModalOpen(false);
      setCurrentCustomer(null);
    }}
    customer={currentCustomer}
    onSave={handleSaveCustomer}
  />
) : null}
      
      {deleteModalOpen && (
        <DeleteConfirmationModal 
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setCustomerToDelete(null);
          }}
          onConfirm={confirmDeleteCustomer}
          title="Delete Customer"
          itemName={customerToDelete?.company_name}
          message="This will delete all customer information. This action cannot be undone."
          isDeleting={isDeleting}
        />
      )}
    </DashboardLayout>
  );
}