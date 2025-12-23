// src/i18n/index.js
// i18next configuration for Truck Command internationalization

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import English translations
import commonEN from './locales/en/common.json';
import dashboardEN from './locales/en/dashboard.json';
import dispatchingEN from './locales/en/dispatching.json';
import invoicesEN from './locales/en/invoices.json';
import expensesEN from './locales/en/expenses.json';
import customersEN from './locales/en/customers.json';
import fleetEN from './locales/en/fleet.json';
import complianceEN from './locales/en/compliance.json';
import fuelEN from './locales/en/fuel.json';
import iftaEN from './locales/en/ifta.json';
import settingsEN from './locales/en/settings.json';
import billingEN from './locales/en/billing.json';
import errorsEN from './locales/en/errors.json';
import authEN from './locales/en/auth.json';
import mileageEN from './locales/en/mileage.json';
import onboardingEN from './locales/en/onboarding.json';
import landingEN from './locales/en/landing.json';

// Import Spanish translations
import commonES from './locales/es/common.json';
import dashboardES from './locales/es/dashboard.json';
import dispatchingES from './locales/es/dispatching.json';
import invoicesES from './locales/es/invoices.json';
import expensesES from './locales/es/expenses.json';
import customersES from './locales/es/customers.json';
import fleetES from './locales/es/fleet.json';
import complianceES from './locales/es/compliance.json';
import fuelES from './locales/es/fuel.json';
import iftaES from './locales/es/ifta.json';
import settingsES from './locales/es/settings.json';
import billingES from './locales/es/billing.json';
import errorsES from './locales/es/errors.json';
import authES from './locales/es/auth.json';
import mileageES from './locales/es/mileage.json';
import onboardingES from './locales/es/onboarding.json';
import landingES from './locales/es/landing.json';

// Bundle all resources
const resources = {
  en: {
    common: commonEN,
    dashboard: dashboardEN,
    dispatching: dispatchingEN,
    invoices: invoicesEN,
    expenses: expensesEN,
    customers: customersEN,
    fleet: fleetEN,
    compliance: complianceEN,
    fuel: fuelEN,
    ifta: iftaEN,
    settings: settingsEN,
    billing: billingEN,
    errors: errorsEN,
    auth: authEN,
    mileage: mileageEN,
    onboarding: onboardingEN,
    landing: landingEN
  },
  es: {
    common: commonES,
    dashboard: dashboardES,
    dispatching: dispatchingES,
    invoices: invoicesES,
    expenses: expensesES,
    customers: customersES,
    fleet: fleetES,
    compliance: complianceES,
    fuel: fuelES,
    ifta: iftaES,
    settings: settingsES,
    billing: billingES,
    errors: errorsES,
    auth: authES,
    mileage: mileageES,
    onboarding: onboardingES,
    landing: landingES
  }
};

// Get saved language from localStorage (default to English)
const getSavedLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || 'en';
  }
  return 'en';
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: [
      'common',
      'dashboard',
      'dispatching',
      'invoices',
      'expenses',
      'customers',
      'fleet',
      'compliance',
      'fuel',
      'ifta',
      'settings',
      'billing',
      'errors',
      'auth',
      'mileage',
      'onboarding',
      'landing'
    ],
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false // Disable suspense for client-side rendering
    }
  });

export default i18n;
