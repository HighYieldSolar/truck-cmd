/**
 * ELD Sync Service
 *
 * Orchestrates data synchronization from ELD providers to Truck Command.
 * Handles vehicles, drivers, HOS logs, IFTA mileage, GPS locations, and fault codes.
 *
 * Supports multiple providers: Motive, Samsara (with unified data models)
 */

import { createClient } from '@supabase/supabase-js';
import { createProviderForConnection, updateConnectionStatus, updateLastSync } from './eldConnectionService';
import { getProviderInfo, providerSupportsFeature } from './providers';
import { mapVehicle, mapDriver, getLocalVehicleId, getLocalDriverId, autoMatchVehicles, autoMatchDrivers } from './eldMappingService';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[ELDSyncService]', ...args);

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ==========================================
// Sync Job Management
// ==========================================

/**
 * Create a sync job record
 * @param {string} connectionId - Connection UUID
 * @param {string} userId - User ID
 * @param {string} syncType - Type of sync (full, incremental, vehicles, drivers, hos, ifta, gps, faultcodes)
 * @returns {Promise<object>} - Created sync job
 */
async function createSyncJob(connectionId, userId, syncType) {
  const { data, error } = await supabaseAdmin
    .from('eld_sync_jobs')
    .insert({
      connection_id: connectionId,
      user_id: userId,
      sync_type: syncType,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    log('Error creating sync job:', error);
    return null;
  }

  return data;
}

/**
 * Update sync job status
 * @param {string} jobId - Sync job UUID
 * @param {string} status - New status (completed, failed)
 * @param {number} recordsSynced - Number of records synced
 * @param {string} errorMessage - Error message if failed
 */
async function updateSyncJob(jobId, status, recordsSynced = 0, errorMessage = null) {
  await supabaseAdmin
    .from('eld_sync_jobs')
    .update({
      status,
      completed_at: new Date().toISOString(),
      records_synced: recordsSynced,
      error_message: errorMessage
    })
    .eq('id', jobId);
}

// ==========================================
// Full Sync
// ==========================================

/**
 * Perform a full sync of all data types
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection UUID
 * @returns {Promise<object>} - Sync results
 */
export async function syncAll(userId, connectionId) {
  const job = await createSyncJob(connectionId, userId, 'full');
  const results = {
    vehicles: null,
    drivers: null,
    hos: null,
    ifta: null,
    gps: null,
    faultCodes: null,
    totalRecords: 0,
    errors: []
  };

  try {
    // Get the provider to check supported features
    const provider = await createProviderForConnection(connectionId);
    if (!provider) {
      throw new Error('Invalid connection or provider not available');
    }

    const providerName = provider.getName();
    log(`Starting full sync for provider: ${providerName}`);

    // Sync in order: vehicles & drivers first (for ID mapping), then data
    results.vehicles = await syncVehicles(userId, connectionId);
    if (results.vehicles.error) {
      results.errors.push({ type: 'vehicles', error: results.vehicles.errorMessage });
    } else {
      results.totalRecords += results.vehicles.count || 0;
    }

    results.drivers = await syncDrivers(userId, connectionId);
    if (results.drivers.error) {
      results.errors.push({ type: 'drivers', error: results.drivers.errorMessage });
    } else {
      results.totalRecords += results.drivers.count || 0;
    }

    // Now sync data that depends on vehicle/driver mappings
    if (provider.supportsFeature('gps')) {
      results.gps = await syncVehicleLocations(userId, connectionId);
      if (results.gps.error) {
        results.errors.push({ type: 'gps', error: results.gps.errorMessage });
      } else {
        results.totalRecords += results.gps.count || 0;
      }
    }

    // Sync HOS for last 14 days
    if (provider.supportsFeature('hos')) {
      const hosEndDate = new Date();
      const hosStartDate = new Date(hosEndDate.getTime() - 14 * 24 * 60 * 60 * 1000);
      results.hos = await syncHosLogs(
        userId,
        connectionId,
        hosStartDate.toISOString().split('T')[0],
        hosEndDate.toISOString().split('T')[0]
      );
      if (results.hos.error) {
        results.errors.push({ type: 'hos', error: results.hos.errorMessage });
      } else {
        results.totalRecords += results.hos.count || 0;
      }
    }

    // Sync IFTA for current and previous quarter
    if (provider.supportsFeature('ifta')) {
      const now = new Date();
      const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
      const currentYear = now.getFullYear();
      const quarters = [
        `${currentYear}-Q${currentQuarter}`,
        currentQuarter > 1 ? `${currentYear}-Q${currentQuarter - 1}` : `${currentYear - 1}-Q4`
      ];

      for (const quarter of quarters) {
        const iftaResult = await syncIftaMileage(userId, connectionId, quarter);
        if (iftaResult.error) {
          results.errors.push({ type: 'ifta', quarter, error: iftaResult.errorMessage });
        } else {
          results.totalRecords += iftaResult.count || 0;
        }
      }
      results.ifta = { quarters, success: true };
    }

    // Sync fault codes for last 30 days
    if (provider.supportsFeature('fault_codes')) {
      const faultEndDate = new Date();
      const faultStartDate = new Date(faultEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      results.faultCodes = await syncFaultCodes(userId, connectionId);
      if (results.faultCodes.error) {
        results.errors.push({ type: 'faultCodes', error: results.faultCodes.errorMessage });
      } else {
        results.totalRecords += results.faultCodes.count || 0;
      }
    }

    // Update sync job and connection
    await updateSyncJob(job.id, 'completed', results.totalRecords);
    await updateLastSync(connectionId);

    log(`Full sync completed. Total records: ${results.totalRecords}`);

    return {
      success: true,
      results,
      jobId: job.id
    };
  } catch (error) {
    log('Full sync failed:', error);
    await updateSyncJob(job.id, 'failed', results.totalRecords, error.message);
    await updateConnectionStatus(connectionId, 'error', error.message);

    return {
      error: true,
      errorMessage: error.message,
      results,
      jobId: job.id
    };
  }
}

// ==========================================
// Vehicle Sync
// ==========================================

/**
 * Sync vehicles from ELD provider
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection UUID
 * @returns {Promise<object>} - Sync result
 */
export async function syncVehicles(userId, connectionId) {
  try {
    const provider = await createProviderForConnection(connectionId);
    if (!provider) {
      return { error: true, errorMessage: 'Invalid connection' };
    }

    log(`Syncing vehicles from ${provider.getName()}`);

    // Fetch all vehicles from provider (normalized format)
    const vehicles = await provider.fetchVehicles();
    if (!vehicles || vehicles.length === 0) {
      return { success: true, count: 0, matched: 0, unmatched: 0 };
    }

    log(`Fetched ${vehicles.length} vehicles from provider`);

    // Auto-match vehicles to local records
    const matchResults = await autoMatchVehicles(userId, connectionId, vehicles);

    return {
      success: true,
      count: vehicles.length,
      matched: matchResults.matched.length,
      unmatched: matchResults.unmatched.length,
      unmatchedVehicles: matchResults.unmatched
    };
  } catch (error) {
    log('Vehicle sync error:', error);
    return { error: true, errorMessage: error.message };
  }
}

// ==========================================
// Driver Sync
// ==========================================

/**
 * Sync drivers from ELD provider
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection UUID
 * @returns {Promise<object>} - Sync result
 */
export async function syncDrivers(userId, connectionId) {
  try {
    const provider = await createProviderForConnection(connectionId);
    if (!provider) {
      return { error: true, errorMessage: 'Invalid connection' };
    }

    log(`Syncing drivers from ${provider.getName()}`);

    // Fetch all drivers from provider (normalized format)
    const drivers = await provider.fetchDrivers();
    if (!drivers || drivers.length === 0) {
      return { success: true, count: 0, matched: 0, unmatched: 0 };
    }

    log(`Fetched ${drivers.length} drivers from provider`);

    // Auto-match drivers to local records
    const matchResults = await autoMatchDrivers(userId, connectionId, drivers);

    return {
      success: true,
      count: drivers.length,
      matched: matchResults.matched.length,
      unmatched: matchResults.unmatched.length,
      unmatchedDrivers: matchResults.unmatched
    };
  } catch (error) {
    log('Driver sync error:', error);
    return { error: true, errorMessage: error.message };
  }
}

// ==========================================
// IFTA Mileage Sync
// ==========================================

/**
 * Sync IFTA jurisdiction mileage from ELD provider
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection UUID
 * @param {string} quarter - Quarter in YYYY-QN format
 * @returns {Promise<object>} - Sync result
 */
export async function syncIftaMileage(userId, connectionId, quarter) {
  try {
    const provider = await createProviderForConnection(connectionId);
    if (!provider) {
      return { error: true, errorMessage: 'Invalid connection' };
    }

    if (!provider.supportsFeature('ifta')) {
      return { error: true, errorMessage: 'Provider does not support IFTA data' };
    }

    log(`Syncing IFTA mileage for ${quarter} from ${provider.getName()}`);

    // Convert quarter to date range
    const [year, q] = quarter.split('-Q');
    const quarterNum = parseInt(q);
    const startMonth = (quarterNum - 1) * 3;
    const endMonth = quarterNum * 3 - 1;

    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, endMonth + 1, 0); // Last day of the quarter

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Try to get IFTA summary first (pre-aggregated data)
    let iftaData = [];
    const hasSummary = provider.supportsFeature('ifta_summary');

    if (hasSummary) {
      try {
        iftaData = await provider.fetchIFTASummary(startDateStr, endDateStr);
        log(`Fetched IFTA summary: ${iftaData.length} vehicle records`);
      } catch (e) {
        log('IFTA summary failed, falling back to trips:', e);
      }
    }

    // Fall back to trips if summary not available or empty
    if (iftaData.length === 0) {
      try {
        const trips = await provider.fetchIFTATrips(startDateStr, endDateStr);
        log(`Fetched ${trips.length} IFTA trips`);

        // Aggregate trips by vehicle and jurisdiction
        const vehicleMileage = {};

        for (const trip of trips) {
          const vehicleId = trip.vehicleId;
          if (!vehicleMileage[vehicleId]) {
            vehicleMileage[vehicleId] = {
              vehicleId,
              vehicleName: trip.metadata?.vehicleName,
              jurisdictionsMiles: {},
              totalMiles: 0
            };
          }

          // Add jurisdiction miles
          if (trip.jurisdictionsMiles) {
            for (const [state, miles] of Object.entries(trip.jurisdictionsMiles)) {
              vehicleMileage[vehicleId].jurisdictionsMiles[state] =
                (vehicleMileage[vehicleId].jurisdictionsMiles[state] || 0) + miles;
              vehicleMileage[vehicleId].totalMiles += miles;
            }
          }
        }

        iftaData = Object.values(vehicleMileage);
      } catch (e) {
        log('IFTA trips fetch failed:', e);
        return { error: true, errorMessage: e.message };
      }
    }

    let recordsInserted = 0;

    // Process each vehicle's IFTA data
    for (const vehicleData of iftaData) {
      const externalVehicleId = vehicleData.vehicleId;

      // Get local vehicle ID
      const localVehicleId = await getLocalVehicleId(userId, externalVehicleId);
      if (!localVehicleId) {
        log(`Skipping unmapped vehicle: ${externalVehicleId}`);
        continue;
      }

      // Process each jurisdiction
      for (const [jurisdiction, miles] of Object.entries(vehicleData.jurisdictionsMiles || {})) {
        if (!jurisdiction || !miles) continue;

        // Calculate which month(s) this data belongs to
        // For simplicity, spread evenly across quarter months
        const monthlyMiles = miles / 3;

        for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
          const recordMonth = startMonth + monthOffset + 1;

          // Upsert IFTA mileage record
          const { error } = await supabaseAdmin
            .from('eld_ifta_mileage')
            .upsert({
              user_id: userId,
              connection_id: connectionId,
              vehicle_id: localVehicleId,
              external_vehicle_id: externalVehicleId,
              jurisdiction: jurisdiction.toUpperCase(),
              year: parseInt(year),
              month: recordMonth,
              quarter: quarter,
              total_miles: monthlyMiles,
              fuel_gallons: vehicleData.metadata?.fuelConsumedGallons
                ? vehicleData.metadata.fuelConsumedGallons / 3
                : null,
              source: 'eld',
              provider: provider.getName(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'vehicle_id,jurisdiction,year,month'
            });

          if (!error) {
            recordsInserted++;
          }
        }
      }
    }

    log(`IFTA sync completed: ${recordsInserted} records`);

    return {
      success: true,
      count: recordsInserted,
      quarter,
      vehicleCount: iftaData.length
    };
  } catch (error) {
    log('IFTA sync error:', error);
    return { error: true, errorMessage: error.message };
  }
}

// ==========================================
// HOS Logs Sync
// ==========================================

/**
 * Sync HOS logs from ELD provider
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection UUID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<object>} - Sync result
 */
export async function syncHosLogs(userId, connectionId, startDate, endDate) {
  try {
    const provider = await createProviderForConnection(connectionId);
    if (!provider) {
      return { error: true, errorMessage: 'Invalid connection' };
    }

    if (!provider.supportsFeature('hos')) {
      return { error: true, errorMessage: 'Provider does not support HOS data' };
    }

    log(`Syncing HOS logs from ${startDate} to ${endDate} from ${provider.getName()}`);

    // Fetch HOS logs from provider (normalized format)
    const hosLogs = await provider.fetchHOSLogs(startDate, endDate);
    if (!hosLogs || hosLogs.length === 0) {
      return { success: true, count: 0, dateRange: { startDate, endDate } };
    }

    log(`Fetched ${hosLogs.length} HOS logs`);

    let recordsInserted = 0;
    const driverDailyTotals = {};

    // Process each HOS log entry
    for (const log of hosLogs) {
      const {
        driverId: externalDriverId,
        vehicleId: externalVehicleId,
        dutyStatus,
        startTime,
        endTime,
        durationMinutes,
        location,
        latitude,
        longitude,
        annotations,
        logDate
      } = log;

      // Get local driver ID
      const localDriverId = await getLocalDriverId(userId, externalDriverId);
      if (!localDriverId) {
        continue; // Skip unmapped drivers
      }

      // Get local vehicle ID if available
      const localVehicleId = externalVehicleId
        ? await getLocalVehicleId(userId, externalVehicleId)
        : null;

      // Insert HOS log entry
      const { error } = await supabaseAdmin
        .from('eld_hos_logs')
        .insert({
          user_id: userId,
          connection_id: connectionId,
          driver_id: localDriverId,
          external_driver_id: externalDriverId,
          vehicle_id: localVehicleId,
          external_vehicle_id: externalVehicleId,
          duty_status: dutyStatus,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: durationMinutes,
          location_name: location,
          latitude,
          longitude,
          annotations,
          log_date: logDate,
          provider: provider.getName(),
          created_at: new Date().toISOString()
        });

      if (!error) {
        recordsInserted++;
      }

      // Aggregate daily totals for driver summary
      const driverDateKey = `${localDriverId}_${logDate}`;
      if (!driverDailyTotals[driverDateKey]) {
        driverDailyTotals[driverDateKey] = {
          driverId: localDriverId,
          externalDriverId,
          logDate,
          drivingMinutes: 0,
          onDutyMinutes: 0,
          offDutyMinutes: 0,
          sleeperMinutes: 0
        };
      }

      const minutes = durationMinutes || 0;
      switch (dutyStatus) {
        case 'driving':
          driverDailyTotals[driverDateKey].drivingMinutes += minutes;
          break;
        case 'on_duty':
          driverDailyTotals[driverDateKey].onDutyMinutes += minutes;
          break;
        case 'off_duty':
          driverDailyTotals[driverDateKey].offDutyMinutes += minutes;
          break;
        case 'sleeper':
          driverDailyTotals[driverDateKey].sleeperMinutes += minutes;
          break;
      }
    }

    // Upsert daily summaries
    for (const summary of Object.values(driverDailyTotals)) {
      await supabaseAdmin
        .from('eld_hos_daily_logs')
        .upsert({
          user_id: userId,
          connection_id: connectionId,
          driver_id: summary.driverId,
          external_driver_id: summary.externalDriverId,
          log_date: summary.logDate,
          driving_minutes: summary.drivingMinutes,
          on_duty_minutes: summary.onDutyMinutes,
          sleeper_minutes: summary.sleeperMinutes,
          off_duty_minutes: summary.offDutyMinutes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'driver_id,log_date'
        });
    }

    return {
      success: true,
      count: recordsInserted,
      dateRange: { startDate, endDate }
    };
  } catch (error) {
    log('HOS sync error:', error);
    return { error: true, errorMessage: error.message };
  }
}

// ==========================================
// Vehicle Locations Sync
// ==========================================

/**
 * Sync latest vehicle locations from ELD provider
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection UUID
 * @returns {Promise<object>} - Sync result
 */
export async function syncVehicleLocations(userId, connectionId) {
  try {
    const provider = await createProviderForConnection(connectionId);
    if (!provider) {
      return { error: true, errorMessage: 'Invalid connection' };
    }

    if (!provider.supportsFeature('gps')) {
      return { error: true, errorMessage: 'Provider does not support GPS data' };
    }

    log(`Syncing vehicle locations from ${provider.getName()}`);

    // Fetch current locations from provider (normalized format)
    const locations = await provider.fetchCurrentLocations();
    if (!locations || locations.length === 0) {
      return { success: true, count: 0 };
    }

    log(`Fetched ${locations.length} vehicle locations`);

    let recordsInserted = 0;

    // Process each location
    for (const loc of locations) {
      const {
        vehicleId: externalVehicleId,
        latitude,
        longitude,
        speedMph,
        heading,
        odometerMiles,
        engineHours,
        address,
        recordedAt
      } = loc;

      // Get local vehicle ID
      const localVehicleId = await getLocalVehicleId(userId, externalVehicleId);
      if (!localVehicleId) {
        continue; // Skip unmapped vehicles
      }

      // Insert location record
      const { error } = await supabaseAdmin
        .from('eld_vehicle_locations')
        .insert({
          user_id: userId,
          connection_id: connectionId,
          vehicle_id: localVehicleId,
          external_vehicle_id: externalVehicleId,
          latitude,
          longitude,
          speed_mph: speedMph,
          heading,
          odometer_miles: odometerMiles,
          engine_hours: engineHours,
          address,
          recorded_at: recordedAt,
          provider: provider.getName()
        });

      if (!error) {
        recordsInserted++;
      }

      // Update vehicle's last known location
      await supabaseAdmin
        .from('vehicles')
        .update({
          last_known_location: {
            lat: latitude,
            lng: longitude,
            speed: speedMph,
            heading,
            address
          },
          last_location_at: recordedAt,
          odometer_miles: odometerMiles,
          engine_hours: engineHours
        })
        .eq('id', localVehicleId);
    }

    log(`Location sync completed: ${recordsInserted} records`);

    return {
      success: true,
      count: recordsInserted
    };
  } catch (error) {
    log('Location sync error:', error);
    return { error: true, errorMessage: error.message };
  }
}

// ==========================================
// Fault Codes Sync
// ==========================================

/**
 * Sync fault codes/diagnostics from ELD provider
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection UUID
 * @returns {Promise<object>} - Sync result
 */
export async function syncFaultCodes(userId, connectionId) {
  try {
    const provider = await createProviderForConnection(connectionId);
    if (!provider) {
      return { error: true, errorMessage: 'Invalid connection' };
    }

    if (!provider.supportsFeature('fault_codes')) {
      return { success: true, count: 0, message: 'Provider does not support fault codes' };
    }

    log(`Syncing fault codes from ${provider.getName()}`);

    // Fetch fault codes from provider (normalized format)
    const faultCodes = await provider.fetchFaultCodes();
    if (!faultCodes || faultCodes.length === 0) {
      return { success: true, count: 0 };
    }

    log(`Fetched ${faultCodes.length} fault codes`);

    let recordsInserted = 0;

    // Process each fault code
    for (const fault of faultCodes) {
      const {
        vehicleId: externalVehicleId,
        code,
        description,
        severity,
        source,
        firstObservedAt,
        lastObservedAt,
        isActive,
        metadata
      } = fault;

      // Get local vehicle ID
      const localVehicleId = await getLocalVehicleId(userId, externalVehicleId);
      if (!localVehicleId) {
        continue; // Skip unmapped vehicles
      }

      // Check if this fault code already exists
      const { data: existing } = await supabaseAdmin
        .from('eld_fault_codes')
        .select('id, occurrence_count')
        .eq('vehicle_id', localVehicleId)
        .eq('fault_code', code)
        .is('resolved_at', null)
        .single();

      if (existing) {
        // Update existing record
        await supabaseAdmin
          .from('eld_fault_codes')
          .update({
            last_observed_at: lastObservedAt,
            occurrence_count: (existing.occurrence_count || 1) + 1,
            is_active: isActive
          })
          .eq('id', existing.id);
      } else {
        // Insert new fault code
        const { error } = await supabaseAdmin
          .from('eld_fault_codes')
          .insert({
            user_id: userId,
            connection_id: connectionId,
            vehicle_id: localVehicleId,
            external_vehicle_id: externalVehicleId,
            fault_code: code,
            description,
            severity: severity || 'info',
            source: source || 'engine',
            spn: metadata?.spn,
            fmi: metadata?.fmi,
            first_observed_at: firstObservedAt,
            last_observed_at: lastObservedAt,
            is_active: isActive,
            provider: provider.getName()
          });

        if (!error) {
          recordsInserted++;
        }
      }
    }

    log(`Fault code sync completed: ${recordsInserted} new records`);

    return {
      success: true,
      count: recordsInserted
    };
  } catch (error) {
    log('Fault code sync error:', error);
    return { error: true, errorMessage: error.message };
  }
}

// ==========================================
// Fuel Purchases Sync
// ==========================================

/**
 * Sync fuel purchases from ELD provider
 * @param {string} userId - User ID
 * @param {string} connectionId - Connection UUID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<object>} - Sync result
 */
export async function syncFuelPurchases(userId, connectionId, startDate, endDate) {
  try {
    const provider = await createProviderForConnection(connectionId);
    if (!provider) {
      return { error: true, errorMessage: 'Invalid connection' };
    }

    if (!provider.supportsFeature('fuel_purchases')) {
      return { success: true, count: 0, message: 'Provider does not support fuel purchase data' };
    }

    log(`Syncing fuel purchases from ${startDate} to ${endDate} from ${provider.getName()}`);

    // Fetch fuel purchases from provider
    const purchases = await provider.fetchFuelPurchases(startDate, endDate);
    if (!purchases || purchases.length === 0) {
      return { success: true, count: 0 };
    }

    log(`Fetched ${purchases.length} fuel purchases`);

    let recordsInserted = 0;

    for (const purchase of purchases) {
      const {
        vehicleId: externalVehicleId,
        driverId: externalDriverId,
        jurisdiction,
        gallons,
        totalCost,
        pricePerGallon,
        fuelType,
        merchantName,
        merchantAddress,
        transactionDate
      } = purchase;

      // Get local vehicle ID
      const localVehicleId = externalVehicleId
        ? await getLocalVehicleId(userId, externalVehicleId)
        : null;

      // Get local driver ID
      const localDriverId = externalDriverId
        ? await getLocalDriverId(userId, externalDriverId)
        : null;

      // Insert fuel purchase record
      const { error } = await supabaseAdmin
        .from('fuel_entries')
        .insert({
          user_id: userId,
          vehicle_id: localVehicleId,
          driver_id: localDriverId,
          gallons,
          price_per_gallon: pricePerGallon,
          total_cost: totalCost,
          fuel_type: fuelType || 'diesel',
          state: jurisdiction,
          station_name: merchantName,
          station_address: merchantAddress,
          date: transactionDate,
          source: 'eld',
          eld_connection_id: connectionId,
          created_at: new Date().toISOString()
        });

      if (!error) {
        recordsInserted++;
      }
    }

    log(`Fuel purchase sync completed: ${recordsInserted} records`);

    return {
      success: true,
      count: recordsInserted
    };
  } catch (error) {
    log('Fuel purchase sync error:', error);
    return { error: true, errorMessage: error.message };
  }
}

// ==========================================
// Sync History
// ==========================================

/**
 * Get sync history for a user
 * @param {string} userId - User ID
 * @param {number} limit - Number of records to return
 * @returns {Promise<object>} - Sync history
 */
export async function getSyncHistory(userId, limit = 10) {
  try {
    const { data, error } = await supabaseAdmin
      .from('eld_sync_jobs')
      .select(`
        id,
        sync_type,
        status,
        started_at,
        completed_at,
        records_synced,
        error_message,
        eld_connections (
          id,
          provider,
          eld_provider_name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    // Enhance with provider info
    const enhanced = (data || []).map(job => {
      const providerInfo = job.eld_connections?.provider
        ? getProviderInfo(job.eld_connections.provider)
        : null;

      return {
        ...job,
        providerName: providerInfo?.name || job.eld_connections?.provider || 'Unknown',
        providerLogo: providerInfo?.logo
      };
    });

    return { data: enhanced };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get latest sync status for a connection
 * @param {string} connectionId - Connection UUID
 * @returns {Promise<object>} - Latest sync info
 */
export async function getLatestSyncStatus(connectionId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('eld_sync_jobs')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { error: true, errorMessage: error.message };
    }

    return { data };
  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

export default {
  syncAll,
  syncVehicles,
  syncDrivers,
  syncIftaMileage,
  syncHosLogs,
  syncVehicleLocations,
  syncFaultCodes,
  syncFuelPurchases,
  getSyncHistory,
  getLatestSyncStatus
};
