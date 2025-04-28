"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  RefreshCw, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  DataHtml,
  Download,
  Info
} from "lucide-react";

export default function PrivacySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [processingDataExport, setProcessingDataExport] = useState(false);
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    shareAnalytics: true,
    shareUsageData: true,
    allowLocationTracking: false,
    allowCookies: true,
    allowMarketingEmails: true,
    showProfileToOthers: true
  });

  // Load user data
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        
        // Load privacy settings from user metadata if available
        if (user.user_metadata?.privacy_settings) {
          setPrivacySettings(user.user_metadata.privacy_settings);
        }
        
      } catch (error) {
        console.error('Error loading user data:', error);
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
      
      // Update user metadata with privacy settings
      const { error } = await supabase.auth.updateUser({
        data: {
          privacy_settings: privacySettings
        }
      });
      
      if (error) throw error;
      
      // Show success message
      setSuccessMessage('Privacy settings updated successfully!');
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      setErrorMessage(`Failed to update privacy settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Request data export
  const requestDataExport = async () => {
    try {
      setProcessingDataExport(true);
      setErrorMessage(null);
      
      // In a real app, you would call an API endpoint to generate and email the data export
      // For demo purposes, we'll just simulate a delay
      setTimeout(() => {
        setSuccessMessage('Data export request received. You will receive an email with your data shortly.');
        setProcessingDataExport(false);
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }, 2000);
      
    } catch (error) {
      console.error('Error requesting data export:', error);
      setErrorMessage(`Failed to request data export: ${error.message}`);
      setProcessingDataExport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600" />
        <span className="ml-2 text-gray-700">Loading privacy settings...</span>
      </div>
    );
  }

  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      }`}
      onClick={onChange}
    >
      <span 
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`} 
      />
    </button>
  );

  return (
    <div>
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <span className="text-red-800">{errorMessage}</span>
          </div>
        </div>
      )}
      
      <form onSubmit={savePrivacySettings}>
        {/* Data Sharing Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Data Sharing & Privacy</h3>
          <p className="text-sm text-gray-500 mb-6">
            Control how your data is used and shared within Truck Command
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 flex items-center">
                  <Shield size={18} className="text-gray-500 mr-2" />
                  Share anonymous analytics data
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Help us improve by sharing anonymous usage statistics
                </p>
              </div>
              <ToggleSwitch 
                enabled={privacySettings.shareAnalytics} 
                onChange={() => handleToggle('shareAnalytics')} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 flex items-center">
                  <Shield size={18} className="text-gray-500 mr-2" />
                  Share app usage data
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Allow us to collect data on how you use the application
                </p>
              </div>
              <ToggleSwitch 
                enabled={privacySettings.shareUsageData} 
                onChange={() => handleToggle('shareUsageData')} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 flex items-center">
                  <Shield size={18} className="text-gray-500 mr-2" />
                  Location tracking
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Allow the app to access your location data
                </p>
              </div>
              <ToggleSwitch 
                enabled={privacySettings.allowLocationTracking} 
                onChange={() => handleToggle('allowLocationTracking')} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 flex items-center">
                  <Shield size={18} className="text-gray-500 mr-2" />
                  Allow cookies
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Enable cookies to improve your browsing experience
                </p>
              </div>
              <ToggleSwitch 
                enabled={privacySettings.allowCookies} 
                onChange={() => handleToggle('allowCookies')} 
              />
            </div>
          </div>
        </div>
        
        {/* Communication Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Preferences</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 flex items-center">
                  <Shield size={18} className="text-gray-500 mr-2" />
                  Marketing emails
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Receive updates on new features and promotions
                </p>
              </div>
              <ToggleSwitch 
                enabled={privacySettings.allowMarketingEmails} 
                onChange={() => handleToggle('allowMarketingEmails')} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 flex items-center">
                  <Eye size={18} className="text-gray-500 mr-2" />
                  Profile visibility
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Allow other users to see your profile information
                </p>
              </div>
              <ToggleSwitch 
                enabled={privacySettings.showProfileToOthers} 
                onChange={() => handleToggle('showProfileToOthers')} 
              />
            </div>
          </div>
        </div>
        
        {/* Data Export */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Data</h3>
          
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-start mb-4">
              <Info size={20} className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Data Export</h4>
                <p className="text-gray-600 mt-1">
                  Request a copy of all your personal data. This includes your profile information, 
                  preferences, and activity history. The data will be sent to your email address.
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={requestDataExport}
              disabled={processingDataExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingDataExport ? (
                <>
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Download size={18} className="mr-2" />
                  Request Data Export
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <RefreshCw size={18} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}