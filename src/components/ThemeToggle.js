"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useState, useEffect } from "react";

export default function ThemeToggle({ mobile = false }) {
  const { theme, setTheme, isDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can use the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`inline-flex ${mobile ? "justify-start" : "justify-center"} p-1.5 rounded-md text-gray-500`}>
        <div className="w-5 h-5"></div>
      </div>
    );
  }

  const cycleTheme = () => {
    try {
      const themes = ["light", "dark", "system"];
      const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
      setTheme(themes[nextIndex]);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  const getIcon = () => {
    try {
      if (theme === "dark") {
        return <Moon size={20} />;
      }
      if (theme === "light") {
        return <Sun size={20} />;
      }
      return <Monitor size={20} />;
    } catch (error) {
      console.error('Error getting icon:', error);
      return <Monitor size={20} />;
    }
  };

  const getTooltipText = () => {
    if (theme === "dark") return "Switch to light mode";
    if (theme === "light") return "Switch to system theme";
    return "Switch to dark mode";
  };

  const buttonClasses = mobile
    ? "inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
    : "p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none";

  return (
    <div className="relative group">
      <button
        onClick={cycleTheme}
        className={buttonClasses}
        aria-label={getTooltipText()}
      >
        {mobile ? (
          <div className="flex items-center">
            <div className="mr-3 text-gray-500 dark:text-gray-400">
              {getIcon()}
            </div>
            {theme === "dark" ? "Dark Mode" : theme === "light" ? "Light Mode" : "System Theme"}
          </div>
        ) : (
          getIcon()
        )}
      </button>
      {!mobile && (
        <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block dark:bg-gray-800 text-center text-xs text-gray-700 dark:text-gray-300">
          {getTooltipText()}
        </div>
      )}
    </div>
  );
} 