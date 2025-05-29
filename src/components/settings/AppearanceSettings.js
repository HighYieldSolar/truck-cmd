"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can use the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const handleThemeChange = (newTheme) => {
    try {
      setTheme(newTheme);
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-5">Theme Settings</h2>

        <div className="space-y-4">
          {/* Theme Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Light Theme Option */}
            <button
              onClick={() => handleThemeChange("light")}
              className={`relative flex flex-col items-center p-4 border rounded-lg transition-all ${theme === "light"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {theme === "light" && (
                <div className="absolute top-2 right-2 text-blue-500">
                  <Check size={20} />
                </div>
              )}
              <div
                className={`p-3 rounded-full mb-3 ${theme === "light"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}
              >
                <Sun size={24} />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Light Mode</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Light background with dark text
                </p>
              </div>
            </button>

            {/* Dark Theme Option */}
            <button
              onClick={() => handleThemeChange("dark")}
              className={`relative flex flex-col items-center p-4 border rounded-lg transition-all ${theme === "dark"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {theme === "dark" && (
                <div className="absolute top-2 right-2 text-blue-500">
                  <Check size={20} />
                </div>
              )}
              <div
                className={`p-3 rounded-full mb-3 ${theme === "dark"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}
              >
                <Moon size={24} />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Dark background with light text
                </p>
              </div>
            </button>

            {/* System Theme Option */}
            <button
              onClick={() => handleThemeChange("system")}
              className={`relative flex flex-col items-center p-4 border rounded-lg transition-all ${theme === "system"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {theme === "system" && (
                <div className="absolute top-2 right-2 text-blue-500">
                  <Check size={20} />
                </div>
              )}
              <div
                className={`p-3 rounded-full mb-3 ${theme === "system"
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}
              >
                <Monitor size={24} />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">System</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Follows your device settings
                </p>
              </div>
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
            <p>
              Your theme preference will be saved to your account and synchronized across your devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}