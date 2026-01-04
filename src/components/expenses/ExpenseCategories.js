'use client';

import { useState } from 'react';
import {
  Fuel,
  Wrench,
  Shield,
  MapPin,
  Briefcase,
  FileCheck,
  Coffee,
  Tag,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTranslation } from "@/context/LanguageContext";

/**
 * Expense Categories Sidebar Widget
 *
 * Displays expense categories with amounts and allows filtering.
 * Supports dark mode. Shows top 5 by default with expand option.
 */
export default function ExpenseCategories({
  categories,
  onCategorySelect,
  selectedCategory
}) {
  const { t } = useTranslation('expenses');
  const [showAll, setShowAll] = useState(false);
  const MAX_VISIBLE = 5;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Get category icon with dark mode support
  const getCategoryIcon = (category) => {
    const iconClass = 'h-4 w-4';
    const icons = {
      Fuel: <Fuel className={`${iconClass} text-amber-600 dark:text-amber-400`} />,
      Maintenance: <Wrench className={`${iconClass} text-blue-600 dark:text-blue-400`} />,
      Insurance: <Shield className={`${iconClass} text-green-600 dark:text-green-400`} />,
      Tolls: <MapPin className={`${iconClass} text-purple-600 dark:text-purple-400`} />,
      Office: <Briefcase className={`${iconClass} text-gray-600 dark:text-gray-400`} />,
      Permits: <FileCheck className={`${iconClass} text-indigo-600 dark:text-indigo-400`} />,
      Meals: <Coffee className={`${iconClass} text-red-600 dark:text-red-400`} />,
      Other: <Tag className={`${iconClass} text-gray-600 dark:text-gray-400`} />
    };
    return icons[category] || icons.Other;
  };

  // Filter and sort categories
  const activeCategories = Object.entries(categories || {})
    .filter(([_, amount]) => amount > 0)
    .sort(([_, amountA], [__, amountB]) => amountB - amountA);

  // Empty state
  if (activeCategories.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <Tag className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('categoryWidget.noCategoriesYet')}
        </p>
      </div>
    );
  }

  // Total amount
  const totalAmount = Object.values(categories || {}).reduce((sum, amount) => sum + amount, 0);

  // Determine which categories to display
  const visibleCategories = showAll
    ? activeCategories
    : activeCategories.slice(0, MAX_VISIBLE);

  const hasMoreCategories = activeCategories.length > MAX_VISIBLE;
  const hiddenCount = activeCategories.length - MAX_VISIBLE;

  return (
    <div className="space-y-2">
      {/* Category Items */}
      {visibleCategories.map(([category, amount]) => (
        <button
          key={category}
          onClick={() => onCategorySelect(category)}
          className={`w-full p-3 rounded-lg flex items-center justify-between transition-colors ${
            selectedCategory === category
              ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
              : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2">
            {getCategoryIcon(category)}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {category}
            </span>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 shadow-sm">
            {formatCurrency(amount)}
          </span>
        </button>
      ))}

      {/* Show More/Less Button */}
      {hasMoreCategories && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center gap-1 transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              {t('categoryWidget.showLess')}
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              {t('categoryWidget.showMore', { count: hiddenCount })}
            </>
          )}
        </button>
      )}

      {/* All Categories Option */}
      <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onCategorySelect('All')}
          className={`w-full p-3 rounded-lg flex items-center justify-between transition-colors ${
            selectedCategory === 'All'
              ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
              : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('categoryWidget.allCategories')}
            </span>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 shadow-sm">
            {formatCurrency(totalAmount)}
          </span>
        </button>
      </div>
    </div>
  );
}
