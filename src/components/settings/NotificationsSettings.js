'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSubscription } from '@/context/SubscriptionContext';
import { getUserFriendlyError } from '@/lib/utils/errorMessages';
import { OperationMessage } from '@/components/ui/OperationMessage';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import Link from 'next/link';
import {
  Bell, Mail, Smartphone, Monitor, Settings,
  FileText, TruckIcon, User, Calendar, Wrench,
  CreditCard, AlertTriangle, RefreshCw, Save, Fuel,
  Lock, ArrowRight, Sparkles
} from 'lucide-react';

// Notification categories with their settings
const NOTIFICATION_CATEGORIES = [
  {
    id: 'compliance',
    name: 'Compliance & Documents',
    icon: FileText,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    description: 'Document expiration alerts, compliance deadlines, and certification reminders',
    types: ['DOCUMENT_EXPIRY_COMPLIANCE']
  },
  {
    id: 'drivers',
    name: 'Driver Alerts',
    icon: User,
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    description: 'Driver license expirations, medical card renewals, and driver-related updates',
    types: ['DOCUMENT_EXPIRY_DRIVER_LICENSE', 'DOCUMENT_EXPIRY_DRIVER_MEDICAL']
  },
  {
    id: 'loads',
    name: 'Load Updates',
    icon: TruckIcon,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    description: 'Load assignments, status changes, and delivery notifications',
    types: ['LOAD_ASSIGNED', 'LOAD_STATUS_UPDATE', 'DELIVERY_UPCOMING']
  },
  {
    id: 'ifta',
    name: 'IFTA & Tax Deadlines',
    icon: Calendar,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    description: 'IFTA filing deadlines, quarterly reminders, and tax-related alerts',
    types: ['IFTA_DEADLINE']
  },
  {
    id: 'maintenance',
    name: 'Maintenance Reminders',
    icon: Wrench,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    description: 'Vehicle maintenance schedules, service reminders, and equipment alerts',
    types: ['MAINTENANCE_DUE']
  },
  {
    id: 'fuel',
    name: 'Fuel Alerts',
    icon: Fuel,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    description: 'Fuel purchase reminders and fuel-related notifications',
    types: ['FUEL_REMINDER']
  },
  {
    id: 'billing',
    name: 'Billing & Payments',
    icon: CreditCard,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    description: 'Invoice reminders, payment received, and billing updates',
    types: ['INVOICE_OVERDUE', 'PAYMENT_RECEIVED']
  },
  {
    id: 'system',
    name: 'System Alerts',
    icon: AlertTriangle,
    iconBg: 'bg-gray-100 dark:bg-gray-700',
    iconColor: 'text-gray-600 dark:text-gray-400',
    description: 'System errors, important updates, and general reminders',
    types: ['SYSTEM_ERROR', 'GENERAL_REMINDER']
  }
];

// Default preferences structure
const DEFAULT_PREFERENCES = {
  email_enabled: true,
  push_enabled: true,
  sms_enabled: false,
  categories: {
    compliance: { email: true, push: true, sms: false },
    drivers: { email: true, push: true, sms: false },
    loads: { email: false, push: true, sms: false },
    ifta: { email: true, push: true, sms: false },
    maintenance: { email: false, push: true, sms: false },
    fuel: { email: false, push: true, sms: false },
    billing: { email: true, push: true, sms: false },
    system: { email: false, push: true, sms: false }
  },
  quiet_hours: {
    enabled: false,
    start: '22:00',
    end: '07:00'
  },
  digest_mode: 'instant' // instant, daily, weekly
};

export default function NotificationsSettings() {
  const { user } = useSubscription();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [operationMessage, setOperationMessage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Feature access checks
  const { canAccess, currentTier, loading: featureLoading } = useFeatureAccess();
  const hasEmailNotifications = canAccess('notificationsEmail');
  const hasSMSNotifications = canAccess('notificationsSMS');
  const hasQuietHours = canAccess('notificationsQuietHours');
  const hasDigestMode = canAccess('notificationsDigest');

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Try to get existing preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If table doesn't exist or no preferences found, use defaults
        if (error.code === 'PGRST116' || error.code === '42P01') {
          setPreferences(DEFAULT_PREFERENCES);
        } else {
          throw error;
        }
      } else if (data) {
        // Merge stored preferences with defaults (in case new fields were added)
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...data.preferences,
          categories: {
            ...DEFAULT_PREFERENCES.categories,
            ...(data.preferences?.categories || {})
          },
          quiet_hours: {
            ...DEFAULT_PREFERENCES.quiet_hours,
            ...(data.preferences?.quiet_hours || {})
          }
        });
      }
    } catch (err) {
      // Silently handle errors and use defaults
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Save preferences
  const savePreferences = async () => {
    if (!user?.id) {
      setOperationMessage({ type: 'error', text: 'Please log in to save preferences.' });
      return;
    }

    setIsSaving(true);

    try {
      // First check if preferences exist for this user
      const { data: existing, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let error;
      if (existing) {
        // Update existing record
        const result = await supabase
          .from('notification_preferences')
          .update({
            preferences: preferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            preferences: preferences,
            updated_at: new Date().toISOString()
          });
        error = result.error;
      }

      if (error) {
        // If table doesn't exist, show a specific message
        if (error.code === '42P01') {
          throw new Error('Notification preferences feature is being set up. Please try again later.');
        }
        throw error;
      }

      setOperationMessage({ type: 'success', text: 'Notification preferences saved successfully.' });
      setHasChanges(false);
    } catch (err) {
      setOperationMessage({ type: 'error', text: getUserFriendlyError(err) });
    } finally {
      setIsSaving(false);
    }
  };

  // Update master toggle
  const updateMasterToggle = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Update category preference
  const updateCategoryPreference = (categoryId, channel, value) => {
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryId]: {
          ...prev.categories[categoryId],
          [channel]: value
        }
      }
    }));
    setHasChanges(true);
  };

  // Update quiet hours
  const updateQuietHours = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      quiet_hours: {
        ...prev.quiet_hours,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  // Toggle Component - Compact version
  const Toggle = ({ enabled, onChange, disabled = false, size = 'sm' }) => {
    const sizes = {
      sm: { track: 'h-5 w-9', thumb: 'h-3 w-3', translate: 'translate-x-5' },
      xs: { track: 'h-4 w-7', thumb: 'h-2.5 w-2.5', translate: 'translate-x-4' }
    };
    const s = sizes[size] || sizes.sm;

    return (
      <button
        type="button"
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`
          relative inline-flex ${s.track} items-center rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          dark:focus:ring-offset-gray-800
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
        `}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`
            inline-block ${s.thumb} transform rounded-full bg-white transition-transform
            ${enabled ? s.translate : 'translate-x-0.5'}
          `}
        />
      </button>
    );
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Notification Preferences
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage how and when you receive notifications
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadPreferences}
            disabled={isSaving}
            className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={savePreferences}
            disabled={isSaving || !hasChanges}
            className={`
              inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors
              ${hasChanges
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }
              disabled:opacity-50
            `}
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Operation Message */}
      <OperationMessage
        message={operationMessage}
        onDismiss={() => setOperationMessage(null)}
      />

      {/* Master Toggles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-500" />
            Delivery Channels
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enable or disable notification channels globally
          </p>
        </div>
        <div className="p-6 space-y-4">
          {/* Email Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  Email Notifications
                  {!hasEmailNotifications && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      <Lock className="h-3 w-3 mr-1" />
                      Premium
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
              </div>
            </div>
            {hasEmailNotifications ? (
              <Toggle
                enabled={preferences.email_enabled}
                onChange={(v) => updateMasterToggle('email_enabled', v)}
              />
            ) : (
              <Link
                href="/dashboard/upgrade"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Upgrade <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Push Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Monitor className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">In-App Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Show notifications in the dashboard</p>
              </div>
            </div>
            <Toggle
              enabled={preferences.push_enabled}
              onChange={(v) => updateMasterToggle('push_enabled', v)}
            />
          </div>

          {/* SMS Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  SMS Notifications
                  {!hasSMSNotifications && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                      <Lock className="h-3 w-3 mr-1" />
                      Fleet
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive critical alerts via text message</p>
              </div>
            </div>
            {hasSMSNotifications ? (
              <Toggle
                enabled={preferences.sms_enabled}
                onChange={(v) => updateMasterToggle('sms_enabled', v)}
              />
            ) : (
              <Link
                href="/dashboard/upgrade"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Upgrade <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Category Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4 text-blue-500" />
            Notification Categories
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Customize notifications for each category
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 dark:bg-gray-700">
          {NOTIFICATION_CATEGORIES.map((category) => {
            const CategoryIcon = category.icon;
            const catPrefs = preferences.categories[category.id] || { email: true, push: true, sms: false };

            return (
              <div key={category.id} className="p-3 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  {/* Category Icon */}
                  <div className={`p-1.5 rounded-md ${category.iconBg} flex-shrink-0`}>
                    <CategoryIcon className={`h-3.5 w-3.5 ${category.iconColor}`} />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                    {category.name}
                  </h4>
                </div>

                {/* Channel Toggles - Compact Row */}
                <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 pl-7">
                  {/* Email */}
                  <label className="flex items-center gap-1 cursor-pointer">
                    <Toggle
                      enabled={catPrefs.email}
                      onChange={(v) => updateCategoryPreference(category.id, 'email', v)}
                      disabled={!preferences.email_enabled}
                      size="xs"
                    />
                    <span className={`text-[11px] ${
                      preferences.email_enabled
                        ? 'text-gray-600 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      Email
                    </span>
                  </label>

                  {/* Push */}
                  <label className="flex items-center gap-1 cursor-pointer">
                    <Toggle
                      enabled={catPrefs.push}
                      onChange={(v) => updateCategoryPreference(category.id, 'push', v)}
                      disabled={!preferences.push_enabled}
                      size="xs"
                    />
                    <span className={`text-[11px] ${
                      preferences.push_enabled
                        ? 'text-gray-600 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      App
                    </span>
                  </label>

                  {/* SMS */}
                  <label className="flex items-center gap-1 cursor-pointer">
                    <Toggle
                      enabled={catPrefs.sms}
                      onChange={(v) => updateCategoryPreference(category.id, 'sms', v)}
                      disabled={!preferences.sms_enabled}
                      size="xs"
                    />
                    <span className={`text-[11px] ${
                      preferences.sms_enabled
                        ? 'text-gray-600 dark:text-gray-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      SMS
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-500" />
            Quiet Hours
            {!hasQuietHours && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                <Lock className="h-3 w-3 mr-1" />
                Fleet
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pause non-critical notifications during specific hours
          </p>
        </div>
        {hasQuietHours ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Enable Quiet Hours</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Only critical notifications will be delivered during quiet hours
                </p>
              </div>
              <Toggle
                enabled={preferences.quiet_hours.enabled}
                onChange={(v) => updateQuietHours('enabled', v)}
              />
            </div>

            {preferences.quiet_hours.enabled && (
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours.start}
                    onChange={(e) => updateQuietHours('start', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quiet_hours.end}
                    onChange={(e) => updateQuietHours('end', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 bg-gray-50 dark:bg-gray-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Upgrade to Fleet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Set quiet hours to pause notifications during off-hours
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/upgrade"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                Upgrade <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Digest Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-500" />
            Email Digest
            {!hasDigestMode && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                <Lock className="h-3 w-3 mr-1" />
                Premium
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choose how often you receive email notification digests
          </p>
        </div>
        {hasDigestMode ? (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: 'instant', label: 'Instant', description: 'Get emails as they happen' },
                { value: 'daily', label: 'Daily Digest', description: 'One email per day' },
                { value: 'weekly', label: 'Weekly Digest', description: 'One email per week' }
              ].map((option) => (
                <label
                  key={option.value}
                  className={`
                    relative flex cursor-pointer rounded-lg border p-4 transition-colors
                    ${preferences.digest_mode === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="digest_mode"
                    value={option.value}
                    checked={preferences.digest_mode === option.value}
                    onChange={(e) => {
                      setPreferences(prev => ({ ...prev, digest_mode: e.target.value }));
                      setHasChanges(true);
                    }}
                    className="sr-only"
                  />
                  <div>
                    <span className={`block text-sm font-medium ${
                      preferences.digest_mode === option.value
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {option.label}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.description}
                    </span>
                  </div>
                  {preferences.digest_mode === option.value && (
                    <div className="absolute top-2 right-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-gray-50 dark:bg-gray-700/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Upgrade to Premium</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Control email frequency with daily or weekly digests
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/upgrade"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                Upgrade <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
