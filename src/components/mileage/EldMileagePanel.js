"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Truck,
  MapPin,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowRight,
  BarChart2,
  Calendar,
  Navigation,
  Info,
  X,
  AlertTriangle
} from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

/**
 * EldMileagePanel - Shows ELD mileage data and allows importing to IFTA
 * Displays comparison between ELD-tracked and manually entered mileage
 */
export default function EldMileagePanel({ className = '' }) {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hasEldConnection, setHasEldConnection] = useState(false);
  const [eldProvider, setEldProvider] = useState(null);

  // Quarter selection
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `${now.getFullYear()}-Q${quarter}`;
  });

  // Mileage data
  const [summaryData, setSummaryData] = useState(null);

  const { canAccess } = useFeatureAccess();
  const hasEldIftaAccess = canAccess('eldIftaSync');

  // Generate quarter options (current + last 4 quarters)
  const quarterOptions = useCallback(() => {
    const options = [];
    const now = new Date();

    for (let i = 0; i < 5; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      options.push(`${year}-Q${quarter}`);
    }

    return [...new Set(options)]; // Remove duplicates
  }, []);

  // Check ELD connection
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

  // Load mileage summary
  const loadMileageSummary = useCallback(async () => {
    if (!hasEldConnection) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/eld/ifta/summary?quarter=${selectedQuarter}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load mileage summary');
      }

      setSummaryData(data);
    } catch (err) {
      console.error('Failed to load mileage summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [hasEldConnection, selectedQuarter]);

  // Initial load
  useEffect(() => {
    checkEldConnection();
  }, [checkEldConnection]);

  // Load data when connection is confirmed
  useEffect(() => {
    if (hasEldConnection && hasEldIftaAccess) {
      loadMileageSummary();
    } else {
      setLoading(false);
    }
  }, [hasEldConnection, hasEldIftaAccess, loadMileageSummary]);

  // Import ELD mileage to IFTA
  const handleImport = async () => {
    if (importing) return;

    try {
      setImporting(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/eld/ifta/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quarter: selectedQuarter })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import mileage data');
      }

      setSuccess(`Successfully imported ${data.recordsImported} records (${data.totalMiles.toLocaleString()} miles across ${data.jurisdictions} states)`);

      // Reload summary
      await loadMileageSummary();
    } catch (err) {
      console.error('Import failed:', err);
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadMileageSummary();
    setRefreshing(false);
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return Math.round(num).toLocaleString();
  };

  // Calculate difference percentage
  const getDifferenceInfo = () => {
    if (!summaryData?.comparison) return null;

    const { hasDifference, differencePercent } = summaryData.comparison;

    if (!hasDifference) {
      return { type: 'success', message: 'ELD and manual mileage match' };
    }

    if (Math.abs(differencePercent) <= 5) {
      return { type: 'warning', message: `${differencePercent > 0 ? '+' : ''}${differencePercent.toFixed(1)}% difference` };
    }

    return { type: 'error', message: `${differencePercent > 0 ? '+' : ''}${differencePercent.toFixed(1)}% difference - review recommended` };
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
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <Navigation size={20} className="text-teal-600 dark:text-teal-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">ELD Mileage Import</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {hasEldConnection ? `Connected to ${eldProvider || 'ELD'}` : 'Connect ELD to import mileage'}
              </p>
            </div>
          </div>
          <ChevronDown size={20} className="text-gray-400" />
        </button>
      </div>
    );
  }

  // No ELD IFTA access
  if (!hasEldIftaAccess) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <Navigation size={20} className="text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">ELD Mileage Import</h3>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronUp size={20} className="text-gray-400" />
          </button>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center mb-4">
            <Truck size={32} className="text-gray-400" />
          </div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            Automatic ELD Mileage Import
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Import state-by-state mileage directly from your ELD. Requires Premium plan or higher.
          </p>
          <Link
            href="/dashboard/upgrade"
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
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
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <Navigation size={20} className="text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">ELD Mileage Import</h3>
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
            Connect your ELD provider to automatically import state-by-state mileage for IFTA reporting.
          </p>
          <Link
            href="/dashboard/settings/eld"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Connect ELD
          </Link>
        </div>
      </div>
    );
  }

  const differenceInfo = getDifferenceInfo();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <Navigation size={20} className="text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">ELD Mileage Import</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Connected to {eldProvider || 'ELD Provider'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quarter Selector */}
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {quarterOptions().map(q => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={16} className={`text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Collapse */}
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
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div className="mx-5 mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
          <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-teal-500" />
        </div>
      ) : (
        <div className="p-5">
          {/* Mileage Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* ELD Mileage */}
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 border border-teal-200 dark:border-teal-800">
              <div className="flex items-center gap-2 mb-2">
                <Navigation size={16} className="text-teal-600" />
                <span className="text-sm font-medium text-teal-700 dark:text-teal-300">ELD Mileage</span>
              </div>
              <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                {formatNumber(summaryData?.eldMileage?.totalMiles)} mi
              </p>
              <p className="text-sm text-teal-600 dark:text-teal-400">
                {summaryData?.eldMileage?.jurisdictionCount || 0} states
              </p>
            </div>

            {/* Manual Mileage */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Manual Entries</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatNumber(summaryData?.manualMileage?.totalMiles)} mi
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {summaryData?.manualMileage?.jurisdictionCount || 0} states
              </p>
            </div>

            {/* Comparison */}
            <div className={`rounded-xl p-4 border ${
              differenceInfo?.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : differenceInfo?.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 size={16} className={
                  differenceInfo?.type === 'success' ? 'text-green-600' :
                  differenceInfo?.type === 'warning' ? 'text-amber-600' : 'text-red-600'
                } />
                <span className={`text-sm font-medium ${
                  differenceInfo?.type === 'success' ? 'text-green-700 dark:text-green-300' :
                  differenceInfo?.type === 'warning' ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'
                }`}>Comparison</span>
              </div>
              <p className={`text-lg font-bold ${
                differenceInfo?.type === 'success' ? 'text-green-900 dark:text-green-100' :
                differenceInfo?.type === 'warning' ? 'text-amber-900 dark:text-amber-100' : 'text-red-900 dark:text-red-100'
              }`}>
                {differenceInfo?.message || 'No data'}
              </p>
              {summaryData?.lastImportedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Last import: {new Date(summaryData.lastImportedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* State Breakdown */}
          {summaryData?.eldMileage?.jurisdictions?.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                ELD Mileage by State
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {summaryData.eldMileage.jurisdictions.slice(0, 12).map((jurisdiction) => (
                  <div
                    key={jurisdiction.state}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 text-center"
                  >
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {jurisdiction.state}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatNumber(jurisdiction.miles)} mi
                    </p>
                  </div>
                ))}
                {summaryData.eldMileage.jurisdictions.length > 12 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      +{summaryData.eldMileage.jurisdictions.length - 12} more
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Info size={16} className="flex-shrink-0 mt-0.5" />
              <p>
                Import ELD mileage to your IFTA records for {selectedQuarter}.
                This will create jurisdiction records for tax filing.
              </p>
            </div>
            <button
              onClick={handleImport}
              disabled={importing || !summaryData?.eldMileage?.totalMiles}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
            >
              {importing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Import to IFTA
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
