"use client";

/**
 * AutomatedIFTAPanel - Shows real-time automated IFTA mileage from GPS tracking
 * This component displays mileage automatically calculated from ELD GPS breadcrumbs
 * using PostGIS jurisdiction detection (Phase 3 feature)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Zap,
  Navigation,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Truck,
  MapPin,
  Clock,
  TrendingUp,
  Download,
  Sparkles,
  X,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

// State name mapping
const STATE_NAMES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming',
  'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba', 'NB': 'New Brunswick',
  'NL': 'Newfoundland', 'NS': 'Nova Scotia', 'ON': 'Ontario', 'PE': 'Prince Edward Island',
  'QC': 'Quebec', 'SK': 'Saskatchewan'
};

/**
 * @param {string} quarter - Quarter in YYYY-Q# format (e.g., "2024-Q1")
 * @param {string} selectedVehicle - Vehicle ID or "all"
 * @param {function} onDataLoaded - Callback when automated data is loaded
 */
export default function AutomatedIFTAPanel({
  quarter,
  selectedVehicle = 'all',
  onDataLoaded,
  className = ''
}) {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [automatedData, setAutomatedData] = useState(null);
  const [hasEldConnection, setHasEldConnection] = useState(false);
  const [eldProvider, setEldProvider] = useState(null);
  const [boundariesLoaded, setBoundariesLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { canAccess } = useFeatureAccess();
  const hasAccess = canAccess('eldIftaSync');

  // Check ELD connection status
  const checkEldConnection = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: connection } = await supabase
        .from('eld_connections')
        .select('id, provider, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single();

      setHasEldConnection(!!connection);
      setEldProvider(connection?.provider || null);
    } catch (err) {
      setHasEldConnection(false);
    }
  }, []);

  // Check if jurisdiction boundaries are loaded
  const checkBoundaries = useCallback(async () => {
    try {
      const { count } = await supabase
        .from('ifta_jurisdictions')
        .select('*', { count: 'exact', head: true });

      setBoundariesLoaded(count > 0);
    } catch (err) {
      setBoundariesLoaded(false);
    }
  }, []);

  // Load automated mileage data
  const loadAutomatedData = useCallback(async () => {
    if (!hasEldConnection || !quarter) return;

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Parse quarter to get date range
      const [year, q] = quarter.split('-Q');
      const quarterNum = parseInt(q);
      const startMonth = (quarterNum - 1) * 3;
      const startDate = new Date(parseInt(year), startMonth, 1);
      const endDate = new Date(parseInt(year), startMonth + 3, 0);

      // Build query for automated mileage
      let query = supabase
        .from('ifta_automated_mileage')
        .select('*')
        .eq('user_id', user.id)
        .eq('quarter', quarter);

      if (selectedVehicle && selectedVehicle !== 'all') {
        query = query.eq('vehicle_id', selectedVehicle);
      }

      const { data: mileageData, error: mileageError } = await query;

      if (mileageError) {
        // Table might not exist yet
        if (mileageError.code === '42P01') {
          setAutomatedData({ jurisdictions: [], totalMiles: 0, hasData: false });
          return;
        }
        throw mileageError;
      }

      // Aggregate by jurisdiction
      const jurisdictionTotals = {};
      let totalMiles = 0;

      (mileageData || []).forEach(record => {
        const code = record.jurisdiction;
        const miles = parseFloat(record.total_miles) || 0;

        if (!jurisdictionTotals[code]) {
          jurisdictionTotals[code] = {
            code,
            name: STATE_NAMES[code] || code,
            miles: 0,
            crossings: 0
          };
        }

        jurisdictionTotals[code].miles += miles;
        jurisdictionTotals[code].crossings += record.crossing_count || 0;
        totalMiles += miles;
      });

      // Convert to sorted array
      const jurisdictions = Object.values(jurisdictionTotals)
        .filter(j => j.miles > 0)
        .sort((a, b) => b.miles - a.miles);

      // Get recent GPS activity count
      let breadcrumbQuery = supabase
        .from('eld_gps_breadcrumbs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString());

      if (selectedVehicle && selectedVehicle !== 'all') {
        breadcrumbQuery = breadcrumbQuery.eq('vehicle_id', selectedVehicle);
      }

      const { count: breadcrumbCount } = await breadcrumbQuery;

      const result = {
        jurisdictions,
        totalMiles,
        jurisdictionCount: jurisdictions.length,
        breadcrumbCount: breadcrumbCount || 0,
        hasData: totalMiles > 0 || breadcrumbCount > 0,
        quarter,
        lastUpdated: new Date().toISOString()
      };

      setAutomatedData(result);
      onDataLoaded?.(result);
    } catch (err) {
      console.error('Failed to load automated IFTA data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [hasEldConnection, quarter, selectedVehicle, onDataLoaded]);

  // Initial load
  useEffect(() => {
    checkEldConnection();
    checkBoundaries();
  }, [checkEldConnection, checkBoundaries]);

  // Load data when connection is confirmed
  useEffect(() => {
    if (hasEldConnection && hasAccess && quarter) {
      loadAutomatedData();
    } else {
      setLoading(false);
    }
  }, [hasEldConnection, hasAccess, quarter, selectedVehicle, loadAutomatedData]);

  // Refresh data
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadAutomatedData();
    setRefreshing(false);
    setSuccess('Data refreshed');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Format number
  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return Math.round(num).toLocaleString();
  };

  // Collapsed view
  if (!expanded) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        <button
          onClick={() => setExpanded(true)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Automated IFTA Tracking</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {automatedData?.hasData
                  ? `${formatNumber(automatedData.totalMiles)} miles tracked`
                  : 'Real-time GPS mileage tracking'}
              </p>
            </div>
          </div>
          <ChevronDown size={20} className="text-gray-400" />
        </button>
      </div>
    );
  }

  // No ELD IFTA access
  if (!hasAccess) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Automated IFTA Tracking</h3>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronUp size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-full mx-auto flex items-center justify-center mb-4">
            <Sparkles size={32} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            Automated IFTA Mileage Tracking
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            GPS-based jurisdiction detection automatically calculates your state-by-state mileage. Requires Premium plan.
          </p>
          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors text-sm font-medium"
          >
            Upgrade to Premium
          </Link>
        </div>
      </div>
    );
  }

  // No ELD connection
  if (!hasEldConnection && !loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Automated IFTA Tracking</h3>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronUp size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mx-auto flex items-center justify-center mb-4">
            <Truck size={32} className="text-amber-600" />
          </div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            Connect Your ELD
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Connect your ELD provider to enable automatic GPS-based IFTA mileage tracking.
          </p>
          <Link
            href="/dashboard/eld"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Navigation size={16} className="mr-2" />
            Connect ELD
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Automated IFTA Tracking</h3>
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                  Live
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Real-time GPS jurisdiction detection • {eldProvider || 'ELD'} • {quarter}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={16} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronUp size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-5 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div className="mx-5 mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
          <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300 flex-1">{success}</p>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="p-8 flex flex-col items-center justify-center">
          <Loader2 size={32} className="animate-spin text-purple-500 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading automated mileage data...</p>
        </div>
      ) : (
        <div className="p-5">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase">Total Miles</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatNumber(automatedData?.totalMiles)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase">States</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {automatedData?.jurisdictionCount || 0}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Navigation size={16} className="text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300 uppercase">GPS Points</span>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatNumber(automatedData?.breadcrumbCount)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase">Status</span>
              </div>
              <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                {automatedData?.hasData ? 'Active' : 'Waiting'}
              </p>
            </div>
          </div>

          {/* Jurisdiction Breakdown */}
          {automatedData?.jurisdictions?.length > 0 ? (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-500" />
                Automated Mileage by Jurisdiction
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {automatedData.jurisdictions.slice(0, 12).map((jurisdiction) => (
                  <div
                    key={jurisdiction.code}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {jurisdiction.code}
                      </span>
                      {jurisdiction.crossings > 0 && (
                        <span className="text-xs text-gray-400" title="Border crossings">
                          {jurisdiction.crossings}x
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatNumber(jurisdiction.miles)} mi
                    </p>
                  </div>
                ))}
                {automatedData.jurisdictions.length > 12 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 text-center flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      +{automatedData.jurisdictions.length - 12} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6 p-6 text-center bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto flex items-center justify-center mb-3">
                <Navigation size={24} className="text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">No Data Yet</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mileage will appear here as your trucks drive and cross state lines.
              </p>
            </div>
          )}

          {/* Info Section */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <Info size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">How Automated Tracking Works</p>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• GPS coordinates from your ELD are collected in real-time</li>
                <li>• Our system detects when trucks cross state/province borders</li>
                <li>• Mileage is automatically calculated and assigned to each jurisdiction</li>
                <li>• Data updates continuously as your fleet operates</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
