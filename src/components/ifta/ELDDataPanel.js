"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Zap,
  FileText,
  Layers,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Download,
  ChevronDown,
  Loader2,
  Link2
} from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/billing/FeatureGate';
import Link from 'next/link';

/**
 * ELDDataPanel - Shows ELD data source options for IFTA reporting
 *
 * @param {string} quarter - Quarter in YYYY-Q# format (e.g., "2024-Q1")
 * @param {function} onDataSourceChange - Callback when data source is changed
 * @param {string} selectedSource - Current selected source: 'eld' | 'manual' | 'combined'
 */
export default function ELDDataPanel({
  quarter,
  onDataSourceChange,
  selectedSource = 'eld'
}) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [hasEldConnection, setHasEldConnection] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  const { canAccess } = useFeatureAccess();
  const hasAccess = canAccess('eldIftaSync');

  useEffect(() => {
    if (hasAccess && quarter) {
      loadSummary();
    } else {
      setLoading(false);
    }
  }, [hasAccess, quarter]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for ELD connection
      const connectionsRes = await fetch('/api/eld/connections');
      const connectionsData = await connectionsRes.json();
      setHasEldConnection(connectionsData.connections?.length > 0);

      // Get mileage summary for the quarter
      const response = await fetch(`/api/eld/ifta/summary?quarter=${quarter}`);
      const data = await response.json();

      if (response.ok) {
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to load ELD summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportEldData = async () => {
    if (importing) return;
    setImporting(true);

    try {
      const response = await fetch('/api/eld/ifta/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quarter })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      // Reload summary
      await loadSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const dataSourceOptions = [
    {
      id: 'eld',
      name: 'ELD Data',
      description: 'Use mileage from your connected ELD provider',
      icon: Zap,
      recommended: true,
      disabled: !hasEldConnection
    },
    {
      id: 'manual',
      name: 'Manual Entry',
      description: 'Use trips from State Mileage Tracker',
      icon: FileText,
      recommended: false,
      disabled: false
    },
    {
      id: 'combined',
      name: 'Combined',
      description: 'Merge ELD and manual data',
      icon: Layers,
      recommended: false,
      disabled: !hasEldConnection
    }
  ];

  // Show feature gate if no access
  if (!hasAccess) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-gray-700 dark:text-gray-200">ELD Data Import</h3>
          </div>
        </div>
        <div className="p-5">
          <FeatureGate feature="eldIftaSync" fallback="prompt" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  // No ELD connection
  if (!hasEldConnection) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-gray-700 dark:text-gray-200">ELD Data Import</h3>
          </div>
        </div>

        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Link2 size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Connect Your ELD
          </h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
            Automatically import jurisdiction mileage from your ELD provider for faster, more accurate IFTA reporting.
          </p>
          <Link
            href="/dashboard/settings/eld"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Zap size={16} />
            Connect ELD Provider
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-white" />
            <h3 className="font-medium text-white">ELD Data for {quarter}</h3>
          </div>
          <button
            onClick={loadSummary}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded transition-colors"
          >
            <RefreshCw size={14} className="text-white" />
          </button>
        </div>
      </div>

      {/* Data Source Selector */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select Data Source
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dataSourceOptions.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = selectedSource === option.id;

            return (
              <button
                key={option.id}
                onClick={() => !option.disabled && onDataSourceChange?.(option.id)}
                disabled={option.disabled}
                className={`
                  relative p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                  ${option.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                  }
                `}
              >
                {option.recommended && !option.disabled && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                    Recommended
                  </span>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <OptionIcon size={18} className={
                    isSelected
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  } />
                  <span className={`font-medium ${
                    isSelected
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {option.name}
                  </span>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {option.description}
                </p>

                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle size={16} className="text-blue-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Data Summary
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.eldMileage?.totalMiles?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ELD Miles</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.manualMileage?.totalMiles?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manual Miles</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.eldMileage?.jurisdictionCount || '0'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ELD States</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.manualMileage?.jurisdictionCount || '0'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manual States</p>
            </div>
          </div>

          {/* Discrepancy Warning */}
          {summary.comparison?.hasDifference && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Data Discrepancy Detected
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                    ELD and manual entries differ by {summary.comparison.differencePercent}%.
                    Review your data before submitting.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-5 bg-gray-50 dark:bg-gray-700/30">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleImportEldData}
            disabled={importing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {importing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {importing ? 'Importing...' : 'Import Latest ELD Data'}
          </button>

          {summary?.lastImportedAt && (
            <p className="text-xs text-gray-500 dark:text-gray-400 self-center">
              Last imported: {new Date(summary.lastImportedAt).toLocaleString()}
            </p>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
