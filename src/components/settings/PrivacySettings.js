"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
  Mail,
  Download,
  Info,
  ExternalLink,
  FileText,
  Trash2
} from "lucide-react";
import Link from "next/link";

export default function PrivacySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [exportingData, setExportingData] = useState(false);

  // Privacy settings - only what's actually used
  const [privacySettings, setPrivacySettings] = useState({
    marketingEmails: true,
    productUpdates: true
  });

  // Load user data
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          window.location.href = '/login';
          return;
        }

        setUser(user);

        // Load privacy settings from user metadata if available
        if (user.user_metadata?.privacy_settings) {
          setPrivacySettings(prev => ({
            ...prev,
            ...user.user_metadata.privacy_settings
          }));
        }

      } catch (error) {
        setErrorMessage('Failed to load your privacy settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  // Handle toggle change
  const handleToggle = (setting) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Save privacy settings
  const savePrivacySettings = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      const { error } = await supabase.auth.updateUser({
        data: {
          privacy_settings: privacySettings
        }
      });

      if (error) throw error;

      setSuccessMessage('Privacy settings updated successfully!');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (error) {
      setErrorMessage(`Failed to update privacy settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Export user data (CCPA compliance)
  const handleDataExport = async () => {
    try {
      setExportingData(true);
      setErrorMessage(null);

      // Fetch all user data from various tables
      const userId = user.id;

      const [
        { data: profile },
        { data: loads },
        { data: customers },
        { data: invoices },
        { data: expenses },
        { data: trucks },
        { data: drivers },
        { data: fuelEntries }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
        supabase.from('loads').select('*').eq('user_id', userId),
        supabase.from('customers').select('*').eq('user_id', userId),
        supabase.from('invoices').select('*').eq('user_id', userId),
        supabase.from('expenses').select('*').eq('user_id', userId),
        supabase.from('trucks').select('*').eq('user_id', userId),
        supabase.from('drivers').select('*').eq('user_id', userId),
        supabase.from('fuel_entries').select('*').eq('user_id', userId)
      ]);

      // Compile all data
      const exportData = {
        exportDate: new Date().toISOString(),
        accountInfo: {
          email: user.email,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at
        },
        profile: profile || {},
        businessData: {
          loads: loads || [],
          customers: customers || [],
          invoices: invoices || [],
          expenses: expenses || [],
          trucks: trucks || [],
          drivers: drivers || [],
          fuelEntries: fuelEntries || []
        }
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `truck-command-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage('Your data has been exported successfully!');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (error) {
      setErrorMessage('Failed to export data. Please try again or contact support.');
    } finally {
      setExportingData(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className="ml-2 text-gray-700 dark:text-gray-300">Loading privacy settings...</span>
      </div>
    );
  }

  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${enabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
        }`}
      onClick={onChange}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
      />
    </button>
  );

  return (
    <div className="dark:text-white">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
            <span className="text-green-800 dark:text-green-300">{successMessage}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <span className="text-red-800 dark:text-red-300">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Privacy Overview */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <Shield size={20} className="mr-2" />
            Your Privacy
          </h3>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 mb-6">
          <div className="flex items-start">
            <Info size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">How we protect your data</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Your business data is encrypted and stored securely</li>
                <li>We never sell your personal information to third parties</li>
                <li>We only use essential cookies required for the app to function</li>
                <li>Payment processing is handled securely by Stripe</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={savePrivacySettings}>
        {/* Communication Preferences */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <Mail size={20} className="mr-2" />
              Email Preferences
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Choose what emails you want to receive from Truck Command. Transactional emails (invoices, password resets, security alerts) will always be sent.
          </p>

          <div className="space-y-4 bg-white dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white">
                  Product updates & news
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Receive emails about new features, improvements, and tips for using Truck Command
                </p>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                <ToggleSwitch
                  enabled={privacySettings.productUpdates}
                  onChange={() => handleToggle('productUpdates')}
                />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white">
                    Promotional emails
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Receive occasional emails about special offers and promotions
                  </p>
                </div>
                <div className="flex-shrink-0 pt-0.5">
                  <ToggleSwitch
                    enabled={privacySettings.marketingEmails}
                    onChange={() => handleToggle('marketingEmails')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mb-8">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <RefreshCw size={18} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </form>

      {/* Your Data Rights (CCPA) */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <FileText size={20} className="mr-2" />
            Your Data Rights
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Under the California Consumer Privacy Act (CCPA), you have the right to access, download, and delete your personal data.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Download Your Data */}
          <div className="bg-white dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
            <div className="flex items-start mb-4">
              <Download size={24} className="text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Download your data</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Get a copy of all your data including loads, invoices, customers, expenses, and more.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDataExport}
              disabled={exportingData}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exportingData ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={18} className="mr-2" />
                  Export Data
                </>
              )}
            </button>
          </div>

          {/* Delete Your Account */}
          <div className="bg-white dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
            <div className="flex items-start mb-4">
              <Trash2 size={24} className="text-red-500 dark:text-red-400 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Delete your account</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Permanently delete your account and all associated data from our systems.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/settings/account"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-700 rounded-lg shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Trash2 size={18} className="mr-2" />
              Go to Account Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Legal Documents */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-lg font-medium text-white">Legal Documents</h3>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Review our legal documents to understand how we collect, use, and protect your data.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/privacy"
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">Privacy Policy</span>
              <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500" />
            </Link>
            <Link
              href="/cookies"
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">Cookie Policy</span>
              <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500" />
            </Link>
            <Link
              href="/terms"
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">Terms of Service</span>
              <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500" />
            </Link>
            <Link
              href="/acceptable-use"
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">Acceptable Use Policy</span>
              <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Contact for Privacy Concerns */}
      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
        <div className="flex items-start">
          <Shield size={24} className="text-gray-400 dark:text-gray-500 mr-4 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">Privacy Questions?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              If you have any questions about your privacy or how we handle your data, please contact us.
            </p>
            <a
              href="mailto:support@truckcommand.com"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              support@truckcommand.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
