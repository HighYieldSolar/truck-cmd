// src/app/test-db/page.js
"use client";

import { useState, useEffect } from "react";
import { supabase, testConnection } from "@/lib/supabaseClient";

export default function TestDBPage() {
  const [connectionStatus, setConnectionStatus] = useState("Testing...");
  const [authStatus, setAuthStatus] = useState("Checking...");
  const [error, setError] = useState(null);
  const [envVars, setEnvVars] = useState({});
  const [tableChecks, setTableChecks] = useState({
    ifta_trips: "Checking...",
    ifta_tax_rates: "Checking...",
    fuel_entries: "Checking..."
  });
  const [storageCheck, setStorageCheck] = useState("Checking...");

  useEffect(() => {
    async function checkConnection() {
      try {
        // Get environment variables (redacted)
        setEnvVars({
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
            `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 8)}...` : "Not set",
          supabaseKeySet: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set (Redacted)" : "Not set",
        });
        
        // Test basic connection
        const result = await testConnection();
        if (result.success) {
          setConnectionStatus("Connected successfully!");
        } else {
          setConnectionStatus("Connection failed");
          setError(result.error);
          return; // Don't continue with other checks if basic connection fails
        }

        // Check authentication
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) {
          setAuthStatus(`Error: ${authError.message}`);
        } else if (session) {
          setAuthStatus(`Authenticated as ${session.user.email}`);
        } else {
          setAuthStatus("Not authenticated");
        }

        // Check tables
        await checkTable('ifta_trips');
        await checkTable('ifta_tax_rates');
        await checkTable('fuel_entries');
        
        // Check storage
        await checkStorage();
        
      } catch (err) {
        setConnectionStatus("Connection failed");
        setError(err);
      }
    }
    
    // Helper to check if tables exist and accessible
    async function checkTable(tableName) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          setTableChecks(prev => ({
            ...prev,
            [tableName]: `Error: ${error.message}`
          }));
        } else {
          setTableChecks(prev => ({
            ...prev,
            [tableName]: `Accessible (Row Level Security is working)`
          }));
        }
      } catch (err) {
        setTableChecks(prev => ({
          ...prev,
          [tableName]: `Error: ${err.message}`
        }));
      }
    }

// Helper to check storage - with better error handling
async function checkStorage() {
  try {
    // First check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      setStorageCheck(`Error listing buckets: ${listError.message}`);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'receipts');
    
    if (!bucketExists) {
      setStorageCheck('Storage bucket "receipts" does not exist. You need to create it in the Supabase dashboard.');
      return;
    }
    
    // If bucket exists, try to access it
    const { data, error } = await supabase.storage.from('receipts').list();
    
    if (error) {
      setStorageCheck(`Error accessing bucket: ${error.message}`);
    } else {
      setStorageCheck('Storage bucket "receipts" exists and is accessible');
    }
  } catch (err) {
    setStorageCheck(`Error: ${err.message}`);
  }
}
    
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Supabase Connection Test</h1>
          
          <div className="mb-6 p-4 rounded bg-gray-50">
            <h2 className="font-medium mb-2 text-lg">Connection Status:</h2>
            <div className={`py-2 px-3 rounded ${
              connectionStatus === "Connected successfully!" ? 
                "bg-green-100 text-green-800" : 
                connectionStatus === "Testing..." ? 
                  "bg-yellow-100 text-yellow-800" : 
                  "bg-red-100 text-red-800"
            }`}>
              {connectionStatus}
            </div>
          </div>
          
          <div className="mb-6 p-4 rounded bg-gray-50">
            <h2 className="font-medium mb-2 text-lg">Authentication Status:</h2>
            <div className={`py-2 px-3 rounded ${
              authStatus.includes("Authenticated") ? 
                "bg-green-100 text-green-800" : 
                authStatus === "Checking..." ? 
                  "bg-yellow-100 text-yellow-800" : 
                  "bg-red-100 text-red-800"
            }`}>
              {authStatus}
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="font-medium mb-2 text-lg">Environment Variables:</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(envVars, null, 2)}
            </pre>
          </div>
          
          <div className="mb-6">
            <h2 className="font-medium mb-2 text-lg">Table Access:</h2>
            <div className="space-y-2">
              {Object.entries(tableChecks).map(([table, status]) => (
                <div key={table} className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">{table}:</span>
                  <span className={`py-1 px-2 rounded text-sm ${
                    status.includes("Accessible") ? 
                      "bg-green-100 text-green-800" : 
                      status === "Checking..." ? 
                        "bg-yellow-100 text-yellow-800" : 
                        "bg-red-100 text-red-800"
                  }`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="font-medium mb-2 text-lg">Storage:</h2>
            <div className={`py-2 px-3 rounded ${
              storageCheck.includes("exists") ? 
                "bg-green-100 text-green-800" : 
                storageCheck === "Checking..." ? 
                  "bg-yellow-100 text-yellow-800" : 
                  "bg-red-100 text-red-800"
            }`}>
              {storageCheck}
            </div>
          </div>
          
          {error && (
            <div className="mb-6">
              <h2 className="font-medium mb-2 text-lg">Error Details:</h2>
              <pre className="bg-red-50 p-3 rounded text-sm text-red-700 overflow-x-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="flex space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Test Again
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'} 
              className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">How to Fix Common Issues</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg text-red-600">Connection Failed</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Check your environment variables in .env.local file</li>
                <li>Verify your Supabase URL and API key in the Supabase dashboard</li>
                <li>Check for network issues or firewalls blocking connections</li>
                <li>Verify Supabase service status on their status page</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg text-red-600">Authentication Error</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Try signing out and back in</li>
                <li>Check if your session has expired</li>
                <li>Verify email/password credentials</li>
                <li>Check if your user account exists in Supabase Auth</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg text-red-600">Table Access Error</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Verify the tables exist in your Supabase database</li>
                <li>Check RLS (Row Level Security) policies</li>
                <li>Run the SQL schema provided to create missing tables</li>
                <li>Ensure your user has proper permissions</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg text-red-600">Storage Bucket Error</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create a &apos;receipts&apos; bucket in your Supabase storage</li>
                <li>Set proper storage permissions</li>
                <li>Check for storage quota limits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}