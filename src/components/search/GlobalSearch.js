"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  X,
  Truck,
  FileText,
  Users,
  Wallet,
  UserCircle,
  Package,
  CheckCircle,
  Fuel,
  Clock,
  ArrowRight,
  Command,
  Loader2,
  Plus,
  Calculator,
  MapPin,
  Settings,
  BarChart3
} from "lucide-react";
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  getEntityDisplayName,
  SEARCH_ENTITY_TYPES
} from "@/lib/services/searchService";
import { useTranslation } from "@/context/LanguageContext";

// Icon mapping for entity types
const ENTITY_ICONS = {
  [SEARCH_ENTITY_TYPES.LOADS]: Truck,
  [SEARCH_ENTITY_TYPES.INVOICES]: FileText,
  [SEARCH_ENTITY_TYPES.CUSTOMERS]: Users,
  [SEARCH_ENTITY_TYPES.EXPENSES]: Wallet,
  [SEARCH_ENTITY_TYPES.DRIVERS]: UserCircle,
  [SEARCH_ENTITY_TYPES.VEHICLES]: Package,
  [SEARCH_ENTITY_TYPES.COMPLIANCE]: CheckCircle,
  [SEARCH_ENTITY_TYPES.FUEL]: Fuel
};

// Status colors
const STATUS_COLORS = {
  // Load statuses
  'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Assigned': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'In Transit': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'Delivered': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  // Invoice statuses
  'Draft': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'Paid': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'Overdue': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  // General statuses
  'Active': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'Inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'Expired': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};

// Quick links configuration with translation keys
const QUICK_LINKS = [
  {
    categoryKey: 'create',
    items: [
      { nameKey: 'newLoad', descKey: 'newLoadDesc', href: '/dashboard/dispatching', icon: Truck },
      { nameKey: 'newInvoice', descKey: 'newInvoiceDesc', href: '/dashboard/invoices/new', icon: FileText },
      { nameKey: 'addExpense', descKey: 'addExpenseDesc', href: '/dashboard/expenses', icon: Wallet },
      { nameKey: 'addCustomer', descKey: 'addCustomerDesc', href: '/dashboard/customers', icon: Users },
    ]
  },
  {
    categoryKey: 'navigate',
    items: [
      { nameKey: 'dashboard', descKey: 'dashboardDesc', href: '/dashboard', icon: BarChart3 },
      { nameKey: 'iftaCalculator', descKey: 'iftaCalculatorDesc', href: '/dashboard/ifta', icon: Calculator },
      { nameKey: 'stateMileage', descKey: 'stateMileageDesc', href: '/dashboard/mileage', icon: MapPin },
      { nameKey: 'fuelTracker', descKey: 'fuelTrackerDesc', href: '/dashboard/fuel', icon: Fuel },
    ]
  },
  {
    categoryKey: 'manage',
    items: [
      { nameKey: 'fleet', descKey: 'fleetDesc', href: '/dashboard/fleet', icon: Package },
      { nameKey: 'compliance', descKey: 'complianceDesc', href: '/dashboard/compliance', icon: CheckCircle },
      { nameKey: 'settings', descKey: 'settingsDesc', href: '/dashboard/settings', icon: Settings },
    ]
  }
];

export default function GlobalSearch({ isOpen, onClose, isMobile = false }) {
  const { t } = useTranslation('common');
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const router = useRouter();

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults({});
      setError(null);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({});
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      await performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      const flatResults = getFlatResults();
      const totalItems = flatResults.length;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && flatResults[selectedIndex]) {
            handleResultClick(flatResults[selectedIndex]);
          } else if (query.trim().length >= 2) {
            // Just save the search if no result selected
            saveRecentSearch(query);
            setRecentSearches(getRecentSearches());
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, results, query, onClose]);

  // Flatten results for keyboard navigation
  const getFlatResults = useCallback(() => {
    const flat = [];
    Object.entries(results).forEach(([type, items]) => {
      items.forEach(item => flat.push({ ...item, type }));
    });
    return flat;
  }, [results]);

  // Perform search
  const performSearch = async (searchQuery) => {
    setLoading(true);
    setError(null);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError(t('globalSearch.pleaseLogIn'));
        setLoading(false);
        return;
      }

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          query: searchQuery,
          limitPerType: 5
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data.results || {});

      if (data.totalCount === 0) {
        setError(t('globalSearch.noResults'));
      }
    } catch (err) {
      setError(err.message || "Search failed");
      setResults({});
    } finally {
      setLoading(false);
    }
  };

  // Handle result click
  const handleResultClick = (result) => {
    saveRecentSearch(query);
    setRecentSearches(getRecentSearches());

    // Navigate to the result
    if (result.route) {
      // For items with an ID, navigate to detail view if available
      router.push(result.route);
    }

    onClose();
  };

  // Handle recent search click
  const handleRecentSearchClick = (searchTerm) => {
    setQuery(searchTerm);
  };

  // Handle quick link click
  const handleQuickLinkClick = (href) => {
    router.push(href);
    onClose();
  };

  // Clear recent searches
  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  // Get icon component for entity type
  const getEntityIcon = (type) => {
    const IconComponent = ENTITY_ICONS[type] || Search;
    return <IconComponent size={16} />;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    if (!status) return null;
    const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorClass}`}>
        {status}
      </span>
    );
  };

  // Count total results
  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  if (!isOpen) return null;

  return (
    <div className={`${isMobile ? '' : 'fixed inset-0 z-50'}`}>
      {/* Backdrop */}
      {!isMobile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Search Modal */}
      <div className={`${isMobile
        ? 'w-full'
        : 'fixed top-[5%] sm:top-[10%] left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 w-full max-w-2xl mx-auto px-3 sm:px-4'
      }`}>
        <div className={`bg-white dark:bg-gray-800 ${isMobile ? '' : 'rounded-xl shadow-2xl'} border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col`}>
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <Search size={20} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('globalSearch.placeholder')}
              className="flex-1 ml-3 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-base"
              autoComplete="off"
            />
            {loading && (
              <Loader2 size={20} className="text-blue-500 animate-spin mr-2" />
            )}
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={18} />
              </button>
            )}
            {!isMobile && (
              <button
                onClick={onClose}
                className="ml-2 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded"
              >
                ESC
              </button>
            )}
          </div>

          {/* Results Area */}
          <div
            ref={resultsRef}
            className="max-h-[60vh] overflow-y-auto"
          >
            {/* No query - show quick links and recent searches */}
            {!query && (
              <div className="p-4">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
                        <Clock size={14} className="mr-1.5" />
                        {t('globalSearch.recentSearches')}
                      </h3>
                      <button
                        onClick={handleClearRecent}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {t('globalSearch.clear')}
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((term, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRecentSearchClick(term)}
                          className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left"
                        >
                          <Search size={14} className="text-gray-400 mr-3" />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Links */}
                <div className="space-y-4">
                  {QUICK_LINKS.map((section) => (
                    <div key={section.categoryKey}>
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                        {section.categoryKey === 'create' && <Plus size={14} className="mr-1.5" />}
                        {section.categoryKey === 'navigate' && <ArrowRight size={14} className="mr-1.5" />}
                        {section.categoryKey === 'manage' && <Settings size={14} className="mr-1.5" />}
                        {t(`globalSearch.categories.${section.categoryKey}`)}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.nameKey}
                              onClick={() => handleQuickLinkClick(item.href)}
                              className="flex items-center px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left group transition-colors"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center mr-3 transition-colors">
                                <Icon size={16} className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium truncate">{t(`globalSearch.quickLinks.${item.nameKey}`)}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{t(`globalSearch.quickLinks.${item.descKey}`)}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Query too short */}
            {query && query.trim().length < 2 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Search size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('globalSearch.typeAtLeast')}</p>
              </div>
            )}

            {/* Error state */}
            {error && !loading && query.trim().length >= 2 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Search size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Results */}
            {!error && totalResults > 0 && (
              <div className="py-2">
                {Object.entries(results).map(([type, items]) => (
                  <div key={type} className="mb-2">
                    <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
                      {getEntityDisplayName(type)}
                      <span className="ml-2 text-gray-400 dark:text-gray-500">({items.length})</span>
                    </h3>
                    <div className="px-2">
                      {items.map((item, idx) => {
                        const flatIndex = getFlatResults().findIndex(
                          r => r.id === item.id && r.type === type
                        );
                        const isSelected = selectedIndex === flatIndex;

                        return (
                          <button
                            key={item.id}
                            onClick={() => handleResultClick(item)}
                            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-colors ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-900/30'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                              isSelected
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {getEntityIcon(type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {item.title}
                                </span>
                                {item.status && (
                                  <span className="ml-2">
                                    {getStatusBadge(item.status)}
                                  </span>
                                )}
                              </div>
                              {item.subtitle && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                            <ArrowRight size={16} className={`flex-shrink-0 ml-2 ${
                              isSelected
                                ? 'text-blue-500 dark:text-blue-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with keyboard hints */}
          {!isMobile && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] mr-1">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] mr-1">↓</kbd>
                  {t('globalSearch.keyboard.navigate')}
                </span>
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] mr-1">Enter</kbd>
                  {t('globalSearch.keyboard.select')}
                </span>
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] mr-1">Esc</kbd>
                  {t('globalSearch.keyboard.close')}
                </span>
              </div>
              {totalResults > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {totalResults} {totalResults !== 1 ? t('globalSearch.results') : t('globalSearch.result')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

