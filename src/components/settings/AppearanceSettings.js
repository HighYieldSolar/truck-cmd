"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
  Check
} from "lucide-react";

export default function AppearanceSettings() {
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  
  const { theme, updateTheme, loading } = useTheme();

  // Initialize selected theme from context
  useEffect(() => {
    if (theme) {
      setSelectedTheme(theme);
    }
  }, [theme]);

  // Save appearance settings
  const saveAppearance = async (e) => {
    e.preventDefault();

    if (!selectedTheme || selectedTheme === theme) {
      return; // No changes to save
    }

    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      // Update theme using context
      await updateTheme(selectedTheme);

      // Show success message
      setSuccessMessage('Theme preference saved successfully!');

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (error) {
      setErrorMessage(`Failed to update appearance settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Theme option components for cleaner rendering
  const ThemeOption = ({ value, label, icon }) => (
    <div
      className={`relative flex flex-col items-center cursor-pointer border rounded-lg p-6 transition-all ${
        selectedTheme === value
          ? 'border-blue-500 bg-blue-50 shadow-md dark:bg-gray-800 dark:border-blue-400'
          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
      }`}
      onClick={() => setSelectedTheme(value)}
    >
      <div className={`p-4 rounded-full mb-3 ${
        selectedTheme === value 
          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
      }`}>
        {icon}
      </div>
      <div className="font-medium text-gray-900 dark:text-white text-lg">{label}</div>
      {selectedTheme === value && (
        <div className="absolute top-3 right-3 text-blue-600 dark:text-blue-400">
          <Check size={20} />
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className="ml-2 text-gray-700 dark:text-gray-300">Loading appearance settings...</span>
      </div>
    );
  }

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

      <form onSubmit={saveAppearance}>
        {/* Theme Settings */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-lg font-medium text-white">Theme Preference</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose between light and dark theme for your dashboard</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            <ThemeOption
              value="light"
              label="Light Mode"
              icon={<Sun size={32} />}
            />

            <ThemeOption
              value="dark"
              label="Dark Mode"
              icon={<Moon size={32} />}
            />
          </div>
        </div>


        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <RefreshCw size={18} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Save Theme Preference
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}