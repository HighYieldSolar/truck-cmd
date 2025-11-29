"use client";

import { TrendingUp, Building2, MapPin, RefreshCw } from "lucide-react";

/**
 * Top Customers Sidebar Widget
 * Shows recently added or most active customers
 */
export default function TopCustomers({
  customers = [],
  isLoading = false,
  onViewCustomer
}) {
  // Format date to relative time
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mr-3">
              <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            Recent Customers
          </h3>
        </div>
        <div className="p-4">
          <div className="flex justify-center items-center py-8">
            <RefreshCw size={24} className="animate-spin text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mr-3">
              <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            Recent Customers
          </h3>
        </div>
        <div className="p-6 text-center">
          <Building2 size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No customers yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mr-3">
            <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          Recent Customers
        </h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {customers.slice(0, 5).map((customer, index) => (
          <div
            key={customer.id || index}
            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            onClick={() => onViewCustomer && onViewCustomer(customer)}
          >
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                  {customer.company_name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {customer.city && customer.state ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <MapPin size={10} className="mr-1" />
                      {customer.city}, {customer.state}
                    </p>
                  ) : customer.state ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <MapPin size={10} className="mr-1" />
                      {customer.state}
                    </p>
                  ) : null}
                </div>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                {formatDate(customer.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
