"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";

// Create context
const ThemeContext = createContext({
  theme: "system",
  setTheme: () => { },
  saveThemePreference: async () => { },
  isDarkMode: false,
});

// Theme provider component
export function ThemeProvider({ children }) {
  // Use localStorage for immediate theme changes
  const [theme, setThemeState] = useLocalStorage("theme", "system");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch user's theme preference from Supabase when they log in - ONLY RUN ONCE
  useEffect(() => {
    const fetchUserTheme = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          setUser(authUser);

          // Try to get user's theme preference
          const { data, error } = await supabase
            .from('user_preferences')
            .select('theme')
            .eq('user_id', authUser.id)
            .single();

          if (data && !error && data.theme) {
            // Only update if it's different from current theme
            if (data.theme !== theme) {
              setThemeState(data.theme);
            }
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error fetching user theme:', error);
        setIsInitialized(true);
      }
    };

    fetchUserTheme();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);

        // Fetch theme preference when user signs in
        const { data, error } = await supabase
          .from('user_preferences')
          .select('theme')
          .eq('user_id', session.user.id)
          .single();

        if (data && !error && data.theme) {
          setThemeState(data.theme);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []); // Remove theme and setThemeState from dependencies to prevent infinite loop

  // Save theme preference to Supabase
  const saveThemePreference = async (newTheme) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            theme: newTheme || theme,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id',
            returning: 'minimal'
          }
        );

      if (error) {
        console.error('Error saving theme preference:', error);
      }
    } catch (error) {
      console.error('Unexpected error saving theme preference:', error);
    }
  };

  // Function to set theme and optionally save to Supabase
  const setTheme = (newTheme, saveToDb = true) => {
    setThemeState(newTheme);
    if (saveToDb && user) {
      saveThemePreference(newTheme);
    }
  };

  // Apply theme to document and detect dark mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);

    // Update dark mode state
    setIsDarkMode(isDark);

    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const systemIsDark = mediaQuery.matches;
        setIsDarkMode(systemIsDark);
        if (systemIsDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]); // Only depend on theme, not isInitialized

  return (
    <ThemeContext.Provider value={{ theme, setTheme, saveThemePreference, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
} 