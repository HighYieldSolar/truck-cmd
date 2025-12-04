"use client";

import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSubscription } from './SubscriptionContext';

// Default sidebar menu items configuration
export const DEFAULT_MENU_ITEMS = [
  { id: 'dashboard', name: 'Dashboard', visible: true, order: 0 },
  { id: 'dispatching', name: 'Load Management', visible: true, order: 1 },
  { id: 'mileage', name: 'State Mileage', visible: true, order: 2 },
  { id: 'invoices', name: 'Invoices', visible: true, order: 3 },
  { id: 'expenses', name: 'Expenses', visible: true, order: 4 },
  { id: 'customers', name: 'Customers', visible: true, order: 5 },
  { id: 'fleet', name: 'Fleet', visible: true, order: 6 },
  { id: 'compliance', name: 'Compliance', visible: true, order: 7 },
  { id: 'ifta', name: 'IFTA Calculator', visible: true, order: 8 },
  { id: 'fuel', name: 'Fuel Tracker', visible: true, order: 9 },
];

const SIDEBAR_SETTINGS_KEY = 'sidebar_preferences';

// Create the context
const SidebarContext = createContext();

// Custom hook to use the sidebar context
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

// Create a provider component
export function SidebarProvider({ children }) {
  const [sidebarConfig, setSidebarConfig] = useState(DEFAULT_MENU_ITEMS);
  const [loading, setLoading] = useState(true);
  const { user } = useSubscription();

  // Load sidebar preferences
  const loadSidebarPreferences = useCallback(async () => {
    try {
      // First check localStorage for immediate application
      const localConfig = localStorage.getItem(SIDEBAR_SETTINGS_KEY);
      if (localConfig) {
        try {
          const parsed = JSON.parse(localConfig);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSidebarConfig(mergeWithDefaults(parsed));
          }
        } catch (e) {
          // Invalid local config, will use defaults
        }
      }

      // If user is logged in, load from database
      if (user) {
        const { data: settings, error } = await supabase
          .from('user_settings')
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_key', SIDEBAR_SETTINGS_KEY)
          .maybeSingle();

        if (!error && settings && settings.setting_value) {
          const dbConfig = mergeWithDefaults(settings.setting_value);
          setSidebarConfig(dbConfig);
          localStorage.setItem(SIDEBAR_SETTINGS_KEY, JSON.stringify(dbConfig));
        }
      }
    } catch (error) {
      // Failed to load preferences, will use defaults
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Merge user config with defaults to handle new menu items
  const mergeWithDefaults = (userConfig) => {
    if (!Array.isArray(userConfig)) return DEFAULT_MENU_ITEMS;

    const configMap = new Map(userConfig.map(item => [item.id, item]));
    const merged = DEFAULT_MENU_ITEMS.map((defaultItem, index) => {
      const userItem = configMap.get(defaultItem.id);
      if (userItem) {
        return {
          ...defaultItem,
          visible: userItem.visible !== undefined ? userItem.visible : true,
          order: userItem.order !== undefined ? userItem.order : index
        };
      }
      return { ...defaultItem, order: index };
    });

    // Sort by order
    return merged.sort((a, b) => a.order - b.order);
  };

  // Update sidebar configuration
  const updateSidebarConfig = async (newConfig) => {
    try {
      setSidebarConfig(newConfig);
      localStorage.setItem(SIDEBAR_SETTINGS_KEY, JSON.stringify(newConfig));

      // If user is logged in, save to database
      if (user) {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            setting_key: SIDEBAR_SETTINGS_KEY,
            setting_value: newConfig,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,setting_key'
          });
      }
    } catch (error) {
      throw error;
    }
  };

  // Toggle item visibility
  const toggleItemVisibility = (itemId) => {
    const newConfig = sidebarConfig.map(item =>
      item.id === itemId ? { ...item, visible: !item.visible } : item
    );
    return newConfig;
  };

  // Move item up in order
  const moveItemUp = (itemId) => {
    const index = sidebarConfig.findIndex(item => item.id === itemId);
    if (index <= 0) return sidebarConfig;

    const newConfig = [...sidebarConfig];
    [newConfig[index - 1], newConfig[index]] = [newConfig[index], newConfig[index - 1]];

    // Update order values
    return newConfig.map((item, idx) => ({ ...item, order: idx }));
  };

  // Move item down in order
  const moveItemDown = (itemId) => {
    const index = sidebarConfig.findIndex(item => item.id === itemId);
    if (index >= sidebarConfig.length - 1) return sidebarConfig;

    const newConfig = [...sidebarConfig];
    [newConfig[index], newConfig[index + 1]] = [newConfig[index + 1], newConfig[index]];

    // Update order values
    return newConfig.map((item, idx) => ({ ...item, order: idx }));
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    try {
      setSidebarConfig(DEFAULT_MENU_ITEMS);
      localStorage.setItem(SIDEBAR_SETTINGS_KEY, JSON.stringify(DEFAULT_MENU_ITEMS));

      if (user) {
        await supabase
          .from('user_settings')
          .delete()
          .eq('user_id', user.id)
          .eq('setting_key', SIDEBAR_SETTINGS_KEY);
      }
    } catch (error) {
      throw error;
    }
  };

  // Load preferences on mount and when user changes
  useEffect(() => {
    loadSidebarPreferences();
  }, [loadSidebarPreferences]);

  const value = {
    sidebarConfig,
    loading,
    updateSidebarConfig,
    toggleItemVisibility,
    moveItemUp,
    moveItemDown,
    resetToDefaults,
    DEFAULT_MENU_ITEMS
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}
