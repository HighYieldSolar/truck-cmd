"use client";

import {
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { Pagination } from "@/hooks/usePagination";

/**
 * Customer Table Component
 * Desktop: Table view with pagination
 * Mobile: Card view
 */
export default function CustomerTable({
  customers,
  pagination,
  onView,
  onEdit,
  onDelete,
  isLoading = false
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  // Status badge colors
  const getStatusColor = (status) => {
    const statusLower = (status || 'active').toLowerCase();
    switch (statusLower) {
      case 'active':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'inactive':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    }
  };

  // Type badge colors
  const getTypeColor = (type) => {
    const typeLower = (type || 'business').toLowerCase();
    switch (typeLower) {
      case 'shipper':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'broker':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'consignee':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      default:
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
    }
  };

  const formatType = (type) => {
    if (!type) return 'Business';
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
        <div className="p-4 space-y-4">
          {Array(5).fill(0).map((_, idx) => (
            <div key={idx} className="animate-pulse flex items-center gap-4 p-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!customers || customers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors duration-200">
        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No customers found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          No customers match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th scope="col" className="w-[25%] px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Company
              </th>
              <th scope="col" className="w-[25%] px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="w-[18%] px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="w-[10%] px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="w-[12%] px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-4 py-4">
                  <button
                    onClick={() => onView(customer)}
                    className="text-left hover:text-blue-600 dark:hover:text-blue-400 w-full"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {customer.company_name}
                    </div>
                    {customer.contact_name && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {customer.contact_name}
                      </div>
                    )}
                  </button>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    {customer.email && (
                      <a
                        href={`mailto:${customer.email}`}
                        className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                        title={customer.email}
                      >
                        <Mail size={14} className="mr-2 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                        <span className="truncate">{customer.email}</span>
                      </a>
                    )}
                    {customer.phone && (
                      <a
                        href={`tel:${customer.phone}`}
                        className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Phone size={14} className="mr-2 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                        <span className="truncate">{customer.phone}</span>
                      </a>
                    )}
                    {!customer.email && !customer.phone && (
                      <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  {customer.city || customer.state ? (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <MapPin size={14} className="mr-2 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                      <span className="truncate">
                        {customer.city && customer.state
                          ? `${customer.city}, ${customer.state}`
                          : customer.state || customer.city}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(customer.customer_type)}`}>
                    {formatType(customer.customer_type)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                    {customer.status || 'Active'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      onClick={() => onView(customer)}
                      className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(customer)}
                      className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                      title="Edit customer"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(customer)}
                      className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete customer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {customers.map((customer) => (
          <div key={customer.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <button
                onClick={() => onView(customer)}
                className="text-left flex-1"
              >
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {customer.company_name}
                </h3>
                {customer.contact_name && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {customer.contact_name}
                  </p>
                )}
              </button>
              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === customer.id ? null : customer.id)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <MoreVertical size={18} />
                </button>
                {openMenuId === customer.id && (
                  <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        onView(customer);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        onEdit(customer);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        onDelete(customer);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center text-gray-600 dark:text-gray-300"
                >
                  <Mail size={14} className="mr-2 text-gray-400 dark:text-gray-500" />
                  {customer.email}
                </a>
              )}
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center text-gray-600 dark:text-gray-300"
                >
                  <Phone size={14} className="mr-2 text-gray-400 dark:text-gray-500" />
                  {customer.phone}
                </a>
              )}
              {(customer.city || customer.state) && (
                <p className="flex items-center text-gray-600 dark:text-gray-300">
                  <MapPin size={14} className="mr-2 text-gray-400 dark:text-gray-500" />
                  {customer.city && customer.state
                    ? `${customer.city}, ${customer.state}`
                    : customer.state || customer.city}
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(customer.customer_type)}`}>
                {formatType(customer.customer_type)}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                {customer.status || 'Active'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageNumbers={pagination.pageNumbers}
            onPageChange={pagination.goToPage}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            showingText={pagination.showingText}
          />
        </div>
      )}
    </div>
  );
}
