"use client";

import { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSubscription } from './SubscriptionContext';

// Create the context
const ThemeContext = createContext();

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Create a provider component
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const { user } = useSubscription();

  // Load theme preference
  const loadThemePreference = async () => {
    try {
      // First check localStorage for immediate theme application
      const localTheme = localStorage.getItem('theme');
      if (localTheme && (localTheme === 'light' || localTheme === 'dark')) {
        setTheme(localTheme);
        applyTheme(localTheme);
      }

      // If user is logged in, load from database
      if (user) {
        const { data: preferences, error } = await supabase
          .from('user_preferences')
          .select('theme')
          .eq('user_id', user.id)
          .single();

        if (preferences && preferences.theme) {
          setTheme(preferences.theme);
          localStorage.setItem('theme', preferences.theme);
          applyTheme(preferences.theme);
        }
      }
    } catch (error) {
      // Failed to load theme preference
    } finally {
      setLoading(false);
    }
  };

  // Apply theme to document
  const applyTheme = (themeValue) => {
    if (themeValue === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Update theme
  const updateTheme = async (newTheme) => {
    try {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);

      // If user is logged in, save to database
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            theme: newTheme,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
      }
    } catch (error) {
      // Failed to update theme
    }
  };

  // Load theme on mount and when user changes
  useEffect(() => {
    loadThemePreference();
  }, [user]);

  // Set up realtime subscription to theme changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('theme-changes')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_preferences', 
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
          if (payload.new && payload.new.theme) {
            setTheme(payload.new.theme);
            localStorage.setItem('theme', payload.new.theme);
            applyTheme(payload.new.theme);
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const value = {
    theme,
    updateTheme,
    loading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}