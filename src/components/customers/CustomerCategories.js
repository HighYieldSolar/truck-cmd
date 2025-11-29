"use client";

import { Package, Briefcase, Building2, Truck, Users, Tag, Check } from "lucide-react";

/**
 * Customer Categories Sidebar Widget
 * Shows customer type distribution and allows filtering
 */
export default function CustomerCategories({
  customers = [],
  selectedType = 'all',
  onTypeSelect,
  isLoading = false
}) {
  // Calculate category counts
  const getCategoryCounts = () => {
    const counts = {
      shipper: 0,
      broker: 0,
      consignee: 0,
      direct: 0,
      'freight-forwarder': 0,
      '3pl': 0,
      business: 0,
      other: 0
    };

    customers.forEach(customer => {
      const type = (customer.customer_type || 'business').toLowerCase();
      if (counts.hasOwnProperty(type)) {
        counts[type]++;
      } else {
        counts.other++;
      }
    });

    return counts;
  };

  const counts = getCategoryCounts();

  const categories = [
    { key: 'shipper', label: 'Shippers', icon: Package, color: 'blue' },
    { key: 'broker', label: 'Brokers', icon: Briefcase, color: 'amber' },
    { key: 'consignee', label: 'Consignees', icon: Truck, color: 'emerald' },
    { key: 'direct', label: 'Direct', icon: Users, color: 'purple' },
    { key: 'business', label: 'Business', icon: Building2, color: 'slate' }
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      active: 'ring-blue-500 dark:ring-blue-400'
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400',
      active: 'ring-amber-500 dark:ring-amber-400'
    },
    emerald: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      active: 'ring-emerald-500 dark:ring-emerald-400'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      active: 'ring-purple-500 dark:ring-purple-400'
    },
    slate: {
      bg: 'bg-slate-100 dark:bg-slate-900/30',
      text: 'text-slate-600 dark:text-slate-400',
      active: 'ring-slate-500 dark:ring-slate-400'
    }
  };

  // Filter to only show categories with customers
  const activeCategories = categories.filter(cat => counts[cat.key] > 0);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mr-3">
              <Tag size={16} className="text-purple-600 dark:text-purple-400" />
            </div>
            Customer Types
          </h3>
        </div>
        <div className="p-4 space-y-2">
          {Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="animate-pulse flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-5 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mr-3">
            <Tag size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
          Customer Types
        </h3>
      </div>
      <div className="p-3 space-y-1">
        {/* All option */}
        <button
          onClick={() => onTypeSelect('all')}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${
            selectedType === 'all'
              ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 dark:ring-blue-400'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Users size={16} className="text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">All Types</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
              {customers.length}
            </span>
            {selectedType === 'all' && (
              <Check size={14} className="text-blue-500 dark:text-blue-400" />
            )}
          </div>
        </button>

        {/* Individual categories */}
        {activeCategories.map(category => {
          const Icon = category.icon;
          const colors = colorClasses[category.color];
          const isSelected = selectedType === category.key;

          return (
            <button
              key={category.key}
              onClick={() => onTypeSelect(category.key)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all ${
                isSelected
                  ? `bg-${category.color}-50 dark:bg-${category.color}-900/20 ring-2 ${colors.active}`
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <Icon size={16} className={colors.text} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {category.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                  {counts[category.key]}
                </span>
                {isSelected && (
                  <Check size={14} className={colors.text} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
