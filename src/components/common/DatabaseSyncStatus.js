// src/components/common/DatabaseSyncStatus.js
"use client";

import { useState } from "react";
import { RefreshCw, AlertCircle, Check, Clock, X } from "lucide-react";

/**
 * Database Sync Status Component
 * Displays the current status of database connection and synchronization
 * 
 * @param {Object} props Component props
 * @param {boolean} props.isConnected Whether database is connected
 * @param {boolean} props.isRefreshing Whether data is being refreshed
 * @param {Date} props.lastRefresh Last refresh timestamp
 * @param {boolean} props.autoRefreshEnabled Whether auto refresh is enabled
 * @param {Function} props.onToggleAutoRefresh Toggle auto refresh function
 * @param {Function} props.onManualRefresh Trigger manual refresh function
 * @param {string} props.error Error message if any
 * @param {string} props.className Additional CSS classes
 */
export default function DatabaseSyncStatus({
  isConnected = true,
  isRefreshing = false,
  lastRefresh = null,
  autoRefreshEnabled = true,
  onToggleAutoRefresh = () => {},
  onManualRefresh = () => {},
  error = null,
  className = ""
}) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return "Never";
    
    return new Date(date).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border ${isConnected ? 'border-gray-200' : 'border-red-300'} ${className}`}>
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center">
          {isConnected ? (
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
          ) : (
            <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
          )}
          <span className="text-sm font-medium text-gray-700">
            {isConnected ? "Connected" : "Connection Issue"}
          </span>
          <button 
            className="ml-2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <X size={14} />
            ) : (
              <span className="text-xs underline">Details</span>
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 hidden sm:inline-block">
            Last sync: {formatDate(lastRefresh)}
          </span>
          
          <button
            onClick={onManualRefresh}
            className={`p-1.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 ${isRefreshing ? 'bg-blue-50' : ''}`}
            disabled={isRefreshing}
            title="Refresh data"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
          
          <div className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={autoRefreshEnabled}
              onChange={onToggleAutoRefresh}
              id="auto-refresh-toggle"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
            <label htmlFor="auto-refresh-toggle" className="ml-2 text-xs text-gray-500 cursor-pointer hidden sm:block">Auto</label>
          </div>
        </div>
      </div>
      
      {/* Expanded details */}
      {showDetails && (
        <div className="border-t border-gray-200 px-3 py-2 bg-gray-50 text-xs">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Last sync:</span>
            <span className="font-medium text-gray-700">{formatDate(lastRefresh)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Auto-refresh:</span>
            <span className={`font-medium ${autoRefreshEnabled ? 'text-blue-600' : 'text-gray-500'}`}>
              {autoRefreshEnabled ? 'Enabled (5 min)' : 'Disabled'}
            </span>
          </div>
          
          {error && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 rounded border border-red-200 flex items-start">
              <AlertCircle size={12} className="mt-0.5 mr-1 flex-shrink-0" />
              <span className="text-xs">{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}