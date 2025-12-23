// src/context/LanguageContext.js
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n'; // Initialize i18n

const LanguageContext = createContext(undefined);

export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇲🇽'
  }
};

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setLanguageState(savedLanguage);

    // Ensure i18n is synced with localStorage
    if (i18n.language !== savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }

    setIsInitialized(true);
  }, [i18n]);

  // Listen for storage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'language' && e.newValue) {
        setLanguageState(e.newValue);
        i18n.changeLanguage(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [i18n]);

  // Function to change language
  const setLanguage = useCallback((langCode) => {
    if (SUPPORTED_LANGUAGES[langCode]) {
      localStorage.setItem('language', langCode);
      setLanguageState(langCode);
      i18n.changeLanguage(langCode);

      // Update document lang attribute for accessibility
      document.documentElement.lang = langCode;
    }
  }, [i18n]);

  // Get current language info
  const currentLanguage = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.en;

  // Check if a language is the current one
  const isCurrentLanguage = useCallback((langCode) => {
    return language === langCode;
  }, [language]);

  const value = {
    language,
    currentLanguage,
    setLanguage,
    isCurrentLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isInitialized
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Re-export useTranslation for convenience
export { useTranslation } from 'react-i18next';
