"use client";

import Link from "next/link";
import {
  FileText,
  DollarSign,
  Filter,
  Search,
  Plus,
  RefreshCw
} from "lucide-react";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import TableActions from "@/components/shared/TableActions";

// Invoice Filters Component
const InvoiceFilters = ({ filters, setFilters, onApplyFilters }) => {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      status: 'all',
      dateRange: 'all',
      search: '',
      sortBy: 'invoice_date',
      sortDirection: 'desc'
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const statusOptions = [
    { value: 'all', label: 'All Invoices' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'last30', label: 'Last 30 Days' },
    { value: 'last90', label: 'Last 90 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' },
  ];

  const sortOptions = [
    { value: 'invoice_date', label: 'Invoice Date' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'total', label: 'Amount' },
    { value: 'status', label: 'Status' },
    { value: 'customer', label: 'Customer' }
  ];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 mb-6">
      <div className="bg-blue-500 px-5 py-4 text-white">
        <h3 className="font-semibold flex items-center">
          <Filter size={18} className="mr-2" />
          Filter Invoices
        </h3>
      </div>

      <div className="p-5">
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="all">All Statuses</option>
              {statusOptions.filter(option => option.value !== 'all').map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Date Range</label>
            <select
              name="dateRange"
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              <option value="all">All Time</option>
              {dateRangeOptions.filter(option => option.value !== 'all').map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Sort By</label>
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search invoices..."
              />
            </div>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm flex items-center font-medium"
          >
            <Filter size={16} className="mr-2" />
            Apply Filters
          </button>

          <button
            onClick={handleResetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            disabled={
              filters.status === "all" &&
              filters.dateRange === "all" &&
              filters.search === "" &&
              filters.sortBy === "invoice_date" &&
              filters.sortDirection === "desc"
            }
          >
            <RefreshCw size={14} className="mr-1" />
            Reset filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default function InvoiceListComponent({
  invoices,
  handleViewInvoice,
  handleMarkAsPaid,
  handleDeleteInvoice,
  filters,
  setFilters,
  onApplyFilters,
  loading
}) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      {/* Filters component */}
      <InvoiceFilters
        filters={filters}
        setFilters={setFilters}
        onApplyFilters={onApplyFilters}
      />

      {/* Invoice Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 mb-6">
        <div className="bg-blue-500 px-5 py-4 text-white">
          <h3 className="font-semibold flex items-center">
            <FileText size={18} className="mr-2" />
            Invoice Records
          </h3>
        </div>

        {/* Invoice List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
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
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center">
                    <RefreshCw size={32} className="mx-auto text-blue-500 animate-spin" />
                    <p className="mt-2 text-gray-500">Loading invoices...</p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="max-w-sm mx-auto">
                      <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No invoices found</h3>
                      <p className="text-gray-500 mb-4">Create your first invoice to get started</p>
                      <Link
                        href="/dashboard/invoices/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus size={16} className="mr-2" />
                        Create Invoice
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <a
                        onClick={() => handleViewInvoice(invoice.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      >
                        Invoice #{invoice.invoice_number}
                      </a>
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {invoice.customer}
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {formatDate(invoice.invoice_date)}
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {formatDate(invoice.due_date)}
                    </td>

                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {formatCurrency(invoice.total)}
                    </td>

                    <td className="px-6 py-4">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <TableActions
                          onView={() => handleViewInvoice(invoice.id)}
                          onDelete={() => handleDeleteInvoice(invoice)}
                          customActions={invoice.status !== 'paid' ? [
                            {
                              icon: DollarSign,
                              onClick: () => handleMarkAsPaid(invoice.id),
                              title: "Mark as Paid",
                              color: "green"
                            }
                          ] : []}
                          size="md"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
          </div>
          <div>
            {/* Pagination controls would go here */}
          </div>
        </div>
      </div>
    </>
  );
} 