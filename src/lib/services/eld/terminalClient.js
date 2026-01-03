/**
 * Terminal API Client
 *
 * A wrapper for the Terminal (withterminal.com) aggregator API that provides
 * unified access to 232+ ELD/telematics providers.
 *
 * API Documentation: https://docs.withterminal.com
 */

const TERMINAL_API_BASE = process.env.TERMINAL_API_URL || 'https://api.withterminal.com/tsp/v1';
const TERMINAL_SECRET_KEY = process.env.TERMINAL_SECRET_KEY;

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequestsPerSecond: 10,
  requestQueue: [],
  lastRequestTime: 0
};

/**
 * Terminal API Client class
 * Handles authentication, rate limiting, and API calls
 */
export class TerminalClient {
  constructor(connectionToken = null) {
    this.connectionToken = connectionToken;
    this.baseUrl = TERMINAL_API_BASE;
  }

  /**
   * Make an authenticated request to the Terminal API
   * @param {string} endpoint - API endpoint (e.g., '/vehicles')
   * @param {object} options - Fetch options
   * @returns {Promise<object>} - API response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    // Use connection token if available, otherwise use secret key
    if (this.connectionToken) {
      headers['Authorization'] = `Bearer ${this.connectionToken}`;
    } else if (TERMINAL_SECRET_KEY) {
      headers['Authorization'] = `Bearer ${TERMINAL_SECRET_KEY}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        timeout: options.timeout || 30000
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        throw new TerminalRateLimitError(`Rate limited. Retry after ${retryAfter} seconds`, retryAfter);
      }

      // Handle authentication errors
      if (response.status === 401) {
        throw new TerminalAuthError('Invalid or expired connection token');
      }

      // Handle not found
      if (response.status === 404) {
        return null;
      }

      // Handle other errors
      if (!response.ok) {
        const errorBody = await response.text();
        throw new TerminalAPIError(`API error: ${response.status} - ${errorBody}`, response.status);
      }

      // Parse JSON response
      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof TerminalError) {
        throw error;
      }
      throw new TerminalAPIError(`Request failed: ${error.message}`);
    }
  }

  // ==========================================
  // Connection Management
  // ==========================================

  /**
   * Get connection details
   * @returns {Promise<object>} - Connection information
   */
  async getConnection() {
    return this.request('/connections/current');
  }

  /**
   * Update connection settings
   * @param {object} settings - Settings to update
   * @returns {Promise<object>} - Updated connection
   */
  async updateConnection(settings) {
    return this.request('/connections/current', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  }

  // ==========================================
  // Vehicles
  // ==========================================

  /**
   * List all vehicles
   * @param {object} params - Query parameters (cursor, limit, raw)
   * @returns {Promise<object>} - Paginated vehicle list
   */
  async listVehicles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/vehicles?${queryString}` : '/vehicles';
    return this.request(endpoint);
  }

  /**
   * Get a specific vehicle
   * @param {string} vehicleId - Terminal vehicle ID
   * @returns {Promise<object>} - Vehicle details
   */
  async getVehicle(vehicleId) {
    return this.request(`/vehicles/${vehicleId}`);
  }

  /**
   * Get latest locations for all vehicles
   * @param {object} params - Query parameters (cursor, limit)
   * @returns {Promise<object>} - Vehicle locations
   */
  async getLatestVehicleLocations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/vehicles/locations?${queryString}` : '/vehicles/locations';
    return this.request(endpoint);
  }

  /**
   * Get historical locations for a vehicle
   * @param {string} vehicleId - Terminal vehicle ID
   * @param {string} startTime - ISO 8601 start time
   * @param {string} endTime - ISO 8601 end time
   * @param {object} params - Additional query parameters
   * @returns {Promise<object>} - Historical locations
   */
  async getVehicleLocationHistory(vehicleId, startTime, endTime, params = {}) {
    const queryParams = new URLSearchParams({
      startTime,
      endTime,
      ...params
    }).toString();
    return this.request(`/vehicles/${vehicleId}/locations?${queryParams}`);
  }

  // ==========================================
  // Drivers
  // ==========================================

  /**
   * List all drivers
   * @param {object} params - Query parameters (cursor, limit, raw)
   * @returns {Promise<object>} - Paginated driver list
   */
  async listDrivers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/drivers?${queryString}` : '/drivers';
    return this.request(endpoint);
  }

  /**
   * Get a specific driver
   * @param {string} driverId - Terminal driver ID
   * @returns {Promise<object>} - Driver details
   */
  async getDriver(driverId) {
    return this.request(`/drivers/${driverId}`);
  }

  // ==========================================
  // HOS (Hours of Service)
  // ==========================================

  /**
   * Get available HOS time for all drivers
   * @param {object} params - Query parameters (cursor, limit)
   * @returns {Promise<object>} - Available time for drivers
   */
  async getHosAvailableTime(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/hos/available-time?${queryString}` : '/hos/available-time';
    return this.request(endpoint);
  }

  /**
   * Get HOS logs (duty status changes)
   * @param {string} startTime - ISO 8601 start time
   * @param {string} endTime - ISO 8601 end time
   * @param {object} params - Additional query parameters (driverId, cursor, limit)
   * @returns {Promise<object>} - HOS log entries
   */
  async listHosLogs(startTime, endTime, params = {}) {
    const queryParams = new URLSearchParams({
      startTime,
      endTime,
      ...params
    }).toString();
    return this.request(`/hos/logs?${queryParams}`);
  }

  /**
   * Get HOS daily logs (summaries)
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {object} params - Additional query parameters (driverId, cursor, limit)
   * @returns {Promise<object>} - Daily log summaries
   */
  async listHosDailyLogs(startDate, endDate, params = {}) {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      ...params
    }).toString();
    return this.request(`/hos/daily-logs?${queryParams}`);
  }

  // ==========================================
  // IFTA
  // ==========================================

  /**
   * Get IFTA summary (jurisdiction mileage)
   * @param {string} startMonth - Start month (YYYY-MM)
   * @param {string} endMonth - End month (YYYY-MM)
   * @param {object} params - Additional query parameters (vehicleId, cursor, limit)
   * @returns {Promise<object>} - IFTA mileage by jurisdiction
   */
  async getIftaSummary(startMonth, endMonth, params = {}) {
    const queryParams = new URLSearchParams({
      startMonth,
      endMonth,
      ...params
    }).toString();
    return this.request(`/ifta/summary?${queryParams}`);
  }

  // ==========================================
  // Safety / Fault Codes
  // ==========================================

  /**
   * List safety events (fault codes, violations)
   * @param {string} startTime - ISO 8601 start time
   * @param {string} endTime - ISO 8601 end time
   * @param {object} params - Additional query parameters (vehicleId, driverId, cursor, limit)
   * @returns {Promise<object>} - Safety events
   */
  async listSafetyEvents(startTime, endTime, params = {}) {
    const queryParams = new URLSearchParams({
      startTime,
      endTime,
      ...params
    }).toString();
    return this.request(`/safety/events?${queryParams}`);
  }

  // ==========================================
  // Sync Management
  // ==========================================

  /**
   * Request a data sync from the provider
   * @param {string[]} dataTypes - Data types to sync (vehicles, drivers, hos, ifta, safety)
   * @returns {Promise<object>} - Sync job details
   */
  async requestSync(dataTypes = []) {
    return this.request('/syncs', {
      method: 'POST',
      body: JSON.stringify({ dataTypes })
    });
  }

  /**
   * Get sync job status
   * @param {string} syncId - Sync job ID
   * @returns {Promise<object>} - Sync job status
   */
  async getSyncStatus(syncId) {
    return this.request(`/syncs/${syncId}`);
  }

  /**
   * List recent sync jobs
   * @param {object} params - Query parameters (cursor, limit)
   * @returns {Promise<object>} - Sync job history
   */
  async listSyncs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/syncs?${queryString}` : '/syncs';
    return this.request(endpoint);
  }

  // ==========================================
  // Passthrough (Raw Provider Data)
  // ==========================================

  /**
   * Make a passthrough request to the underlying provider
   * @param {string} method - HTTP method
   * @param {string} path - Provider API path
   * @param {object} body - Request body (for POST/PATCH)
   * @returns {Promise<object>} - Raw provider response
   */
  async passthrough(method, path, body = null) {
    const options = { method };
    if (body) {
      options.body = JSON.stringify(body);
    }
    return this.request(`/passthrough?path=${encodeURIComponent(path)}`, options);
  }
}

// ==========================================
// Error Classes
// ==========================================

export class TerminalError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TerminalError';
  }
}

export class TerminalAPIError extends TerminalError {
  constructor(message, statusCode = null) {
    super(message);
    this.name = 'TerminalAPIError';
    this.statusCode = statusCode;
  }
}

export class TerminalAuthError extends TerminalError {
  constructor(message) {
    super(message);
    this.name = 'TerminalAuthError';
  }
}

export class TerminalRateLimitError extends TerminalError {
  constructor(message, retryAfter = 60) {
    super(message);
    this.name = 'TerminalRateLimitError';
    this.retryAfter = retryAfter;
  }
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Create a Terminal client with a connection token
 * @param {string} connectionToken - User's connection token
 * @returns {TerminalClient} - Configured client instance
 */
export function createTerminalClient(connectionToken) {
  return new TerminalClient(connectionToken);
}

/**
 * Convert Terminal duty status to our format
 * @param {string} terminalStatus - Terminal duty status code
 * @returns {string} - Normalized status code
 */
export function normalizeDutyStatus(terminalStatus) {
  const statusMap = {
    'OFF_DUTY': 'OFF',
    'SLEEPER_BERTH': 'SB',
    'DRIVING': 'D',
    'ON_DUTY_NOT_DRIVING': 'ON',
    'ON_DUTY': 'ON',
    // Handle already normalized values
    'OFF': 'OFF',
    'SB': 'SB',
    'D': 'D',
    'ON': 'ON'
  };
  return statusMap[terminalStatus?.toUpperCase()] || 'OFF';
}

/**
 * Convert month string to quarter string
 * @param {string} month - Month in YYYY-MM format
 * @returns {string} - Quarter in YYYY-QN format
 */
export function monthToQuarter(month) {
  const [year, m] = month.split('-');
  const quarter = Math.ceil(parseInt(m) / 3);
  return `${year}-Q${quarter}`;
}

/**
 * Get start and end months for a quarter
 * @param {string} quarter - Quarter in YYYY-QN format
 * @returns {object} - { startMonth, endMonth } in YYYY-MM format
 */
export function quarterToMonths(quarter) {
  const [year, q] = quarter.split('-Q');
  const quarterNum = parseInt(q);
  const startMonth = (quarterNum - 1) * 3 + 1;
  const endMonth = quarterNum * 3;
  return {
    startMonth: `${year}-${startMonth.toString().padStart(2, '0')}`,
    endMonth: `${year}-${endMonth.toString().padStart(2, '0')}`
  };
}

/**
 * Parse ISO date to components
 * @param {string} isoDate - ISO 8601 date string
 * @returns {object} - { year, month, day, quarter }
 */
export function parseISODate(isoDate) {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const quarter = Math.ceil(month / 3);
  return {
    year,
    month,
    day,
    quarter,
    quarterString: `${year}-Q${quarter}`
  };
}

export default TerminalClient;
