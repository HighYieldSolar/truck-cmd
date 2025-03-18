// src/app/(dashboard)/dashboard/admin/fix-earnings/page.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { validateEarningsTable } from "@/lib/utils/validateEarningsTable";
import { syncFactoredLoads } from "@/lib/utils/syncFactoredLoads";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  ArrowLeft,
  Terminal,
  Database
} from "lucide-react";
import Link from "next/link";

export default function FixEarningsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [tableStatus, setTableStatus] = useState(null);
  const [syncResults, setSyncResults] = useState(null);
  
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    async function checkUser() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        if (!user) {
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        setLoading(false);
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError(err.message || 'Authentication error');
        setLoading(false);
      }
    }
    
    checkUser();
  }, []);

  const handleValidateTable = async () => {
    try {
      setValidating(true);
      setError(null);
      
      const validationResult = await validateEarningsTable();
      setTableStatus(validationResult);
    } catch (err) {
      console.error('Error validating earnings table:', err);
      setError(err.message || 'Failed to validate earnings table');
    } finally {
      setValidating(false);
    }
  };
  
  const handleSyncFactoredLoads = async () => {
    if (!user) return;
    
    try {
      setSyncing(true);
      setError(null);
      
      const result = await syncFactoredLoads(user.id);
      setSyncResults(result);
    } catch (err) {
      console.error('Error syncing factored loads:', err);
      setError(err.message || 'Failed to sync factored loads');
    } finally {
      setSyncing(false);
    }
  };

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activePage="dashboard">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-blue-500 mr-2" />
            <span>Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="dashboard">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <Link href="/dashboard" className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Earnings Fix Utility</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="bg-blue-50 p-6 border-b border-blue-100">
            <h2 className="text-xl font-semibold text-gray-900">Factored Loads & Earnings Sync</h2>
            <p className="text-gray-600 mt-2">
              This utility helps fix issues with factored loads and earnings records.
            </p>
          </div>
          
          <div className="p-6">
            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Table Validation Section */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection('validation')}
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <Database size={20} className="text-blue-600 mr-3" />
                  <h3 className="text-lg font-medium">Validate Earnings Table</h3>
                </div>
                {expandedSection === 'validation' ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </button>
              
              {expandedSection === 'validation' && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <p className="mb-4 text-gray-700">
                    This will check if your earnings table exists and has the correct permissions set up.
                  </p>
                  
                  <button
                    onClick={handleValidateTable}
                    disabled={validating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {validating ? (
                      <>
                        <RefreshCw size={18} className="animate-spin mr-2" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Database size={18} className="mr-2" />
                        Validate Earnings Table
                      </>
                    )}
                  </button>
                  
                  {tableStatus && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Results:</h4>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center">
                          {tableStatus.tableExists ? (
                            <CheckCircle size={18} className="text-green-500 mr-2" />
                          ) : (
                            <AlertCircle size={18} className="text-red-500 mr-2" />
                          )}
                          <span>Table exists: {tableStatus.tableExists ? 'Yes' : 'No'}</span>
                        </div>
                        
                        {tableStatus.tableExists && (
                          <div className="flex items-center">
                            {tableStatus.hasPermissions ? (
                              <CheckCircle size={18} className="text-green-500 mr-2" />
                            ) : (
                              <AlertCircle size={18} className="text-red-500 mr-2" />
                            )}
                            <span>Has correct permissions: {tableStatus.hasPermissions ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                      </div>
                      
                      {tableStatus.issueSummary.length > 0 && (
                        <div className="mt-2">
                          <h5 className="font-medium text-gray-900">Issues Found:</h5>
                          <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-gray-700">
                            {tableStatus.issueSummary.map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {tableStatus.fixCommands.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium text-gray-900">SQL Fix Commands:</h5>
                          <div className="mt-2 bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                            <pre className="text-sm font-mono">
                              {tableStatus.fixCommands.join('\n\n')}
                            </pre>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            Run these commands in your Supabase SQL Editor to fix the issues.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Sync Factored Loads Section */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection('sync')}
                className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <RefreshCw size={20} className="text-green-600 mr-3" />
                  <h3 className="text-lg font-medium">Sync Factored Loads</h3>
                </div>
                {expandedSection === 'sync' ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </button>
              
              {expandedSection === 'sync' && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <p className="mb-4 text-gray-700">
                    This will find loads that are marked as factored but don&apos;t have corresponding earnings records and create them.
                  </p>
                  
                  <button
                    onClick={handleSyncFactoredLoads}
                    disabled={syncing}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw size={18} className="animate-spin mr-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={18} className="mr-2" />
                        Sync Factored Loads
                      </>
                    )}
                  </button>
                  
                  {syncResults && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Sync Results:</h4>
                      
                      <div className="p-4 rounded-lg border bg-white">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-green-50 p-3 rounded-md">
                            <p className="text-sm text-gray-600">Records Synced</p>
                            <p className="text-xl font-semibold text-green-700">{syncResults.synced}</p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-md">
                            <p className="text-sm text-gray-600">Already In Sync</p>
                            <p className="text-xl font-semibold text-blue-700">{syncResults.skipped}</p>
                          </div>
                          {syncResults.failed > 0 && (
                            <div className="bg-red-50 p-3 rounded-md">
                              <p className="text-sm text-gray-600">Failed</p>
                              <p className="text-xl font-semibold text-red-700">{syncResults.failed}</p>
                            </div>
                          )}
                        </div>
                        
                        {syncResults.details.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Detailed Results:</h5>
                            <div className="max-h-60 overflow-y-auto border rounded">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Load #
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Status
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Details
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {syncResults.details.map((item, index) => (
                                    <tr key={index}>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.loadNumber}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                          item.status === 'synced' 
                                            ? 'bg-green-100 text-green-800' 
                                            : item.status === 'error'
                                              ? 'bg-red-100 text-red-800'
                                              : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {item.status === 'synced' ? 'Synced' : 
                                           item.status === 'error' ? 'Error' : item.status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500">
                                        {item.message}
                                        {item.amount && ` ($${parseFloat(item.amount).toFixed(2)})`}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}