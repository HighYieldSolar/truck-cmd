"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import {
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
  Monitor,
  Check
} from "lucide-react";

export default function AppearanceSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Theme settings
  const [theme, setTheme] = useLocalStorage("theme", "system");
  const [density, setDensity] = useLocalStorage("ui-density", "comfortable");
  const [fontSize, setFontSize] = useLocalStorage("font-size", "medium");
  const [accentColor, setAccentColor] = useLocalStorage("accent-color", "blue");

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

      } catch (error) {
        console.error('Error loading user data:', error);
        setErrorMessage('Failed to load your profile information. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  // Apply theme to document
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === "dark" || (theme === "system" && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Save appearance settings
  const saveAppearance = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      // In a real implementation, you might save these to user preferences in the database
      // Here we're just using localStorage which was already saved

      // Show success message
      setSuccessMessage('Appearance settings updated successfully!');

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (error) {
      console.error('Error saving appearance:', error);
      setErrorMessage(`Failed to update appearance settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Theme option components for cleaner rendering
  const ThemeOption = ({ value, label, icon }) => (
    <div
      className={`flex flex-col items-center cursor-pointer border rounded-lg p-4 transition-all ${theme === value
        ? 'border-blue-500 bg-blue-50 shadow-sm'
        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
        }`}
      onClick={() => setTheme(value)}
    >
      <div className={`p-3 rounded-full mb-2 ${theme === value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
        {icon}
      </div>
      <div className="font-medium text-gray-900">{label}</div>
      {theme === value && (
        <div className="absolute top-2 right-2 text-blue-600">
          <Check size={16} />
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600" />
        <span className="ml-2 text-gray-700">Loading appearance settings...</span>
      </div>
    );
  }

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

      <form onSubmit={saveAppearance}>
        {/* Theme Settings */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg shadow-sm p-4 mb-4">
            <h3 className="text-lg font-medium text-white">Theme</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Choose how Truck Command looks to you</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <ThemeOption
              value="light"
              label="Light"
              icon={<Sun size={24} />}
            />

            <ThemeOption
              value="dark"
              label="Dark"
              icon={<Moon size={24} />}
            />

            <ThemeOption
              value="system"
              label="System"
              icon={<Monitor size={24} />}
            />
          </div>
        </div>

        {/* Density Settings */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg shadow-sm p-4 mb-4">
            <h3 className="text-lg font-medium text-white">Density</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Control how compact the interface appears</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div
              className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${density === 'comfortable'
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              onClick={() => setDensity('comfortable')}
            >
              <div className="w-full">
                <div className="font-medium text-gray-900">Comfortable</div>
                <div className="text-sm text-gray-500">Standard spacing</div>
              </div>
              {density === 'comfortable' && (
                <div className="absolute top-2 right-2 text-blue-600">
                  <Check size={16} />
                </div>
              )}
            </div>

            <div
              className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${density === 'compact'
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              onClick={() => setDensity('compact')}
            >
              <div className="w-full">
                <div className="font-medium text-gray-900">Compact</div>
                <div className="text-sm text-gray-500">Reduced spacing</div>
              </div>
              {density === 'compact' && (
                <div className="absolute top-2 right-2 text-blue-600">
                  <Check size={16} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Font Size */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg shadow-sm p-4 mb-4">
            <h3 className="text-lg font-medium text-white">Font Size</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Adjust the text size throughout the application</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div
              className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${fontSize === 'small'
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              onClick={() => setFontSize('small')}
            >
              <div className="w-full text-center">
                <div className="font-medium text-gray-900" style={{ fontSize: '0.9rem' }}>Small Text</div>
              </div>
              {fontSize === 'small' && (
                <div className="absolute top-2 right-2 text-blue-600">
                  <Check size={16} />
                </div>
              )}
            </div>

            <div
              className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${fontSize === 'medium'
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              onClick={() => setFontSize('medium')}
            >
              <div className="w-full text-center">
                <div className="font-medium text-gray-900" style={{ fontSize: '1rem' }}>Medium Text</div>
              </div>
              {fontSize === 'medium' && (
                <div className="absolute top-2 right-2 text-blue-600">
                  <Check size={16} />
                </div>
              )}
            </div>

            <div
              className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${fontSize === 'large'
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              onClick={() => setFontSize('large')}
            >
              <div className="w-full text-center">
                <div className="font-medium text-gray-900" style={{ fontSize: '1.1rem' }}>Large Text</div>
              </div>
              {fontSize === 'large' && (
                <div className="absolute top-2 right-2 text-blue-600">
                  <Check size={16} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg shadow-sm p-4 mb-4">
            <h3 className="text-lg font-medium text-white">Accent Color</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Select your preferred accent color</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {["blue", "green", "purple", "red", "orange", "teal"].map((color) => (
              <div
                key={color}
                className={`relative flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${accentColor === color
                  ? 'border-gray-700 shadow-sm'
                  : 'border-gray-200 hover:border-gray-400'
                  }`}
                onClick={() => setAccentColor(color)}
              >
                <div
                  className={`w-8 h-8 rounded-full mb-2 bg-${color}-500`}
                  style={{
                    backgroundColor:
                      color === 'blue' ? '#3b82f6' :
                        color === 'green' ? '#22c55e' :
                          color === 'purple' ? '#a855f7' :
                            color === 'red' ? '#ef4444' :
                              color === 'orange' ? '#f97316' :
                                color === 'teal' ? '#14b8a6' : '#3b82f6'
                  }}
                ></div>
                <div className="text-sm font-medium text-gray-900 capitalize">{color}</div>
                {accentColor === color && (
                  <div className="absolute top-2 right-2 text-gray-900">
                    <Check size={16} />
                  </div>
                )}
              </div>
            ))}
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
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}