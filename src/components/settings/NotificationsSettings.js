"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle,
  Bell,
  Mail,
  MessageSquare,
  Smartphone
} from "lucide-react";

export default function NotificationsSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      invoices: true,
      expenses: true,
      loads: true,
      reminders: true
    },
    sms: {
      invoices: false,
      expenses: false,
      loads: true,
      reminders: true
    },
    push: {
      invoices: true,
      expenses: true,
      loads: true,
      reminders: true
    }
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

        // Load notification settings from database
        const { data: notifData, error: notifError } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!notifError && notifData?.preferences) {
          setNotificationSettings(notifData.preferences);
        }

      } catch (error) {
        console.error('Error loading user data:', error);
        setErrorMessage('Failed to load your notification settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  // Handle toggle change
  const handleToggle = (channel, type) => {
    setNotificationSettings(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: !prev[channel][type]
      }
    }));
  };

  // Save notification settings
  const saveNotificationSettings = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      // Check if notification preferences record exists
      const { data: existingPrefs, error: checkError } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let result;

      if (existingPrefs) {
        // Update existing preferences
        result = await supabase
          .from('notification_preferences')
          .update({
            preferences: notificationSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPrefs.id);
      } else {
        // Insert new preferences
        result = await supabase
          .from('notification_preferences')
          .insert([{
            user_id: user.id,
            preferences: notificationSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
      }

      if (result.error) throw result.error;

      // Show success message
      setSuccessMessage('Notification preferences updated successfully!');

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setErrorMessage(`Failed to update notification preferences: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600" />
        <span className="ml-2 text-gray-700">Loading notification settings...</span>
      </div>
    );
  }

  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-blue-600' : 'bg-gray-200'
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

      <form onSubmit={saveNotificationSettings}>
        <div className="grid grid-cols-1 gap-8">
          {/* Email Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded-t-lg">
              <h3 className="flex items-center text-lg font-medium text-white">
                <Mail size={20} className="mr-2 text-blue-100" />
                Email Notifications
              </h3>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Control which email notifications you receive from Truck Command.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Invoice notifications</div>
                    <p className="text-sm text-gray-500">
                      Receive notifications about invoice status changes
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={notificationSettings.email.invoices}
                    onChange={() => handleToggle('email', 'invoices')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Expense notifications</div>
                    <p className="text-sm text-gray-500">
                      Receive notifications about expense activities
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={notificationSettings.email.expenses}
                    onChange={() => handleToggle('email', 'expenses')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Load notifications</div>
                    <p className="text-sm text-gray-500">
                      Receive notifications about load statuses and updates
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={notificationSettings.email.loads}
                    onChange={() => handleToggle('email', 'loads')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Reminders</div>
                    <p className="text-sm text-gray-500">
                      Receive reminders for upcoming tasks and deadlines
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={notificationSettings.email.reminders}
                    onChange={() => handleToggle('email', 'reminders')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded-t-lg">
              <h3 className="flex items-center text-lg font-medium text-white">
                <Smartphone size={20} className="mr-2 text-blue-100" />
                SMS Notifications
              </h3>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Control which SMS notifications you receive from Truck Command.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Invoice notifications</div>
                    <p className="text-sm text-gray-500">
                      Receive SMS alerts about invoice status changes
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={notificationSettings.sms.invoices}
                    onChange={() => handleToggle('sms', 'invoices')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Expense notifications</div>
                    <p className="text-sm text-gray-500">
                      Receive SMS alerts about expense activities
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={notificationSettings.sms.expenses}
                    onChange={() => handleToggle('sms', 'expenses')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Load notifications</div>
                    <p className="text-sm text-gray-500">
                      Receive SMS alerts about load statuses and updates
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={notificationSettings.sms.loads}
                    onChange={() => handleToggle('sms', 'loads')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Reminders</div>
                    <p className="text-sm text-gray-500">
                      Receive SMS reminders for upcoming tasks and deadlines
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={notificationSettings.sms.reminders}
                    onChange={() => handleToggle('sms', 'reminders')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded-t-lg">
              <h3 className="flex items-center text-lg font-medium text-white">
                <Bell size={20} className="mr-2 text-blue-100" />
                In-App Notifications
              </h3>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Control which in-app notifications you receive from Truck Command.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Invoice notifications</div>
                    <p className="text-sm text-gray-500">
                      Receive in-app notifications about invoice status changes
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={notificationSettings.push.invoices}
                    onChange={() => handleToggle('push', 'invoices')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Expense notifications</div>
                    <p className="text-sm text-gray-500">
                      Receive in-app notifications about expense activities
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={notificationSettings.push.expenses}
                    onChange={() => handleToggle('push', 'expenses')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Load notifications</div>
                    <p className="text-sm text-gray-500">
                      Receive in-app notifications about load statuses and updates
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={notificationSettings.push.loads}
                    onChange={() => handleToggle('push', 'loads')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Reminders</div>
                    <p className="text-sm text-gray-500">
                      Receive in-app reminders for upcoming tasks and deadlines
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={notificationSettings.push.reminders}
                    onChange={() => handleToggle('push', 'reminders')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
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
                Save Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}