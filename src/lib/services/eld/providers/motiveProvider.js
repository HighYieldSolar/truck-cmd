/**
 * Motive (formerly KeepTruckin) ELD Provider
 *
 * API Documentation: https://developer.gomotive.com
 *
 * Motive is the largest ELD provider with ~20% market share.
 * Features dedicated IFTA endpoints for jurisdiction mileage.
 */

import { BaseELDProvider, normalizeDutyStatus, ELDAuthError, ELDAPIError } from './baseProvider';

const MOTIVE_API_BASE = 'https://api.gomotive.com/v1';
// OAuth endpoints - auth on gomotive.com, token on keeptruckin.com (legacy domain)
// See: https://developer-docs.gomotive.com/docs/generate-an-oauth-token
const MOTIVE_AUTH_URL = 'https://gomotive.com/oauth/authorize';
const MOTIVE_TOKEN_URL = 'https://keeptruckin.com/oauth/token';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[MotiveProvider]', ...args);
// Production logging for API responses
const apiLog = (...args) => console.log('[MotiveAPI]', ...args);

export class MotiveProvider extends BaseELDProvider {
  constructor(config = {}) {
    super(config);
    this.providerName = 'motive';
    this.baseUrl = MOTIVE_API_BASE;
    this.clientId = config.clientId || process.env.MOTIVE_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.MOTIVE_CLIENT_SECRET;
    this.apiKey = config.apiKey || process.env.MOTIVE_API_KEY;
  }

  /**
   * Get supported features
   */
  getSupportedFeatures() {
    return [
      'vehicles',
      'drivers',
      'gps',
      'hos',
      'ifta',           // Dedicated IFTA endpoints!
      'ifta_trips',     // /v1/ifta/trips
      'ifta_summary',   // /v1/ifta/summary
      'fault_codes',
      'fuel_purchases',
      'webhooks'
    ];
  }

  /**
   * Get authorization URL for OAuth flow
   */
  async getAuthorizationUrl(redirectUri, state) {
    // Motive OAuth scopes - see https://developer-docs.gomotive.com/docs/oauth-scopes
    const scopes = [
      'companies.read',                    // Company details (recommended)
      'vehicles.read',                     // Vehicle data
      'users.read',                        // Drivers and fleet managers
      'hos_logs.read',                     // HOS logs
      'hos_logs.hours_of_service',         // Hours of service summary
      'ifta_reports.trips',                // IFTA trip reports
      'ifta_reports.summary',              // IFTA mileage summary
      'locations.vehicle_locations_list',  // Current vehicle locations
      'locations.vehicle_locations_single', // Vehicle location history
      'fault_codes.read',                  // Vehicle fault codes
      'fuel_purchases.read'                // Fuel purchases
    ].join(' ');

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state: state
    });

    return `${MOTIVE_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code, redirectUri) {
    const response = await fetch(MOTIVE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ELDAuthError(`Token exchange failed: ${error}`);
    }

    const data = await response.json();

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new ELDAuthError('No refresh token available');
    }

    const response = await fetch(MOTIVE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    if (!response.ok) {
      throw new ELDAuthError('Token refresh failed');
    }

    const data = await response.json();

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token || this.refreshToken;
    this.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    return {
      accessToken: data.access_token,
      refreshToken: this.refreshToken,
      expiresIn: data.expires_in
    };
  }

  /**
   * Verify connection is valid
   * Uses /users endpoint with per_page=1 to verify token works
   */
  async verifyConnection() {
    try {
      // Motive doesn't have a /users/me endpoint
      // Use /users with per_page=1 to verify the token works
      const response = await this.request(`${this.baseUrl}/users?per_page=1&role=admin`);

      // Extract company info from the first admin user if available
      const firstUser = response.users?.[0]?.user;
      const companyName = firstUser?.carrier_name || 'Unknown';
      // Extract company_id for webhook matching
      const companyId = firstUser?.carrier_company_id || firstUser?.company_id || firstUser?.id;

      log('Connection verified successfully, company:', companyName, 'companyId:', companyId);

      return {
        valid: true,
        companyName,
        companyId: companyId?.toString(),
        eldProvider: 'Motive'
      };
    } catch (error) {
      log('Connection verification failed:', error);
      return { valid: false };
    }
  }

  /**
   * Fetch all vehicles
   */
  async fetchVehicles() {
    const vehicles = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.request(
        `${this.baseUrl}/vehicles?page_no=${page}&per_page=100`
      );

      if (response.vehicles?.length > 0) {
        for (const item of response.vehicles) {
          // Motive wraps each vehicle in a 'vehicle' object
          const v = item.vehicle || item;
          vehicles.push({
            id: v.id?.toString(),
            name: v.number || v.name || `Vehicle ${v.id}`,
            vin: v.vin,
            licensePlate: v.license_plate_number,
            make: v.make,
            model: v.model,
            year: v.year?.toString(),
            odometerMiles: v.current_odometer,
            engineHours: v.engine_hours,
            status: v.status || 'active',
            metadata: {
              provider: 'motive',
              eldDeviceId: v.eld_device?.id,
              eldDeviceSerial: v.eld_device?.serial_number,
              fuelType: v.fuel_type
            }
          });
        }
        page++;
        hasMore = response.vehicles.length === 100;
      } else {
        hasMore = false;
      }
    }

    log(`Fetched ${vehicles.length} vehicles from Motive`);
    return vehicles;
  }

  /**
   * Fetch all drivers
   */
  async fetchDrivers() {
    const drivers = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.request(
        `${this.baseUrl}/users?page_no=${page}&per_page=100&role=driver`
      );

      if (response.users?.length > 0) {
        for (const item of response.users) {
          // Motive wraps each user in a 'user' object
          const d = item.user || item;
          drivers.push({
            id: d.id?.toString(),
            firstName: d.first_name,
            lastName: d.last_name,
            email: d.email,
            phone: d.phone,
            licenseNumber: d.driver_license_number,
            licenseState: d.driver_license_state,
            status: d.status || 'active',
            metadata: {
              provider: 'motive',
              username: d.username,
              driverCompanyId: d.driver_company_id
            }
          });
        }
        page++;
        hasMore = response.users.length === 100;
      } else {
        hasMore = false;
      }
    }

    log(`Fetched ${drivers.length} drivers from Motive`);
    return drivers;
  }

  /**
   * Fetch current GPS locations
   * Tries v1/vehicle_locations first, falls back to v3 for newer Vehicle Gateway devices
   */
  async fetchCurrentLocations() {
    let locations = [];

    // Try v1 endpoint first
    try {
      const response = await this.request(`${this.baseUrl}/vehicle_locations`);

      // Log raw API response structure for debugging
      apiLog('v1 vehicle_locations response keys:', Object.keys(response || {}));
      apiLog('v1 vehicle_locations array length:', response?.vehicle_locations?.length || 0);

      if (response?.vehicle_locations?.length > 0) {
        locations = response.vehicle_locations.map(item => {
          // Motive wraps each location in a 'vehicle_location' object
          const loc = item.vehicle_location || item;
          return {
            vehicleId: loc.vehicle?.id?.toString(),
            latitude: loc.latitude || loc.lat,
            longitude: loc.longitude || loc.lon,
            speedMph: loc.speed,
            heading: loc.bearing,
            odometerMiles: loc.odometer,
            engineHours: loc.engine_hours,
            address: loc.description,
            recordedAt: loc.located_at,
            metadata: {
              provider: 'motive',
              vehicleName: loc.vehicle?.number,
              apiVersion: 'v1'
            }
          };
        });
      }
    } catch (e) {
      apiLog('v1 vehicle_locations failed:', e.message);
    }

    // If v1 returned no data, try v3 endpoint (for Vehicle Gateway devices)
    if (locations.length === 0) {
      try {
        // v3 endpoint returns vehicles with current_location embedded
        const v3Response = await this.request(`https://api.gomotive.com/v3/vehicle_locations`);

        apiLog('v3 vehicle_locations response keys:', Object.keys(v3Response || {}));
        apiLog('v3 vehicles array length:', v3Response?.vehicles?.length || 0);

        if (v3Response?.vehicles?.length > 0) {
          locations = v3Response.vehicles
            .filter(item => {
              const vehicle = item.vehicle || item;
              return vehicle.current_location?.lat && vehicle.current_location?.lon;
            })
            .map(item => {
              const vehicle = item.vehicle || item;
              const loc = vehicle.current_location || {};
              return {
                vehicleId: vehicle.id?.toString(),
                latitude: loc.lat,
                longitude: loc.lon,
                speedMph: loc.kph ? loc.kph * 0.621371 : loc.speed,
                heading: loc.bearing,
                odometerMiles: loc.true_odometer || loc.odometer,
                engineHours: loc.true_engine_hours || loc.engine_hours,
                address: loc.current_location || `${loc.city || ''}, ${loc.state || ''}`.trim(),
                recordedAt: loc.located_at,
                metadata: {
                  provider: 'motive',
                  vehicleName: vehicle.number,
                  vehicleState: loc.vehicle_state,
                  apiVersion: 'v3'
                }
              };
            });
        }
      } catch (e) {
        apiLog('v3 vehicle_locations failed:', e.message);
      }
    }

    // If still no locations, try driver_locations endpoint as last resort
    if (locations.length === 0) {
      try {
        const driverLocResponse = await this.request(`${this.baseUrl}/driver_locations`);

        apiLog('driver_locations response keys:', Object.keys(driverLocResponse || {}));
        apiLog('driver_locations array length:', driverLocResponse?.driver_locations?.length || 0);

        if (driverLocResponse?.driver_locations?.length > 0) {
          locations = driverLocResponse.driver_locations
            .filter(item => {
              const loc = item.driver_location || item;
              return loc.lat && loc.lon;
            })
            .map(item => {
              const loc = item.driver_location || item;
              const vehicle = loc.vehicle || {};
              return {
                vehicleId: vehicle.id?.toString(),
                latitude: loc.lat,
                longitude: loc.lon,
                speedMph: loc.speed,
                heading: loc.bearing,
                odometerMiles: null,
                engineHours: null,
                address: loc.description,
                recordedAt: loc.located_at,
                metadata: {
                  provider: 'motive',
                  vehicleName: vehicle.number,
                  driverId: loc.driver?.id,
                  driverName: `${loc.driver?.first_name || ''} ${loc.driver?.last_name || ''}`.trim(),
                  apiVersion: 'driver_locations'
                }
              };
            });
        }
      } catch (e) {
        apiLog('driver_locations failed:', e.message);
      }
    }

    log(`Fetched ${locations.length} locations from Motive`);
    return locations;
  }

  /**
   * Fetch location history for a vehicle
   */
  async fetchLocationHistory(vehicleId, startTime, endTime) {
    const locations = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.request(
        `${this.baseUrl}/vehicle_locations?vehicle_ids=${vehicleId}&start_date=${startTime}&end_date=${endTime}&page_no=${page}&per_page=100`
      );

      if (response.vehicle_locations?.length > 0) {
        for (const item of response.vehicle_locations) {
          // Motive wraps each location in a 'vehicle_location' object
          const loc = item.vehicle_location || item;
          locations.push({
            vehicleId: loc.vehicle?.id?.toString(),
            latitude: loc.latitude,
            longitude: loc.longitude,
            speedMph: loc.speed,
            heading: loc.bearing,
            odometerMiles: loc.odometer,
            engineHours: loc.engine_hours,
            address: loc.description,
            recordedAt: loc.located_at,
            metadata: { provider: 'motive' }
          });
        }
        page++;
        hasMore = response.vehicle_locations.length === 100;
      } else {
        hasMore = false;
      }
    }

    return locations;
  }

  /**
   * Fetch HOS logs
   * Motive API endpoint: /v1/logs (NOT /hos_logs)
   * Returns daily log summaries with events array containing duty status changes
   */
  async fetchHOSLogs(startDate, endDate) {
    const logs = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      // Correct endpoint is /logs, not /hos_logs
      const response = await this.request(
        `${this.baseUrl}/logs?start_date=${startDate}&end_date=${endDate}&page_no=${page}&per_page=100`
      );

      // Log first page response for debugging
      if (page === 1) {
        apiLog('logs response keys:', Object.keys(response || {}));
        apiLog('logs array length:', response?.logs?.length || 0);
        if (response?.logs?.[0]) {
          apiLog('First log structure:', Object.keys(response.logs[0]?.log || response.logs[0] || {}));
        }
      }

      if (response.logs?.length > 0) {
        for (const item of response.logs) {
          // Motive wraps each log in a 'log' object
          const dailyLog = item.log || item;
          const driver = dailyLog.driver;
          const vehicles = dailyLog.vehicles || [];
          const events = dailyLog.events || [];

          // Process each event (duty status change) in the daily log
          for (const eventItem of events) {
            const event = eventItem.event || eventItem;
            const vehicleId = vehicles[0]?.vehicle?.id || vehicles[0]?.id;

            logs.push({
              driverId: driver?.id?.toString(),
              vehicleId: vehicleId?.toString(),
              dutyStatus: normalizeDutyStatus(event.type, 'motive'),
              startTime: event.start_time,
              endTime: event.end_time,
              durationMinutes: this.calculateDurationMinutes(event.start_time, event.end_time),
              location: event.location,
              latitude: event.lat,
              longitude: event.lon,
              annotations: event.notes,
              logDate: dailyLog.date,
              metadata: {
                provider: 'motive',
                origin: event.origin,
                edited: event.edited,
                driverName: `${driver?.first_name || ''} ${driver?.last_name || ''}`.trim()
              }
            });
          }

          // Also create a daily summary if no events but we have duration data
          if (events.length === 0 && (dailyLog.driving_duration || dailyLog.on_duty_duration)) {
            logs.push({
              driverId: driver?.id?.toString(),
              vehicleId: vehicles[0]?.vehicle?.id?.toString() || vehicles[0]?.id?.toString(),
              dutyStatus: 'off_duty',
              startTime: `${dailyLog.date}T00:00:00Z`,
              endTime: `${dailyLog.date}T23:59:59Z`,
              durationMinutes: Math.round((dailyLog.off_duty_duration || 0) / 60),
              location: null,
              latitude: null,
              longitude: null,
              annotations: null,
              logDate: dailyLog.date,
              metadata: {
                provider: 'motive',
                dailySummary: true,
                drivingDuration: dailyLog.driving_duration,
                onDutyDuration: dailyLog.on_duty_duration,
                offDutyDuration: dailyLog.off_duty_duration,
                sleeperDuration: dailyLog.sleeper_duration
              }
            });
          }
        }
        page++;
        hasMore = response.logs.length === 100;
      } else {
        hasMore = false;
      }
    }

    log(`Fetched ${logs.length} HOS log events from Motive`);
    return logs;
  }

  /**
   * Calculate duration in minutes between two timestamps
   */
  calculateDurationMinutes(startTime, endTime) {
    if (!startTime || !endTime) return null;
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      return Math.round((end - start) / (1000 * 60));
    } catch (e) {
      return null;
    }
  }

  /**
   * Fetch IFTA trips with jurisdiction breakdown
   * This is Motive's dedicated IFTA endpoint!
   */
  async fetchIFTATrips(startDate, endDate) {
    const trips = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.request(
        `${this.baseUrl}/ifta/trips?start_date=${startDate}&end_date=${endDate}&page_no=${page}&per_page=100`
      );

      // Log first page response for debugging
      if (page === 1) {
        apiLog('ifta_trips response keys:', Object.keys(response || {}));
        apiLog('ifta_trips array length:', response?.ifta_trips?.length || 0);
      }

      if (response.ifta_trips?.length > 0) {
        for (const item of response.ifta_trips) {
          // Motive wraps each trip in an 'ifta_trip' object
          const trip = item.ifta_trip || item;

          // Build jurisdiction miles map
          const jurisdictionsMiles = {};
          if (trip.jurisdiction_details) {
            for (const jd of trip.jurisdiction_details) {
              const state = jd.jurisdiction;
              if (state) {
                jurisdictionsMiles[state] = (jurisdictionsMiles[state] || 0) + (jd.distance || 0);
              }
            }
          }

          trips.push({
            vehicleId: trip.vehicle?.id?.toString(),
            driverId: trip.driver?.id?.toString(),
            startJurisdiction: trip.start_jurisdiction,
            endJurisdiction: trip.end_jurisdiction,
            jurisdictionsMiles,
            totalMiles: trip.distance || 0,
            startOdometer: trip.start_odometer,
            endOdometer: trip.end_odometer,
            startTime: trip.start_time,
            endTime: trip.end_time,
            metadata: {
              provider: 'motive',
              tripId: trip.id,
              vehicleName: trip.vehicle?.number
            }
          });
        }
        page++;
        hasMore = response.ifta_trips.length === 100;
      } else {
        hasMore = false;
      }
    }

    log(`Fetched ${trips.length} IFTA trips from Motive`);
    return trips;
  }

  /**
   * Fetch IFTA mileage summary by jurisdiction
   * This is Motive's summary endpoint - pre-aggregated data!
   */
  async fetchIFTASummary(startDate, endDate) {
    const response = await this.request(
      `${this.baseUrl}/ifta/summary?start_date=${startDate}&end_date=${endDate}`
    );

    // Log raw API response structure for debugging
    apiLog('ifta_summary response keys:', Object.keys(response || {}));
    apiLog('ifta_summary array length:', response?.ifta_summary?.length || 0);

    const summaries = [];

    if (response.ifta_summary) {
      for (const item of response.ifta_summary) {
        // Motive may wrap each summary - handle both wrapped and unwrapped
        const summary = item.ifta_summary || item;
        const jurisdictionsMiles = {};

        if (summary.jurisdiction_breakdown) {
          for (const jb of summary.jurisdiction_breakdown) {
            if (jb.jurisdiction) {
              jurisdictionsMiles[jb.jurisdiction] = jb.distance || 0;
            }
          }
        }

        summaries.push({
          vehicleId: summary.vehicle?.id?.toString(),
          vehicleName: summary.vehicle?.number,
          jurisdictionsMiles,
          totalMiles: summary.total_distance || 0,
          metadata: {
            provider: 'motive',
            fuelType: summary.fuel_type
          }
        });
      }
    }

    log(`Fetched IFTA summary for ${summaries.length} vehicles from Motive`);
    return summaries;
  }

  /**
   * Fetch vehicle fault codes
   */
  async fetchFaultCodes() {
    const faults = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.request(
        `${this.baseUrl}/fault_codes?page_no=${page}&per_page=100`
      );

      if (response.fault_codes?.length > 0) {
        for (const item of response.fault_codes) {
          // Motive wraps each fault in a 'fault_code' object
          const fault = item.fault_code || item;
          faults.push({
            vehicleId: fault.vehicle?.id?.toString(),
            code: fault.code,
            description: fault.description,
            severity: this.mapFaultSeverity(fault.severity),
            source: fault.source || 'engine',
            firstObservedAt: fault.first_observed_at,
            lastObservedAt: fault.last_observed_at,
            isActive: fault.is_active !== false,
            metadata: {
              provider: 'motive',
              spn: fault.spn,
              fmi: fault.fmi
            }
          });
        }
        page++;
        hasMore = response.fault_codes.length === 100;
      } else {
        hasMore = false;
      }
    }

    log(`Fetched ${faults.length} fault codes from Motive`);
    return faults;
  }

  /**
   * Fetch fuel purchases
   */
  async fetchFuelPurchases(startDate, endDate) {
    const purchases = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.request(
        `${this.baseUrl}/fuel_purchases?start_date=${startDate}&end_date=${endDate}&page_no=${page}&per_page=100`
      );

      if (response.fuel_purchases?.length > 0) {
        for (const item of response.fuel_purchases) {
          // Motive wraps each purchase in a 'fuel_purchase' object
          const purchase = item.fuel_purchase || item;
          purchases.push({
            vehicleId: purchase.vehicle?.id?.toString(),
            driverId: purchase.driver?.id?.toString(),
            jurisdiction: purchase.state,
            gallons: purchase.gallons,
            totalCost: purchase.total_cost,
            pricePerGallon: purchase.price_per_gallon,
            fuelType: purchase.fuel_type || 'diesel',
            merchantName: purchase.merchant_name,
            merchantAddress: purchase.merchant_address,
            transactionDate: purchase.transaction_date,
            metadata: {
              provider: 'motive',
              odometerAtPurchase: purchase.odometer
            }
          });
        }
        page++;
        hasMore = response.fuel_purchases.length === 100;
      } else {
        hasMore = false;
      }
    }

    log(`Fetched ${purchases.length} fuel purchases from Motive`);
    return purchases;
  }

  /**
   * Map fault severity
   */
  mapFaultSeverity(severity) {
    const map = {
      'critical': 'critical',
      'high': 'critical',
      'medium': 'warning',
      'warning': 'warning',
      'low': 'info',
      'info': 'info'
    };
    return map[severity?.toLowerCase()] || 'info';
  }
}

export default MotiveProvider;
