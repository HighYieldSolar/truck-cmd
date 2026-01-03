/**
 * Base ELD Provider Interface
 *
 * Abstract base class that all ELD provider adapters must implement.
 * This enables a plugin architecture for easy addition of new providers.
 */

/**
 * Standard data models returned by all providers
 */
export const DataModels = {
  Vehicle: {
    id: null,           // Provider's vehicle ID
    name: null,         // Vehicle name/unit number
    vin: null,          // Vehicle Identification Number
    licensePlate: null, // License plate
    make: null,         // Manufacturer
    model: null,        // Model
    year: null,         // Year
    odometerMiles: null,// Current odometer reading
    engineHours: null,  // Engine hours
    status: null,       // active, inactive, etc.
    metadata: {}        // Provider-specific data
  },

  Driver: {
    id: null,           // Provider's driver ID
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    licenseNumber: null,
    licenseState: null,
    status: null,       // active, inactive
    metadata: {}
  },

  GPSLocation: {
    vehicleId: null,
    latitude: null,
    longitude: null,
    speedMph: null,
    heading: null,      // 0-360 degrees
    odometerMiles: null,
    engineHours: null,
    address: null,
    recordedAt: null,   // ISO timestamp
    metadata: {}
  },

  HOSLog: {
    driverId: null,
    vehicleId: null,
    dutyStatus: null,   // 'driving', 'on_duty', 'off_duty', 'sleeper'
    startTime: null,    // ISO timestamp
    endTime: null,      // ISO timestamp
    durationMinutes: null,
    location: null,     // Description
    latitude: null,
    longitude: null,
    annotations: null,
    logDate: null,      // YYYY-MM-DD
    metadata: {}
  },

  IFTATrip: {
    vehicleId: null,
    driverId: null,
    startJurisdiction: null,  // State/province code
    endJurisdiction: null,
    jurisdictionsMiles: {},   // { 'TX': 150.5, 'OK': 75.2 }
    totalMiles: null,
    startOdometer: null,
    endOdometer: null,
    startTime: null,
    endTime: null,
    metadata: {}
  },

  FaultCode: {
    vehicleId: null,
    code: null,         // DTC code
    description: null,
    severity: null,     // 'critical', 'warning', 'info'
    source: null,       // 'engine', 'transmission', 'abs', etc.
    firstObservedAt: null,
    lastObservedAt: null,
    isActive: true,
    metadata: {}
  },

  FuelPurchase: {
    vehicleId: null,
    driverId: null,
    jurisdiction: null, // State/province code
    gallons: null,
    totalCost: null,
    pricePerGallon: null,
    fuelType: null,     // 'diesel', 'gasoline', 'cng', 'lng'
    merchantName: null,
    merchantAddress: null,
    transactionDate: null,
    metadata: {}
  }
};

/**
 * Normalize duty status across providers
 */
export function normalizeDutyStatus(providerStatus, provider) {
  const statusMap = {
    // Motive statuses
    'D': 'driving',
    'ON': 'on_duty',
    'OFF': 'off_duty',
    'SB': 'sleeper',
    'driving': 'driving',
    'on_duty_not_driving': 'on_duty',
    'off_duty': 'off_duty',
    'sleeper_berth': 'sleeper',

    // Samsara statuses
    'onDutyDriving': 'driving',
    'onDutyNotDriving': 'on_duty',
    'offDuty': 'off_duty',
    'sleeperBerth': 'sleeper',

    // Geotab statuses
    'Driving': 'driving',
    'On': 'on_duty',
    'Off': 'off_duty',
    'Sleeper': 'sleeper'
  };

  return statusMap[providerStatus] || 'unknown';
}

/**
 * Base ELD Provider class
 * All provider implementations must extend this class
 */
export class BaseELDProvider {
  constructor(config = {}) {
    this.providerName = 'base';
    this.config = config;
    this.accessToken = config.accessToken || null;
    this.refreshToken = config.refreshToken || null;
    this.tokenExpiresAt = config.tokenExpiresAt || null;
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    return this.providerName;
  }

  /**
   * Check if this provider supports a specific feature
   * @param {string} feature - Feature name
   * @returns {boolean}
   */
  supportsFeature(feature) {
    const features = this.getSupportedFeatures();
    return features.includes(feature);
  }

  /**
   * Get list of supported features
   * @returns {string[]}
   */
  getSupportedFeatures() {
    // Override in subclass
    return ['vehicles', 'drivers', 'gps', 'hos'];
  }

  /**
   * Check if token needs refresh
   * @returns {boolean}
   */
  needsTokenRefresh() {
    if (!this.tokenExpiresAt) return false;
    const now = new Date();
    const expiresAt = new Date(this.tokenExpiresAt);
    // Refresh if expiring within 5 minutes
    return (expiresAt.getTime() - now.getTime()) < 5 * 60 * 1000;
  }

  // ============================================================
  // ABSTRACT METHODS - Must be implemented by subclasses
  // ============================================================

  /**
   * Initialize OAuth flow - get authorization URL
   * @param {string} redirectUri - Callback URL
   * @param {string} state - State parameter for CSRF protection
   * @returns {Promise<string>} Authorization URL
   */
  async getAuthorizationUrl(redirectUri, state) {
    throw new Error('getAuthorizationUrl must be implemented by provider');
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from callback
   * @param {string} redirectUri - Must match original redirect URI
   * @returns {Promise<{accessToken, refreshToken, expiresIn}>}
   */
  async exchangeCodeForTokens(code, redirectUri) {
    throw new Error('exchangeCodeForTokens must be implemented by provider');
  }

  /**
   * Refresh access token
   * @returns {Promise<{accessToken, refreshToken, expiresIn}>}
   */
  async refreshAccessToken() {
    throw new Error('refreshAccessToken must be implemented by provider');
  }

  /**
   * Verify connection is still valid
   * @returns {Promise<{valid: boolean, companyName?: string, eldProvider?: string}>}
   */
  async verifyConnection() {
    throw new Error('verifyConnection must be implemented by provider');
  }

  /**
   * Fetch all vehicles
   * @returns {Promise<Vehicle[]>}
   */
  async fetchVehicles() {
    throw new Error('fetchVehicles must be implemented by provider');
  }

  /**
   * Fetch all drivers
   * @returns {Promise<Driver[]>}
   */
  async fetchDrivers() {
    throw new Error('fetchDrivers must be implemented by provider');
  }

  /**
   * Fetch current GPS locations for all vehicles
   * @returns {Promise<GPSLocation[]>}
   */
  async fetchCurrentLocations() {
    throw new Error('fetchCurrentLocations must be implemented by provider');
  }

  /**
   * Fetch GPS location history for a vehicle
   * @param {string} vehicleId - Provider's vehicle ID
   * @param {string} startTime - ISO timestamp
   * @param {string} endTime - ISO timestamp
   * @returns {Promise<GPSLocation[]>}
   */
  async fetchLocationHistory(vehicleId, startTime, endTime) {
    throw new Error('fetchLocationHistory must be implemented by provider');
  }

  /**
   * Fetch HOS logs for all drivers
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @returns {Promise<HOSLog[]>}
   */
  async fetchHOSLogs(startDate, endDate) {
    throw new Error('fetchHOSLogs must be implemented by provider');
  }

  /**
   * Fetch IFTA trips/mileage for a quarter
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @returns {Promise<IFTATrip[]>}
   */
  async fetchIFTATrips(startDate, endDate) {
    throw new Error('fetchIFTATrips must be implemented by provider');
  }

  /**
   * Fetch IFTA mileage summary by jurisdiction
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @returns {Promise<{vehicleId, jurisdictionsMiles: {state: miles}}>}
   */
  async fetchIFTASummary(startDate, endDate) {
    throw new Error('fetchIFTASummary must be implemented by provider');
  }

  /**
   * Fetch vehicle fault codes
   * @returns {Promise<FaultCode[]>}
   */
  async fetchFaultCodes() {
    throw new Error('fetchFaultCodes must be implemented by provider');
  }

  /**
   * Fetch fuel purchases
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @returns {Promise<FuelPurchase[]>}
   */
  async fetchFuelPurchases(startDate, endDate) {
    throw new Error('fetchFuelPurchases must be implemented by provider');
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  /**
   * Make HTTP request with error handling
   * @param {string} url - Full URL
   * @param {object} options - Fetch options
   * @returns {Promise<object>}
   */
  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        throw new ELDRateLimitError(`Rate limited. Retry after ${retryAfter}s`, retryAfter);
      }

      if (response.status === 401) {
        throw new ELDAuthError('Invalid or expired token');
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ELDAPIError(`API error: ${response.status} - ${errorBody}`, response.status);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      if (error instanceof ELDError) throw error;
      throw new ELDAPIError(`Request failed: ${error.message}`);
    }
  }
}

// ============================================================
// CUSTOM ERROR CLASSES
// ============================================================

export class ELDError extends Error {
  constructor(message, code = 'ELD_ERROR') {
    super(message);
    this.name = 'ELDError';
    this.code = code;
  }
}

export class ELDAuthError extends ELDError {
  constructor(message) {
    super(message, 'ELD_AUTH_ERROR');
    this.name = 'ELDAuthError';
  }
}

export class ELDRateLimitError extends ELDError {
  constructor(message, retryAfter) {
    super(message, 'ELD_RATE_LIMIT');
    this.name = 'ELDRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ELDAPIError extends ELDError {
  constructor(message, statusCode) {
    super(message, 'ELD_API_ERROR');
    this.name = 'ELDAPIError';
    this.statusCode = statusCode;
  }
}

export default BaseELDProvider;
