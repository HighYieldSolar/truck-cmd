/**
 * Subscription Tier Configuration
 * Defines limits and features for each subscription plan
 */

export const TIERS = {
  // Trial users get Premium features via premium-trial plan
  trial: 'premium-trial',

  // Plan names
  'premium-trial': 'premium-trial', // Free trial with premium features
  basic: 'basic',
  premium: 'premium',
  fleet: 'fleet',
  enterprise: 'enterprise'
};

export const TIER_LIMITS = {
  'premium-trial': {
    name: 'Premium Trial',
    price: { monthly: 0, yearly: 0 }, // Free trial
    trucks: 3,
    drivers: 3,
    loadsPerMonth: Infinity,
    invoicesPerMonth: Infinity,
    customers: Infinity,
    teamUsers: 1,
  },
  basic: {
    name: 'Basic',
    price: { monthly: 20, yearly: 16 },
    trucks: 1,
    drivers: 1,
    loadsPerMonth: 50,
    invoicesPerMonth: 50,
    customers: 50,
    teamUsers: 1,
  },
  premium: {
    name: 'Premium',
    price: { monthly: 35, yearly: 28 },
    trucks: 3,
    drivers: 3,
    loadsPerMonth: Infinity,
    invoicesPerMonth: Infinity,
    customers: Infinity,
    teamUsers: 1,
  },
  fleet: {
    name: 'Fleet',
    price: { monthly: 75, yearly: 60 },
    trucks: 12,
    drivers: 12,
    loadsPerMonth: Infinity,
    invoicesPerMonth: Infinity,
    customers: Infinity,
    teamUsers: 6, // 1 per 2 trucks
  },
  enterprise: {
    name: 'Enterprise',
    price: { monthly: null, yearly: null }, // Contact sales
    trucks: Infinity,
    drivers: Infinity,
    loadsPerMonth: Infinity,
    invoicesPerMonth: Infinity,
    customers: Infinity,
    teamUsers: Infinity,
  }
};

export const TIER_FEATURES = {
  'premium-trial': {
    // Premium Trial gets all Premium features
    // Dashboard
    dashboard: true,
    dashboardAdvancedWidgets: true,

    // Load Management
    loadManagement: true,
    loadAssignment: true,
    loadDocuments: true,

    // Invoicing
    invoices: true,
    invoiceExport: true,

    // Expenses
    expenses: true,
    expenseExport: true,

    // Customers
    customers: true,
    customerExport: true,

    // Fleet Management
    fleetManagement: true,
    fleetReports: false, // Fleet+ only
    maintenanceScheduling: false,

    // Compliance
    compliance: true,
    complianceAlerts: true,

    // IFTA & Mileage
    iftaCalculator: true,
    stateMileage: true,

    // Fuel Tracker
    fuelTracker: true,
    fuelTrackerReceipts: true,
    fuelTrackerSync: true,

    // ELD Integration (Premium+ feature)
    eldIntegration: true,
    eldIftaSync: true,
    eldHosTracking: true,
    eldGpsTracking: false, // Fleet+ only
    eldDiagnostics: false, // Fleet+ only
    eldMultipleProviders: false, // Enterprise only

    // QuickBooks Integration (Premium+ feature)
    quickbooksIntegration: true,
    quickbooksAutoSync: true,

    // Notifications
    notificationsInApp: true,
    notificationsEmail: true,
    notificationsSMS: false,
    notificationsQuietHours: false,
    notificationsDigest: true,

    // Notification Categories
    notifCompliance: true,
    notifDriverAlerts: true,
    notifLoadUpdates: true,
    notifIFTADeadlines: true,
    notifMaintenance: true,
    notifFuelAlerts: true,
    notifBilling: true,
    notifSystem: true,
    notifEldAlerts: true, // ELD-related notifications

    // Export
    exportPDF: true,
    exportCSV: false, // Fleet+ only
    exportExcel: false,

    // Support
    supportEmail: true,
    supportPhone: false,
    supportPriority: false,
  },

  basic: {
    // Dashboard
    dashboard: true,
    dashboardAdvancedWidgets: false,

    // Load Management
    loadManagement: true,
    loadAssignment: true,
    loadDocuments: true,

    // Invoicing
    invoices: true,
    invoiceExport: false, // PDF only at premium+

    // Expenses
    expenses: true,
    expenseExport: false,

    // Customers
    customers: true,
    customerExport: false,

    // Fleet Management
    fleetManagement: true, // Basic (1 truck, 1 driver)
    fleetReports: false,
    maintenanceScheduling: false,

    // Compliance
    compliance: false,
    complianceAlerts: false,

    // IFTA & Mileage
    iftaCalculator: false,
    stateMileage: false,

    // Fuel Tracker
    fuelTracker: true, // Basic logging
    fuelTrackerReceipts: false,
    fuelTrackerSync: false,

    // ELD Integration (Basic tier - connection allowed, limited features)
    eldIntegration: true,  // Basic can connect ELD
    eldIftaSync: false,    // IFTA sync requires Premium+
    eldHosTracking: false, // HOS tracking requires Premium+
    eldGpsTracking: false,
    eldDiagnostics: false,
    eldMultipleProviders: false,

    // QuickBooks Integration (Premium+ only)
    quickbooksIntegration: false,
    quickbooksAutoSync: false,

    // Notifications
    notificationsInApp: true,
    notificationsEmail: false,
    notificationsSMS: false,
    notificationsQuietHours: false,
    notificationsDigest: false,

    // Notification Categories
    notifCompliance: false,
    notifDriverAlerts: false,
    notifLoadUpdates: true, // Basic only
    notifIFTADeadlines: false,
    notifMaintenance: false,
    notifFuelAlerts: false,
    notifBilling: true,
    notifSystem: true,
    notifEldAlerts: false,

    // Export
    exportPDF: true,
    exportCSV: false,
    exportExcel: false,

    // Support
    supportEmail: true,
    supportPhone: false,
    supportPriority: false,
  },

  premium: {
    // Dashboard
    dashboard: true,
    dashboardAdvancedWidgets: true,

    // Load Management
    loadManagement: true,
    loadAssignment: true,
    loadDocuments: true,

    // Invoicing
    invoices: true,
    invoiceExport: true,

    // Expenses
    expenses: true,
    expenseExport: true,

    // Customers
    customers: true,
    customerExport: true,

    // Fleet Management
    fleetManagement: true,
    fleetReports: false, // Fleet+ only
    maintenanceScheduling: false,

    // Compliance
    compliance: true,
    complianceAlerts: true,

    // IFTA & Mileage
    iftaCalculator: true,
    stateMileage: true,

    // Fuel Tracker
    fuelTracker: true,
    fuelTrackerReceipts: true,
    fuelTrackerSync: true,

    // ELD Integration (Premium tier)
    eldIntegration: true,
    eldIftaSync: true,
    eldHosTracking: true,
    eldGpsTracking: false, // Fleet+ only
    eldDiagnostics: false, // Fleet+ only
    eldMultipleProviders: false, // Enterprise only

    // QuickBooks Integration (Premium+ feature)
    quickbooksIntegration: true,
    quickbooksAutoSync: true,

    // Notifications
    notificationsInApp: true,
    notificationsEmail: true,
    notificationsSMS: false,
    notificationsQuietHours: false,
    notificationsDigest: true,

    // Notification Categories
    notifCompliance: true,
    notifDriverAlerts: true,
    notifLoadUpdates: true,
    notifIFTADeadlines: true,
    notifMaintenance: true,
    notifFuelAlerts: true,
    notifBilling: true,
    notifSystem: true,
    notifEldAlerts: true,

    // Export
    exportPDF: true,
    exportCSV: false, // Fleet+ only
    exportExcel: false,

    // Support
    supportEmail: true,
    supportPhone: false,
    supportPriority: false,
  },

  fleet: {
    // Dashboard
    dashboard: true,
    dashboardAdvancedWidgets: true,

    // Load Management
    loadManagement: true,
    loadAssignment: true,
    loadDocuments: true,

    // Invoicing
    invoices: true,
    invoiceExport: true,

    // Expenses
    expenses: true,
    expenseExport: true,

    // Customers
    customers: true,
    customerExport: true,

    // Fleet Management
    fleetManagement: true,
    fleetReports: true,
    maintenanceScheduling: true,

    // Compliance
    compliance: true,
    complianceAlerts: true,

    // IFTA & Mileage
    iftaCalculator: true,
    stateMileage: true,

    // Fuel Tracker
    fuelTracker: true,
    fuelTrackerReceipts: true,
    fuelTrackerSync: true,

    // ELD Integration (Fleet tier - full features)
    eldIntegration: true,
    eldIftaSync: true,
    eldHosTracking: true,
    eldGpsTracking: true, // Fleet+ feature
    eldDiagnostics: true, // Fleet+ feature
    eldMultipleProviders: false, // Enterprise only

    // QuickBooks Integration (Premium+ feature)
    quickbooksIntegration: true,
    quickbooksAutoSync: true,

    // Notifications
    notificationsInApp: true,
    notificationsEmail: true,
    notificationsSMS: true,
    notificationsQuietHours: true,
    notificationsDigest: true,

    // Notification Categories
    notifCompliance: true,
    notifDriverAlerts: true,
    notifLoadUpdates: true,
    notifIFTADeadlines: true,
    notifMaintenance: true,
    notifFuelAlerts: true,
    notifBilling: true,
    notifSystem: true,
    notifEldAlerts: true,

    // Export
    exportPDF: true,
    exportCSV: true,
    exportExcel: true,

    // Support
    supportEmail: true,
    supportPhone: true,
    supportPriority: true,
  },

  enterprise: {
    // All features enabled
    dashboard: true,
    dashboardAdvancedWidgets: true,
    loadManagement: true,
    loadAssignment: true,
    loadDocuments: true,
    invoices: true,
    invoiceExport: true,
    expenses: true,
    expenseExport: true,
    customers: true,
    customerExport: true,
    fleetManagement: true,
    fleetReports: true,
    maintenanceScheduling: true,
    compliance: true,
    complianceAlerts: true,
    iftaCalculator: true,
    stateMileage: true,
    fuelTracker: true,
    fuelTrackerReceipts: true,
    fuelTrackerSync: true,
    // ELD Integration (Enterprise - all features including multiple providers)
    eldIntegration: true,
    eldIftaSync: true,
    eldHosTracking: true,
    eldGpsTracking: true,
    eldDiagnostics: true,
    eldMultipleProviders: true, // Enterprise exclusive
    // QuickBooks Integration
    quickbooksIntegration: true,
    quickbooksAutoSync: true,
    // Notifications
    notificationsInApp: true,
    notificationsEmail: true,
    notificationsSMS: true,
    notificationsQuietHours: true,
    notificationsDigest: true,
    notifCompliance: true,
    notifDriverAlerts: true,
    notifLoadUpdates: true,
    notifIFTADeadlines: true,
    notifMaintenance: true,
    notifFuelAlerts: true,
    notifBilling: true,
    notifSystem: true,
    notifEldAlerts: true,
    exportPDF: true,
    exportCSV: true,
    exportExcel: true,
    supportEmail: true,
    supportPhone: true,
    supportPriority: true,
    // Enterprise exclusive
    apiAccess: true,
    customIntegrations: true,
    dedicatedManager: true,
    slaGuarantee: true,
    customReporting: true,
    onboarding: true,
  }
};

// Feature descriptions for upgrade prompts
export const FEATURE_DESCRIPTIONS = {
  compliance: {
    name: 'Compliance Tracking',
    description: 'Track document expirations, licenses, and regulatory compliance',
    requiredTier: 'premium'
  },
  iftaCalculator: {
    name: 'IFTA Calculator',
    description: 'Generate quarterly IFTA tax reports automatically',
    requiredTier: 'premium'
  },
  stateMileage: {
    name: 'State Mileage Tracker',
    description: 'Track miles driven in each state for IFTA reporting',
    requiredTier: 'premium'
  },
  fleetReports: {
    name: 'Fleet Reports',
    description: 'Advanced fleet analytics and reporting',
    requiredTier: 'fleet'
  },
  maintenanceScheduling: {
    name: 'Maintenance Scheduling',
    description: 'Schedule and track vehicle maintenance',
    requiredTier: 'fleet'
  },
  notificationsSMS: {
    name: 'SMS Notifications',
    description: 'Receive critical alerts via text message',
    requiredTier: 'fleet'
  },
  notificationsQuietHours: {
    name: 'Quiet Hours',
    description: 'Pause non-critical notifications during specific hours',
    requiredTier: 'fleet'
  },
  exportCSV: {
    name: 'CSV/Excel Export',
    description: 'Export data in CSV and Excel formats',
    requiredTier: 'fleet'
  },
  notificationsEmail: {
    name: 'Email Notifications',
    description: 'Receive notifications via email',
    requiredTier: 'premium'
  },
  fuelTrackerReceipts: {
    name: 'Fuel Receipt Upload',
    description: 'Upload and store fuel receipts',
    requiredTier: 'premium'
  },
  // ELD Integration Features
  eldIntegration: {
    name: 'ELD Integration',
    description: 'Connect your ELD/telematics provider for automated data sync',
    requiredTier: 'basic'  // Basic tier can connect ELD
  },
  eldIftaSync: {
    name: 'IFTA Auto-Sync',
    description: 'Automatically import jurisdiction mileage from your ELD for IFTA reporting',
    requiredTier: 'premium'
  },
  eldHosTracking: {
    name: 'HOS Compliance',
    description: 'Track driver hours of service and receive violation alerts',
    requiredTier: 'premium'
  },
  eldGpsTracking: {
    name: 'GPS Tracking',
    description: 'View real-time vehicle locations on an interactive map',
    requiredTier: 'fleet'
  },
  eldDiagnostics: {
    name: 'Vehicle Diagnostics',
    description: 'Monitor fault codes and receive vehicle health alerts',
    requiredTier: 'fleet'
  },
  eldMultipleProviders: {
    name: 'Multiple ELD Providers',
    description: 'Connect multiple ELD providers for mixed fleet management',
    requiredTier: 'enterprise'
  },
  // QuickBooks Integration Features
  quickbooksIntegration: {
    name: 'QuickBooks Integration',
    description: 'Sync expenses and invoices to QuickBooks Online',
    requiredTier: 'premium'
  },
  quickbooksAutoSync: {
    name: 'Auto-Sync to QuickBooks',
    description: 'Automatically sync new expenses and invoices to QuickBooks',
    requiredTier: 'premium'
  }
};

// Helper to get effective tier (premium-trial users get premium features)
export function getEffectiveTier(plan, status) {
  // If plan is premium-trial, return it directly (has premium features)
  if (plan === 'premium-trial') return 'premium-trial';
  // Legacy: if status is trialing with old basic plan, treat as premium-trial
  if (status === 'trialing' && (!plan || plan === 'basic')) return 'premium-trial';
  if (!plan || plan === 'null') return 'basic';
  return plan.toLowerCase();
}

// Helper to check if a feature is available for a tier
export function hasFeature(tier, feature) {
  const effectiveTier = tier?.toLowerCase() || 'basic';
  const tierFeatures = TIER_FEATURES[effectiveTier] || TIER_FEATURES.basic;
  return tierFeatures[feature] === true;
}

// Helper to get limit for a tier
export function getLimit(tier, limitName) {
  const effectiveTier = tier?.toLowerCase() || 'basic';
  const tierLimits = TIER_LIMITS[effectiveTier] || TIER_LIMITS.basic;
  return tierLimits[limitName];
}

// Helper to check if user is within limits
export function isWithinLimit(tier, limitName, currentCount) {
  const limit = getLimit(tier, limitName);
  if (limit === Infinity) return true;
  return currentCount < limit;
}

// Helper to get upgrade tier for a feature
export function getRequiredTierForFeature(feature) {
  const description = FEATURE_DESCRIPTIONS[feature];
  return description?.requiredTier || 'premium';
}

// Helper to compare tiers (returns true if tier1 >= tier2)
export function isTierAtLeast(currentTier, requiredTier) {
  const tierOrder = ['basic', 'premium-trial', 'premium', 'fleet', 'enterprise'];
  // Normalize tier names - premium-trial has same level as premium
  let normalizedCurrent = currentTier?.toLowerCase() || 'basic';
  let normalizedRequired = requiredTier?.toLowerCase() || 'basic';

  // For comparison purposes, premium-trial is equivalent to premium
  if (normalizedCurrent === 'premium-trial') normalizedCurrent = 'premium';

  const currentIndex = tierOrder.indexOf(normalizedCurrent);
  const requiredIndex = tierOrder.indexOf(normalizedRequired);
  return currentIndex >= requiredIndex;
}
