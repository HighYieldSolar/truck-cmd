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

/**
 * Get entity mapping ID for a vehicle
 * @param {string} connectionId - Connection UUID
 * @param {string} externalVehicleId - External vehicle ID
 * @returns {Promise<string|null>} - Mapping UUID or null
 */
async function getVehicleMappingId(connectionId, externalVehicleId) {
  try {
    const { data } = await supabaseAdmin
      .from('eld_entity_mappings')
      .select('id')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'vehicle')
      .eq('external_id', externalVehicleId)
      .single();
    return data?.id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get entity mapping ID for a driver
 * @param {string} connectionId - Connection UUID
 * @param {string} externalDriverId - External driver ID
 * @returns {Promise<string|null>} - Mapping UUID or null
 */
async function getDriverMappingId(connectionId, externalDriverId) {
  try {
    const { data } = await supabaseAdmin
      .from('eld_entity_mappings')
      .select('id')
      .eq('connection_id', connectionId)
      .eq('entity_type', 'driver')
      .eq('external_id', externalDriverId)
      .single();
    return data?.id || null;
  } catch (error) {
    return null;
  }
}

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[ELDSyncService]', ...args);
// Production logging for critical sync operations
const syncLog = (...args) => console.log('[ELDSync]', ...args);

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
    fuel: null,
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

    // Sync fuel purchases for current + previous quarter (IFTA window).
    // Fuel purchases are the authoritative source for gallons-per-jurisdiction,
    // required for the IFTA calculator. Matching the IFTA quarter window keeps
    // miles and gallons in the same date range.
    if (provider.supportsFeature('fuel_purchases')) {
      const now = new Date();
      const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
      const currentYear = now.getFullYear();
      const prevQuarter = currentQuarter > 1 ? currentQuarter - 1 : 4;
      const prevYear = currentQuarter > 1 ? currentYear : currentYear - 1;
      const windowStart = new Date(prevYear, (prevQuarter - 1) * 3, 1);
      const windowEnd = new Date(currentYear, currentQuarter * 3, 0);
      const fuelStart = windowStart.toISOString().split('T')[0];
      const fuelEnd = windowEnd.toISOString().split('T')[0];

      results.fuel = await syncFuelPurchases(userId, connectionId, fuelStart, fuelEnd);
      if (results.fuel.error) {
        results.errors.push({ type: 'fuel', error: results.fuel.errorMessage });
      } else {
        results.totalRecords += results.fuel.count || 0;
      }
    }

    // Update sync job and connection - store sync details for debugging
    const syncDetails = JSON.stringify({
      vehicles: results.vehicles?.count || 0,
      drivers: results.drivers?.count || 0,
      gps: results.gps?.count || 0,
      gpsMessage: results.gps?.message,
      hos: results.hos?.count || 0,
      hosMessage: results.hos?.message,
      ifta: results.ifta?.quarters || [],
      faultCodes: results.faultCodes?.count || 0,
      fuel: results.fuel?.count || 0,
      errors: results.errors
    });
    syncLog('Sync completed with details:', syncDetails);

    await updateSyncJob(job.id, 'completed', results.totalRecords, syncDetails);
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

    const providerName = provider.getName();
    log(`Syncing vehicles from ${providerName}`);

    // Fetch all vehicles from provider (normalized format)
    const vehicles = await provider.fetchVehicles();
    if (!vehicles || vehicles.length === 0) {
      return { success: true, count: 0, matched: 0, unmatched: 0 };
    }

    log(`Fetched ${vehicles.length} vehicles from provider`);

    // Auto-match vehicles to local records (or auto-create if no match)
    const matchResults = await autoMatchVehicles(userId, connectionId, vehicles, providerName);

    return {
      success: true,
      count: vehicles.length,
      matched: matchResults.matched.length,
      created: matchResults.created?.length || 0,
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

    const providerName = provider.getName();
    log(`Syncing drivers from ${providerName}`);

    // Fetch all drivers from provider (normalized format)
    const drivers = await provider.fetchDrivers();
    if (!drivers || drivers.length === 0) {
      return { success: true, count: 0, matched: 0, unmatched: 0 };
    }

    log(`Fetched ${drivers.length} drivers from provider`);

    // Auto-match drivers to local records (or auto-create if no match)
    const matchResults = await autoMatchDrivers(userId, connectionId, drivers, providerName);

    return {
      success: true,
      count: drivers.length,
      matched: matchResults.matched.length,
      created: matchResults.created?.length || 0,
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

    syncLog(`Syncing IFTA mileage for ${quarter} from ${provider.getName()}`);

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
        syncLog(`IFTA summary from API: ${iftaData?.length || 0} vehicle records`);
      } catch (e) {
        syncLog('IFTA summary failed, falling back to trips:', e.message);
      }
    }

    // Fall back to trips if summary not available or empty
    if (iftaData.length === 0) {
      try {
        const trips = await provider.fetchIFTATrips(startDateStr, endDateStr);
        syncLog(`IFTA trips from API: ${trips?.length || 0} records`);

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

      // Get vehicle mapping ID
      const vehicleMappingId = await getVehicleMappingId(connectionId, externalVehicleId);
      if (!vehicleMappingId) {
        log(`Skipping unmapped vehicle: ${externalVehicleId}`);
        continue;
      }

      // Process each jurisdiction
      for (const [jurisdiction, miles] of Object.entries(vehicleData.jurisdictionsMiles || {})) {
        if (!jurisdiction || !miles) continue;

        // Check if record already exists
        // Use .maybeSingle() instead of .single() to return null instead of erroring when no record exists
        const { data: existing } = await supabaseAdmin
          .from('eld_ifta_mileage')
          .select('id')
          .eq('vehicle_mapping_id', vehicleMappingId)
          .eq('jurisdiction', jurisdiction.toUpperCase())
          .eq('quarter', quarter)
          .maybeSingle();

        if (existing) {
          // Update existing record
          await supabaseAdmin
            .from('eld_ifta_mileage')
            .update({
              miles: miles,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          recordsInserted++;
        } else {
          // Insert IFTA mileage record (matching actual DB schema)
          const { error } = await supabaseAdmin
            .from('eld_ifta_mileage')
            .insert({
              user_id: userId,
              connection_id: connectionId,
              vehicle_mapping_id: vehicleMappingId,
              eld_vehicle_id: externalVehicleId,
              jurisdiction: jurisdiction.toUpperCase(),
              miles: miles,
              start_date: startDateStr,
              end_date: endDateStr,
              quarter: quarter,
              year: parseInt(year),
              raw_data: vehicleData.metadata || {}
            });

          if (!error) {
            recordsInserted++;
          } else {
            log(`Error inserting IFTA mileage: ${error.message}`);
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

    syncLog(`Syncing HOS logs from ${startDate} to ${endDate} from ${provider.getName()}`);

    // Fetch HOS logs from provider (normalized format)
    const hosLogs = await provider.fetchHOSLogs(startDate, endDate);
    syncLog(`HOS logs from API: ${hosLogs?.length || 0} records`);

    if (!hosLogs || hosLogs.length === 0) {
      syncLog('No HOS logs returned from provider API');
      return { success: true, count: 0, dateRange: { startDate, endDate }, message: 'No HOS logs from API' };
    }

    log(`Fetched ${hosLogs.length} HOS logs`);

    let recordsInserted = 0;
    const driverDailyTotals = {};
    const driverLatestStatus = {}; // Track latest status for each driver
    const providerName = provider.getName();

    // Process each HOS log entry and aggregate by driver/date
    for (const hosLog of hosLogs) {
      const {
        driverId: externalDriverId,
        vehicleId: externalVehicleId,
        dutyStatus,
        durationMinutes,
        logDate,
        startTime,
        location,
        latitude,
        longitude
      } = hosLog;

      // Get driver mapping ID
      const driverMappingId = await getDriverMappingId(connectionId, externalDriverId);
      if (!driverMappingId) {
        continue; // Skip unmapped drivers
      }

      // Track latest status for each driver (for driver_hos_status table)
      const statusTime = startTime ? new Date(startTime).getTime() : 0;
      if (!driverLatestStatus[externalDriverId] || statusTime > driverLatestStatus[externalDriverId].statusTime) {
        driverLatestStatus[externalDriverId] = {
          externalDriverId,
          dutyStatus,
          startTime,
          statusTime,
          vehicleId: externalVehicleId,
          location,
          latitude,
          longitude
        };
      }

      // Aggregate daily totals for driver summary
      const driverDateKey = `${driverMappingId}_${logDate}`;
      if (!driverDailyTotals[driverDateKey]) {
        driverDailyTotals[driverDateKey] = {
          driverMappingId,
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

    // Insert daily summaries into eld_hos_logs (matching actual DB schema)
    for (const summary of Object.values(driverDailyTotals)) {
      // Check if record already exists
      // Use .maybeSingle() instead of .single() to return null instead of erroring when no record exists
      const { data: existing } = await supabaseAdmin
        .from('eld_hos_logs')
        .select('id')
        .eq('driver_mapping_id', summary.driverMappingId)
        .eq('log_date', summary.logDate)
        .maybeSingle();

      if (existing) {
        // Update existing record
        await supabaseAdmin
          .from('eld_hos_logs')
          .update({
            driving_hours: summary.drivingMinutes / 60,
            on_duty_hours: summary.onDutyMinutes / 60,
            off_duty_hours: summary.offDutyMinutes / 60,
            sleeper_hours: summary.sleeperMinutes / 60,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        recordsInserted++;
      } else {
        // Insert new record
        const { error } = await supabaseAdmin
          .from('eld_hos_logs')
          .insert({
            user_id: userId,
            connection_id: connectionId,
            driver_mapping_id: summary.driverMappingId,
            eld_driver_id: summary.externalDriverId,
            log_date: summary.logDate,
            driving_hours: summary.drivingMinutes / 60,
            on_duty_hours: summary.onDutyMinutes / 60,
            off_duty_hours: summary.offDutyMinutes / 60,
            sleeper_hours: summary.sleeperMinutes / 60
          });

        if (!error) {
          recordsInserted++;
        } else {
          log(`Error inserting HOS log: ${error.message}`);
        }
      }
    }

    // Update driver_hos_status table with latest duty status for each driver
    for (const status of Object.values(driverLatestStatus)) {
      const localDriverId = await getLocalDriverId(userId, status.externalDriverId);

      // Check if record exists
      const { data: existingStatus } = await supabaseAdmin
        .from('driver_hos_status')
        .select('id')
        .eq('organization_id', userId)
        .eq('eld_driver_id', status.externalDriverId)
        .eq('eld_provider', providerName)
        .maybeSingle();

      if (existingStatus) {
        // Update existing
        const { error: updateError } = await supabaseAdmin
          .from('driver_hos_status')
          .update({
            driver_id: localDriverId,
            duty_status: status.dutyStatus || 'unknown',
            status_started_at: status.startTime || new Date().toISOString(),
            vehicle_id: status.vehicleId,
            location_description: status.location,
            latitude: status.latitude,
            longitude: status.longitude,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStatus.id);

        if (updateError) {
          syncLog(`Error updating driver_hos_status: ${updateError.message}`);
        }
      } else {
        // Insert new
        const { error: insertError } = await supabaseAdmin
          .from('driver_hos_status')
          .insert({
            organization_id: userId,
            driver_id: localDriverId,
            eld_driver_id: status.externalDriverId,
            eld_provider: providerName,
            duty_status: status.dutyStatus || 'unknown',
            status_started_at: status.startTime || new Date().toISOString(),
            vehicle_id: status.vehicleId,
            location_description: status.location,
            latitude: status.latitude,
            longitude: status.longitude,
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          syncLog(`Error inserting to driver_hos_status: ${insertError.message}`);
        }
      }
    }

    syncLog(`HOS sync completed: ${recordsInserted} daily records, ${Object.keys(driverLatestStatus).length} driver statuses`);

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

    syncLog(`Syncing vehicle locations from ${provider.getName()}`);

    // Fetch current locations from provider (normalized format)
    const locations = await provider.fetchCurrentLocations();
    syncLog(`GPS locations from API: ${locations?.length || 0} records`);

    if (!locations || locations.length === 0) {
      syncLog('No GPS locations returned from provider API');
      return { success: true, count: 0, message: 'No locations returned from API' };
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

      // Get vehicle mapping ID
      const vehicleMappingId = await getVehicleMappingId(connectionId, externalVehicleId);
      if (!vehicleMappingId) {
        log(`Skipping unmapped vehicle: ${externalVehicleId}`);
        continue;
      }

      // Insert location record (matching actual DB schema)
      const { error } = await supabaseAdmin
        .from('eld_vehicle_locations')
        .insert({
          user_id: userId,
          connection_id: connectionId,
          vehicle_mapping_id: vehicleMappingId,
          eld_vehicle_id: externalVehicleId,
          latitude,
          longitude,
          speed_mph: speedMph,
          heading,
          odometer: odometerMiles,
          engine_hours: engineHours,
          address,
          location_time: recordedAt
        });

      if (error) {
        log(`Error inserting location: ${error.message}`);
      } else {
        recordsInserted++;
      }

      // Update vehicle's last known location in vehicles table
      const localVehicleId = await getLocalVehicleId(userId, externalVehicleId);
      if (localVehicleId) {
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

      // Also update vehicle_current_locations (for ELD tracking page display)
      const providerName = provider.getName();

      // Check if record exists
      const { data: existingLoc } = await supabaseAdmin
        .from('vehicle_current_locations')
        .select('id')
        .eq('organization_id', userId)
        .eq('eld_vehicle_id', externalVehicleId)
        .eq('eld_provider', providerName)
        .maybeSingle();

      if (existingLoc) {
        // Update existing
        const { error: updateError } = await supabaseAdmin
          .from('vehicle_current_locations')
          .update({
            vehicle_id: localVehicleId,
            latitude,
            longitude,
            speed_mph: speedMph,
            heading,
            odometer_miles: odometerMiles,
            engine_hours: engineHours,
            address,
            recorded_at: recordedAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLoc.id);

        if (updateError) {
          syncLog(`Error updating vehicle_current_locations: ${updateError.message}`);
        }
      } else {
        // Insert new
        const { error: insertError } = await supabaseAdmin
          .from('vehicle_current_locations')
          .insert({
            organization_id: userId,
            vehicle_id: localVehicleId,
            eld_vehicle_id: externalVehicleId,
            eld_provider: providerName,
            latitude,
            longitude,
            speed_mph: speedMph,
            heading,
            odometer_miles: odometerMiles,
            engine_hours: engineHours,
            address,
            recorded_at: recordedAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          syncLog(`Error inserting to vehicle_current_locations: ${insertError.message}`);
        }
      }
    }

    syncLog(`Location sync completed: ${recordsInserted} records to eld_vehicle_locations`);

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

    syncLog(`Syncing fault codes from ${provider.getName()}`);

    // Fetch fault codes from provider (normalized format)
    const faultCodes = await provider.fetchFaultCodes();
    syncLog(`Fault codes from API: ${faultCodes?.length || 0} records`);

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

      // Get vehicle mapping ID
      const vehicleMappingId = await getVehicleMappingId(connectionId, externalVehicleId);
      if (!vehicleMappingId) {
        continue; // Skip unmapped vehicles
      }

      // Check if this fault code already exists (matching actual DB schema)
      // Use .maybeSingle() instead of .single() to return null instead of erroring when no record exists
      const { data: existing } = await supabaseAdmin
        .from('eld_fault_codes')
        .select('id')
        .eq('vehicle_mapping_id', vehicleMappingId)
        .eq('code', code)
        .is('resolved_at', null)
        .maybeSingle();

      if (existing) {
        // Update existing record
        await supabaseAdmin
          .from('eld_fault_codes')
          .update({
            last_observed_at: lastObservedAt,
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Insert new fault code (matching actual DB schema)
        const { error } = await supabaseAdmin
          .from('eld_fault_codes')
          .insert({
            user_id: userId,
            connection_id: connectionId,
            vehicle_mapping_id: vehicleMappingId,
            eld_vehicle_id: externalVehicleId,
            code: code,
            description,
            severity: severity || 'info',
            first_observed_at: firstObservedAt,
            last_observed_at: lastObservedAt,
            is_active: isActive,
            raw_data: { source, ...metadata }
          });

        if (!error) {
          recordsInserted++;
        } else {
          log(`Error inserting fault code: ${error.message}`);
        }
      }

      // Also update vehicle_active_faults (for ELD tracking page display)
      const providerName = provider.getName();
      const localVehicleId = await getLocalVehicleId(userId, externalVehicleId);

      // Check if record exists
      const { data: existingFault } = await supabaseAdmin
        .from('vehicle_active_faults')
        .select('id')
        .eq('organization_id', userId)
        .eq('eld_vehicle_id', externalVehicleId)
        .eq('eld_provider', providerName)
        .eq('code', code)
        .maybeSingle();

      if (existingFault) {
        // Update existing
        const { error: updateError } = await supabaseAdmin
          .from('vehicle_active_faults')
          .update({
            vehicle_id: localVehicleId,
            description,
            severity: severity || 'info',
            source,
            is_active: isActive,
            last_observed_at: lastObservedAt || new Date().toISOString(),
            resolved_at: isActive ? null : new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingFault.id);

        if (updateError) {
          syncLog(`Error updating vehicle_active_faults: ${updateError.message}`);
        }
      } else {
        // Insert new
        const { error: insertError } = await supabaseAdmin
          .from('vehicle_active_faults')
          .insert({
            organization_id: userId,
            vehicle_id: localVehicleId,
            eld_vehicle_id: externalVehicleId,
            eld_provider: providerName,
            code: code,
            description,
            severity: severity || 'info',
            source,
            is_active: isActive,
            first_observed_at: firstObservedAt || new Date().toISOString(),
            last_observed_at: lastObservedAt || new Date().toISOString(),
            resolved_at: isActive ? null : new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          syncLog(`Error inserting to vehicle_active_faults: ${insertError.message}`);
        }
      }
    }

    syncLog(`Fault code sync completed: ${recordsInserted} new records`);

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
