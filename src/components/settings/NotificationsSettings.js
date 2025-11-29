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
      const { data: existingPrefs } = await supabase
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
      setErrorMessage(`Failed to update notification preferences: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className="ml-2 text-gray-700 dark:text-gray-300">Loading notification settings...</span>
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

  // Notification section component
  const NotificationSection = ({ title, icon: Icon, iconColor, channel, description }) => (
    <div className="bg-white dark:bg-gray-700/30 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600">
        <h3 className="flex items-center text-lg font-medium text-white">
          <Icon size={20} className="mr-2 text-blue-100" />
          {title}
        </h3>
      </div>

      <div className="p-6">
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {description}
        </p>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white">Invoice notifications</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive {channel === 'email' ? 'emails' : channel === 'sms' ? 'SMS alerts' : 'in-app notifications'} about invoice status changes
              </p>
            </div>
            <div className="flex-shrink-0 pt-0.5">
              <ToggleSwitch
                enabled={notificationSettings[channel].invoices}
                onChange={() => handleToggle(channel, 'invoices')}
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white">Expense notifications</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive {channel === 'email' ? 'emails' : channel === 'sms' ? 'SMS alerts' : 'in-app notifications'} about expense activities
              </p>
            </div>
            <div className="flex-shrink-0 pt-0.5">
              <ToggleSwitch
                enabled={notificationSettings[channel].expenses}
                onChange={() => handleToggle(channel, 'expenses')}
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white">Load notifications</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive {channel === 'email' ? 'emails' : channel === 'sms' ? 'SMS alerts' : 'in-app notifications'} about load statuses and updates
              </p>
            </div>
            <div className="flex-shrink-0 pt-0.5">
              <ToggleSwitch
                enabled={notificationSettings[channel].loads}
                onChange={() => handleToggle(channel, 'loads')}
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white">Reminders</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive {channel === 'email' ? 'email' : channel === 'sms' ? 'SMS' : 'in-app'} reminders for upcoming tasks and deadlines
              </p>
            </div>
            <div className="flex-shrink-0 pt-0.5">
              <ToggleSwitch
                enabled={notificationSettings[channel].reminders}
                onChange={() => handleToggle(channel, 'reminders')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
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

      <form onSubmit={saveNotificationSettings}>
        <div className="grid grid-cols-1 gap-6">
          {/* Email Notifications */}
          <NotificationSection
            title="Email Notifications"
            icon={Mail}
            iconColor="blue"
            channel="email"
            description="Control which email notifications you receive from Truck Command."
          />

          {/* SMS Notifications */}
          <NotificationSection
            title="SMS Notifications"
            icon={Smartphone}
            iconColor="green"
            channel="sms"
            description="Control which SMS notifications you receive from Truck Command."
          />

          {/* Push Notifications */}
          <NotificationSection
            title="In-App Notifications"
            icon={Bell}
            iconColor="purple"
            channel="push"
            description="Control which in-app notifications you receive from Truck Command."
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
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
    </div>
  );
}
