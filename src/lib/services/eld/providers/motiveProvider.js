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
const MOTIVE_AUTH_URL = 'https://api.gomotive.com/oauth/authorize';
const MOTIVE_TOKEN_URL = 'https://api.gomotive.com/oauth/token';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[MotiveProvider]', ...args);

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
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'vehicles.read drivers.read hos.read ifta.read locations.read fault_codes.read fuel_purchases.read',
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
   */
  async verifyConnection() {
    try {
      const response = await this.request(`${this.baseUrl}/users/me`);
      return {
        valid: true,
        companyName: response.user?.company?.name || 'Unknown',
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
        for (const v of response.vehicles) {
          vehicles.push({
            id: v.id?.toString(),
            name: v.number || v.name,
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
        for (const d of response.users) {
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
   */
  async fetchCurrentLocations() {
    const response = await this.request(`${this.baseUrl}/vehicle_locations`);

    const locations = (response.vehicle_locations || []).map(loc => ({
      vehicleId: loc.vehicle?.id?.toString(),
      latitude: loc.latitude,
      longitude: loc.longitude,
      speedMph: loc.speed,
      heading: loc.bearing,
      odometerMiles: loc.odometer,
      engineHours: loc.engine_hours,
      address: loc.description,
      recordedAt: loc.located_at,
      metadata: {
        provider: 'motive',
        vehicleName: loc.vehicle?.number
      }
    }));

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
        for (const loc of response.vehicle_locations) {
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
   */
  async fetchHOSLogs(startDate, endDate) {
    const logs = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.request(
        `${this.baseUrl}/hos_logs?start_date=${startDate}&end_date=${endDate}&page_no=${page}&per_page=100`
      );

      if (response.hos_logs?.length > 0) {
        for (const hosLog of response.hos_logs) {
          logs.push({
            driverId: hosLog.driver?.id?.toString(),
            vehicleId: hosLog.vehicle?.id?.toString(),
            dutyStatus: normalizeDutyStatus(hosLog.status, 'motive'),
            startTime: hosLog.start_time,
            endTime: hosLog.end_time,
            durationMinutes: hosLog.duration ? Math.round(hosLog.duration / 60) : null,
            location: hosLog.location?.name,
            latitude: hosLog.location?.lat,
            longitude: hosLog.location?.lon,
            annotations: hosLog.notes,
            logDate: hosLog.log_date,
            metadata: {
              provider: 'motive',
              origin: hosLog.origin,
              edited: hosLog.edited
            }
          });
        }
        page++;
        hasMore = response.hos_logs.length === 100;
      } else {
        hasMore = false;
      }
    }

    log(`Fetched ${logs.length} HOS logs from Motive`);
    return logs;
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

      if (response.ifta_trips?.length > 0) {
        for (const trip of response.ifta_trips) {
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

    const summaries = [];

    if (response.ifta_summary) {
      for (const summary of response.ifta_summary) {
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
        for (const fault of response.fault_codes) {
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
        for (const purchase of response.fuel_purchases) {
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
