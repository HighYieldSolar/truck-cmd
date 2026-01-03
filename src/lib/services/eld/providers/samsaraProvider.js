/**
 * Samsara ELD Provider
 *
 * API Documentation: https://developers.samsara.com
 *
 * Samsara is the #2 ELD provider with ~15% market share.
 * Uses Bearer token authentication and has IFTA jurisdiction reports.
 */

import { BaseELDProvider, normalizeDutyStatus, ELDAuthError, ELDAPIError } from './baseProvider';

const SAMSARA_API_BASE = 'https://api.samsara.com';
const SAMSARA_AUTH_URL = 'https://api.samsara.com/oauth2/authorize';
const SAMSARA_TOKEN_URL = 'https://api.samsara.com/oauth2/token';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[SamsaraProvider]', ...args);

export class SamsaraProvider extends BaseELDProvider {
  constructor(config = {}) {
    super(config);
    this.providerName = 'samsara';
    this.baseUrl = SAMSARA_API_BASE;
    this.clientId = config.clientId || process.env.SAMSARA_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.SAMSARA_CLIENT_SECRET;
    this.apiKey = config.apiKey || process.env.SAMSARA_API_KEY;
  }

  /**
   * Get supported features
   */
  getSupportedFeatures() {
    return [
      'vehicles',
      'drivers',
      'gps',
      'gps_feed',        // Real-time GPS feed
      'gps_history',     // Historical GPS data
      'hos',
      'ifta',            // IFTA jurisdiction reports
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
      scope: 'vehicles:read drivers:read vehicle_stats:read hos:read ifta:read',
      state: state
    });

    return `${SAMSARA_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code, redirectUri) {
    const response = await fetch(SAMSARA_TOKEN_URL, {
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

    const response = await fetch(SAMSARA_TOKEN_URL, {
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
      const response = await this.request(`${this.baseUrl}/fleet/vehicles?limit=1`);
      return {
        valid: true,
        companyName: 'Samsara Organization',
        eldProvider: 'Samsara'
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
    let hasMore = true;
    let cursor = null;

    while (hasMore) {
      const url = cursor
        ? `${this.baseUrl}/fleet/vehicles?after=${cursor}`
        : `${this.baseUrl}/fleet/vehicles`;

      const response = await this.request(url);

      if (response.data?.length > 0) {
        for (const v of response.data) {
          vehicles.push({
            id: v.id?.toString(),
            name: v.name,
            vin: v.vin,
            licensePlate: v.licensePlate,
            make: v.make,
            model: v.model,
            year: v.year?.toString(),
            odometerMiles: v.odometerMeters ? v.odometerMeters * 0.000621371 : null,
            engineHours: v.engineHours,
            status: v.vehicleRegulationMode === 'regulated' ? 'active' : 'inactive',
            metadata: {
              provider: 'samsara',
              serial: v.serial,
              externalIds: v.externalIds,
              notes: v.notes,
              tags: v.tags?.map(t => t.name)
            }
          });
        }
      }

      // Handle pagination
      hasMore = response.pagination?.hasNextPage || false;
      cursor = response.pagination?.endCursor;
    }

    log(`Fetched ${vehicles.length} vehicles from Samsara`);
    return vehicles;
  }

  /**
   * Fetch all drivers
   */
  async fetchDrivers() {
    const drivers = [];
    let hasMore = true;
    let cursor = null;

    while (hasMore) {
      const url = cursor
        ? `${this.baseUrl}/fleet/drivers?after=${cursor}`
        : `${this.baseUrl}/fleet/drivers`;

      const response = await this.request(url);

      if (response.data?.length > 0) {
        for (const d of response.data) {
          drivers.push({
            id: d.id?.toString(),
            firstName: d.name?.split(' ')[0] || d.name,
            lastName: d.name?.split(' ').slice(1).join(' ') || '',
            email: d.email,
            phone: d.phone,
            licenseNumber: d.licenseNumber,
            licenseState: d.licenseState,
            status: d.driverActivationStatus === 'active' ? 'active' : 'inactive',
            metadata: {
              provider: 'samsara',
              username: d.username,
              externalIds: d.externalIds,
              eldSettings: d.eldSettings,
              carrierSettings: d.carrierSettings
            }
          });
        }
      }

      hasMore = response.pagination?.hasNextPage || false;
      cursor = response.pagination?.endCursor;
    }

    log(`Fetched ${drivers.length} drivers from Samsara`);
    return drivers;
  }

  /**
   * Fetch current GPS locations
   */
  async fetchCurrentLocations() {
    const response = await this.request(
      `${this.baseUrl}/fleet/vehicles/stats?types=gps`
    );

    const locations = [];

    if (response.data) {
      for (const vehicle of response.data) {
        const gpsData = vehicle.gps?.[0];
        if (gpsData) {
          locations.push({
            vehicleId: vehicle.id?.toString(),
            latitude: gpsData.latitude,
            longitude: gpsData.longitude,
            speedMph: gpsData.speedMilesPerHour,
            heading: gpsData.headingDegrees,
            odometerMiles: gpsData.odometerMeters ? gpsData.odometerMeters * 0.000621371 : null,
            address: gpsData.reverseGeo?.formattedLocation,
            recordedAt: gpsData.time,
            metadata: {
              provider: 'samsara',
              vehicleName: vehicle.name
            }
          });
        }
      }
    }

    log(`Fetched ${locations.length} locations from Samsara`);
    return locations;
  }

  /**
   * Fetch location history for a vehicle
   * Uses the stats/history endpoint for historical data
   */
  async fetchLocationHistory(vehicleId, startTime, endTime) {
    const locations = [];
    let hasMore = true;
    let cursor = null;

    while (hasMore) {
      let url = `${this.baseUrl}/fleet/vehicles/stats/history?vehicleIds=${vehicleId}&types=gps&startTime=${startTime}&endTime=${endTime}`;
      if (cursor) {
        url += `&after=${cursor}`;
      }

      const response = await this.request(url);

      if (response.data) {
        for (const vehicle of response.data) {
          if (vehicle.gps) {
            for (const gpsData of vehicle.gps) {
              locations.push({
                vehicleId: vehicle.id?.toString(),
                latitude: gpsData.latitude,
                longitude: gpsData.longitude,
                speedMph: gpsData.speedMilesPerHour,
                heading: gpsData.headingDegrees,
                odometerMiles: gpsData.odometerMeters ? gpsData.odometerMeters * 0.000621371 : null,
                address: gpsData.reverseGeo?.formattedLocation,
                recordedAt: gpsData.time,
                metadata: { provider: 'samsara' }
              });
            }
          }
        }
      }

      hasMore = response.pagination?.hasNextPage || false;
      cursor = response.pagination?.endCursor;
    }

    return locations;
  }

  /**
   * Fetch HOS logs
   * Samsara stores HOS data via driver logs
   */
  async fetchHOSLogs(startDate, endDate) {
    const logs = [];
    let hasMore = true;
    let cursor = null;

    // Convert dates to ISO format for Samsara API
    const startTime = new Date(startDate).toISOString();
    const endTime = new Date(endDate + 'T23:59:59').toISOString();

    while (hasMore) {
      let url = `${this.baseUrl}/fleet/hos/logs?startTime=${startTime}&endTime=${endTime}`;
      if (cursor) {
        url += `&after=${cursor}`;
      }

      const response = await this.request(url);

      if (response.data?.length > 0) {
        for (const hosLog of response.data) {
          logs.push({
            driverId: hosLog.driver?.id?.toString(),
            vehicleId: hosLog.vehicle?.id?.toString(),
            dutyStatus: normalizeDutyStatus(hosLog.hosStatusType, 'samsara'),
            startTime: hosLog.startTime,
            endTime: hosLog.endTime,
            durationMinutes: hosLog.durationMs ? Math.round(hosLog.durationMs / 60000) : null,
            location: hosLog.location?.name,
            latitude: hosLog.location?.latitude,
            longitude: hosLog.location?.longitude,
            annotations: hosLog.remark,
            logDate: hosLog.logStartTime?.split('T')[0],
            metadata: {
              provider: 'samsara',
              logId: hosLog.id,
              origin: hosLog.origin,
              coDrivers: hosLog.coDrivers
            }
          });
        }
      }

      hasMore = response.pagination?.hasNextPage || false;
      cursor = response.pagination?.endCursor;
    }

    log(`Fetched ${logs.length} HOS logs from Samsara`);
    return logs;
  }

  /**
   * Fetch IFTA jurisdiction reports
   * Samsara has a dedicated IFTA endpoint
   */
  async fetchIFTATrips(startDate, endDate) {
    const trips = [];

    // Samsara IFTA endpoint: /fleet/reports/ifta/jurisdiction
    const url = `${this.baseUrl}/fleet/reports/ifta/jurisdiction?startDate=${startDate}&endDate=${endDate}`;

    try {
      const response = await this.request(url);

      if (response.data) {
        for (const report of response.data) {
          // Build jurisdiction miles map from the report
          const jurisdictionsMiles = {};

          if (report.jurisdictions) {
            for (const jurisdiction of report.jurisdictions) {
              const state = jurisdiction.jurisdiction;
              if (state) {
                jurisdictionsMiles[state] = (jurisdiction.totalDistanceMiles || 0);
              }
            }
          }

          trips.push({
            vehicleId: report.vehicle?.id?.toString(),
            driverId: null, // IFTA reports are vehicle-based
            startJurisdiction: null,
            endJurisdiction: null,
            jurisdictionsMiles,
            totalMiles: report.totalDistanceMiles || 0,
            startOdometer: null,
            endOdometer: null,
            startTime: startDate,
            endTime: endDate,
            metadata: {
              provider: 'samsara',
              vehicleName: report.vehicle?.name,
              fuelConsumedGallons: report.totalFuelConsumedGallons
            }
          });
        }
      }
    } catch (error) {
      log('IFTA jurisdiction fetch error:', error);
      // Fall back to calculating from GPS data if IFTA endpoint fails
      return this.calculateIFTAFromGPS(startDate, endDate);
    }

    log(`Fetched ${trips.length} IFTA reports from Samsara`);
    return trips;
  }

  /**
   * Fetch IFTA mileage summary by jurisdiction
   */
  async fetchIFTASummary(startDate, endDate) {
    const summaries = [];

    const url = `${this.baseUrl}/fleet/reports/ifta/jurisdiction?startDate=${startDate}&endDate=${endDate}`;

    try {
      const response = await this.request(url);

      if (response.data) {
        for (const report of response.data) {
          const jurisdictionsMiles = {};

          if (report.jurisdictions) {
            for (const jurisdiction of report.jurisdictions) {
              if (jurisdiction.jurisdiction) {
                jurisdictionsMiles[jurisdiction.jurisdiction] = jurisdiction.totalDistanceMiles || 0;
              }
            }
          }

          summaries.push({
            vehicleId: report.vehicle?.id?.toString(),
            vehicleName: report.vehicle?.name,
            jurisdictionsMiles,
            totalMiles: report.totalDistanceMiles || 0,
            metadata: {
              provider: 'samsara',
              fuelConsumedGallons: report.totalFuelConsumedGallons,
              fuelType: report.fuelType
            }
          });
        }
      }
    } catch (error) {
      log('IFTA summary fetch error:', error);
    }

    log(`Fetched IFTA summary for ${summaries.length} vehicles from Samsara`);
    return summaries;
  }

  /**
   * Calculate IFTA from GPS data (fallback method)
   * Used when IFTA endpoint is not available
   */
  async calculateIFTAFromGPS(startDate, endDate) {
    log('Calculating IFTA from GPS data (fallback)');
    const trips = [];

    // Get all vehicles
    const vehicles = await this.fetchVehicles();

    for (const vehicle of vehicles) {
      try {
        const history = await this.fetchLocationHistory(
          vehicle.id,
          new Date(startDate).toISOString(),
          new Date(endDate + 'T23:59:59').toISOString()
        );

        if (history.length > 0) {
          // Group by jurisdiction using reverse geocoding
          const jurisdictionsMiles = {};
          let prevLocation = null;

          for (const loc of history) {
            if (prevLocation && loc.latitude && loc.longitude) {
              // Calculate distance between points
              const distance = this.calculateDistance(
                prevLocation.latitude, prevLocation.longitude,
                loc.latitude, loc.longitude
              );

              // Extract state from address (simplified)
              const state = this.extractStateFromAddress(loc.address);
              if (state) {
                jurisdictionsMiles[state] = (jurisdictionsMiles[state] || 0) + distance;
              }
            }
            prevLocation = loc;
          }

          const totalMiles = Object.values(jurisdictionsMiles).reduce((a, b) => a + b, 0);

          if (totalMiles > 0) {
            trips.push({
              vehicleId: vehicle.id,
              driverId: null,
              startJurisdiction: null,
              endJurisdiction: null,
              jurisdictionsMiles,
              totalMiles,
              startOdometer: history[0]?.odometerMiles,
              endOdometer: history[history.length - 1]?.odometerMiles,
              startTime: history[0]?.recordedAt,
              endTime: history[history.length - 1]?.recordedAt,
              metadata: {
                provider: 'samsara',
                calculatedFromGPS: true
              }
            });
          }
        }
      } catch (error) {
        log(`Error calculating IFTA for vehicle ${vehicle.id}:`, error);
      }
    }

    return trips;
  }

  /**
   * Fetch vehicle fault codes
   */
  async fetchFaultCodes() {
    const faults = [];
    let hasMore = true;
    let cursor = null;

    while (hasMore) {
      let url = `${this.baseUrl}/fleet/vehicles/stats?types=faultCodes`;
      if (cursor) {
        url += `&after=${cursor}`;
      }

      const response = await this.request(url);

      if (response.data) {
        for (const vehicle of response.data) {
          if (vehicle.faultCodes) {
            for (const faultData of vehicle.faultCodes) {
              if (faultData.faultCodes) {
                for (const fault of faultData.faultCodes) {
                  faults.push({
                    vehicleId: vehicle.id?.toString(),
                    code: fault.faultCode || fault.dtcShortCode,
                    description: fault.description,
                    severity: this.mapFaultSeverity(fault.severity),
                    source: fault.source || 'engine',
                    firstObservedAt: faultData.time,
                    lastObservedAt: faultData.time,
                    isActive: fault.isActive !== false,
                    metadata: {
                      provider: 'samsara',
                      spn: fault.spn,
                      fmi: fault.fmi,
                      txId: fault.txId
                    }
                  });
                }
              }
            }
          }
        }
      }

      hasMore = response.pagination?.hasNextPage || false;
      cursor = response.pagination?.endCursor;
    }

    log(`Fetched ${faults.length} fault codes from Samsara`);
    return faults;
  }

  /**
   * Fetch fuel purchases
   * Note: Samsara may have fuel data through integrations
   */
  async fetchFuelPurchases(startDate, endDate) {
    const purchases = [];

    // Samsara doesn't have a dedicated fuel purchases endpoint
    // Fuel data comes from integrations or manual entry
    // We can approximate from vehicle stats if fuel level data is available

    try {
      const url = `${this.baseUrl}/fleet/vehicles/stats/history?types=fuelPercents&startTime=${new Date(startDate).toISOString()}&endTime=${new Date(endDate + 'T23:59:59').toISOString()}`;
      const response = await this.request(url);

      // Look for fuel level increases that indicate a fill-up
      if (response.data) {
        for (const vehicle of response.data) {
          if (vehicle.fuelPercents) {
            let prevFuelLevel = null;

            for (const fuelData of vehicle.fuelPercents) {
              const currentLevel = fuelData.value;

              // Detect fuel increase (fill-up)
              if (prevFuelLevel !== null && currentLevel > prevFuelLevel + 10) {
                // Estimate gallons based on tank capacity (approximate)
                const estimatedGallons = (currentLevel - prevFuelLevel) * 0.5; // Assume 50 gallon tank

                purchases.push({
                  vehicleId: vehicle.id?.toString(),
                  driverId: null,
                  jurisdiction: null, // Would need GPS location
                  gallons: estimatedGallons,
                  totalCost: null,
                  pricePerGallon: null,
                  fuelType: 'diesel',
                  merchantName: null,
                  merchantAddress: null,
                  transactionDate: fuelData.time,
                  metadata: {
                    provider: 'samsara',
                    estimated: true,
                    fuelLevelBefore: prevFuelLevel,
                    fuelLevelAfter: currentLevel
                  }
                });
              }

              prevFuelLevel = currentLevel;
            }
          }
        }
      }
    } catch (error) {
      log('Fuel purchases fetch error:', error);
    }

    log(`Estimated ${purchases.length} fuel purchases from Samsara`);
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
      'info': 'info',
      'MIL': 'critical',  // Malfunction Indicator Lamp
      'RED': 'critical',
      'AMBER': 'warning',
      'WHITE': 'info'
    };
    return map[severity?.toString()] || 'info';
  }

  /**
   * Calculate distance between two GPS points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Extract state code from address string
   */
  extractStateFromAddress(address) {
    if (!address) return null;

    // US state abbreviations
    const statePattern = /\b([A-Z]{2})\s*\d{5}|\b([A-Z]{2}),?\s*USA/i;
    const match = address.match(statePattern);

    if (match) {
      return (match[1] || match[2]).toUpperCase();
    }

    // Try to find state name
    const states = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY'
    };

    for (const [name, abbr] of Object.entries(states)) {
      if (address.includes(name)) {
        return abbr;
      }
    }

    return null;
  }
}

export default SamsaraProvider;
