/**
 * ELD Webhook Event Handlers
 *
 * Processes incoming webhook events from Motive and Samsara.
 * Updates the database and triggers real-time notifications.
 *
 * Event Types:
 * - GPS Location updates (vehicle_location_updated, VehicleStatsUpdated)
 * - HOS Status changes (hos_violation_upserted, DriverDutyStatusChanged)
 * - Fault Codes (fault_code_opened, fault_code_closed, VehicleDtcUpdated)
 * - Driver/Vehicle updates
 * - Geofence events (for IFTA jurisdiction tracking)
 */

import { createClient } from '@supabase/supabase-js';
import { normalizeDutyStatus } from '../providers/baseProvider';
import { detectJurisdictionCrossing, getJurisdictionFromCoordinates } from './jurisdictionDetectionService';
import { processGPSLocation } from '@/lib/services/ifta/gpsProcessingService';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[WebhookHandler]', ...args);

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

/**
 * Find connection and user by external vehicle/driver ID or company ID
 */
async function findConnection(provider, externalId, idType = 'company') {
  let query = supabaseAdmin
    .from('eld_connections')
    .select('id, user_id, status')
    .eq('provider', provider);

  if (idType === 'company') {
    query = query.eq('external_connection_id', externalId);
  }

  const { data, error } = await query.single();

  if (error) {
    log(`Connection not found for ${provider}/${externalId}:`, error.message);
    return null;
  }

  return data;
}

/**
 * Find local vehicle by ELD external ID
 */
async function findVehicle(userId, externalVehicleId, provider) {
  // First try the entity mapping table
  const { data: mapping } = await supabaseAdmin
    .from('eld_entity_mappings')
    .select('local_id')
    .eq('user_id', userId)
    .eq('external_id', externalVehicleId.toString())
    .eq('entity_type', 'vehicle')
    .eq('provider', provider)
    .single();

  if (mapping) {
    return mapping.local_id;
  }

  // Fall back to direct lookup on vehicles table
  const { data: vehicle } = await supabaseAdmin
    .from('vehicles')
    .select('id')
    .eq('user_id', userId)
    .eq('eld_external_id', externalVehicleId.toString())
    .single();

  return vehicle?.id || null;
}

/**
 * Find local driver by ELD external ID
 */
async function findDriver(userId, externalDriverId, provider) {
  // First try the entity mapping table
  const { data: mapping } = await supabaseAdmin
    .from('eld_entity_mappings')
    .select('local_id')
    .eq('user_id', userId)
    .eq('external_id', externalDriverId.toString())
    .eq('entity_type', 'driver')
    .eq('provider', provider)
    .single();

  if (mapping) {
    return mapping.local_id;
  }

  // Fall back to direct lookup on drivers table
  const { data: driver } = await supabaseAdmin
    .from('drivers')
    .select('id')
    .eq('user_id', userId)
    .eq('eld_external_id', externalDriverId.toString())
    .single();

  return driver?.id || null;
}

// ============================================================
// GPS LOCATION HANDLERS
// ============================================================

/**
 * Handle Motive vehicle_location_updated webhook
 */
export async function handleMotiveLocationUpdated(connectionId, userId, payload) {
  const {
    vehicle_id,
    vehicle_number,
    lat,
    lon,
    located_at,
    speed,
    bearing,
    odometer,
    engine_hours,
    description,
    primary_fuel_level,
    secondary_fuel_level
  } = payload;

  log(`Processing Motive location for vehicle ${vehicle_id}`);

  // Find local vehicle
  const vehicleId = await findVehicle(userId, vehicle_id, 'motive');

  // Store location in eld_vehicle_locations
  const locationData = {
    user_id: userId,
    connection_id: connectionId,
    vehicle_id: vehicleId,
    external_vehicle_id: vehicle_id.toString(),
    latitude: lat,
    longitude: lon,
    speed_mph: speed,
    heading: bearing,
    odometer_miles: odometer,
    engine_hours: engine_hours,
    address: description,
    recorded_at: located_at,
    created_at: new Date().toISOString()
  };

  const { error: locationError } = await supabaseAdmin
    .from('eld_vehicle_locations')
    .insert(locationData);

  if (locationError) {
    log('Error inserting location:', locationError.message);
  }

  // Update vehicle's last known location
  if (vehicleId) {
    const { error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .update({
        last_known_location: {
          latitude: lat,
          longitude: lon,
          speed_mph: speed,
          heading: bearing,
          address: description,
          recorded_at: located_at
        },
        last_location_at: located_at,
        eld_last_sync_at: new Date().toISOString()
      })
      .eq('id', vehicleId);

    if (vehicleError) {
      log('Error updating vehicle location:', vehicleError.message);
    }
  }

  // Detect jurisdiction crossing for IFTA (legacy bounding box method)
  if (lat && lon && vehicleId) {
    await detectJurisdictionCrossing(
      userId,
      vehicleId,
      lat,
      lon,
      odometer,
      new Date(located_at)
    );
  }

  // Process GPS for Phase 3 automated IFTA (PostGIS-based)
  try {
    await processGPSLocation({
      userId,
      vehicleId,
      eldConnectionId: connectionId,
      latitude: lat,
      longitude: lon,
      heading: bearing,
      speedMph: speed,
      odometer,
      recordedAt: located_at,
      provider: 'motive',
      externalId: vehicle_id?.toString()
    });
  } catch (gpsError) {
    log('Error processing GPS for IFTA:', gpsError.message);
    // Don't fail the webhook if IFTA processing fails
  }

  return { success: true, vehicleId };
}

/**
 * Handle Samsara VehicleStatsUpdated webhook (GPS + stats)
 */
export async function handleSamsaraVehicleStats(connectionId, userId, payload) {
  const { vehicle, gps, obdOdometerMeters, engineHours } = payload;

  if (!vehicle?.id || !gps) {
    log('Missing vehicle or GPS data in Samsara webhook');
    return { success: false, error: 'Missing data' };
  }

  log(`Processing Samsara stats for vehicle ${vehicle.id}`);

  // Find local vehicle
  const vehicleId = await findVehicle(userId, vehicle.id, 'samsara');

  // Convert meters to miles
  const odometerMiles = obdOdometerMeters ? obdOdometerMeters * 0.000621371 : null;

  // Store location
  const locationData = {
    user_id: userId,
    connection_id: connectionId,
    vehicle_id: vehicleId,
    external_vehicle_id: vehicle.id.toString(),
    latitude: gps.latitude,
    longitude: gps.longitude,
    speed_mph: gps.speedMilesPerHour,
    heading: gps.headingDegrees,
    odometer_miles: odometerMiles,
    engine_hours: engineHours,
    address: gps.reverseGeo?.formattedLocation,
    recorded_at: gps.time,
    created_at: new Date().toISOString()
  };

  const { error: locationError } = await supabaseAdmin
    .from('eld_vehicle_locations')
    .insert(locationData);

  if (locationError) {
    log('Error inserting Samsara location:', locationError.message);
  }

  // Update vehicle's last known location
  if (vehicleId) {
    await supabaseAdmin
      .from('vehicles')
      .update({
        last_known_location: {
          latitude: gps.latitude,
          longitude: gps.longitude,
          speed_mph: gps.speedMilesPerHour,
          heading: gps.headingDegrees,
          address: gps.reverseGeo?.formattedLocation,
          recorded_at: gps.time
        },
        last_location_at: gps.time,
        eld_last_sync_at: new Date().toISOString()
      })
      .eq('id', vehicleId);
  }

  // Detect jurisdiction crossing for IFTA (legacy bounding box method)
  if (gps.latitude && gps.longitude && vehicleId) {
    await detectJurisdictionCrossing(
      userId,
      vehicleId,
      gps.latitude,
      gps.longitude,
      odometerMiles,
      new Date(gps.time)
    );
  }

  // Process GPS for Phase 3 automated IFTA (PostGIS-based)
  try {
    await processGPSLocation({
      userId,
      vehicleId,
      eldConnectionId: connectionId,
      latitude: gps.latitude,
      longitude: gps.longitude,
      heading: gps.headingDegrees,
      speedMph: gps.speedMilesPerHour,
      odometer: odometerMiles,
      recordedAt: gps.time,
      provider: 'samsara',
      externalId: vehicle.id?.toString()
    });
  } catch (gpsError) {
    log('Error processing GPS for IFTA:', gpsError.message);
    // Don't fail the webhook if IFTA processing fails
  }

  return { success: true, vehicleId };
}

// ============================================================
// HOS STATUS HANDLERS
// ============================================================

/**
 * Handle Motive user_duty_status_updated webhook
 */
export async function handleMotiveHosUpdate(connectionId, userId, payload) {
  const {
    id: driverExternalId,
    duty_status,
    updated_at
  } = payload;

  log(`Processing Motive HOS update for driver ${driverExternalId}: ${duty_status}`);

  // Find local driver
  const driverId = await findDriver(userId, driverExternalId, 'motive');

  // Normalize duty status
  const normalizedStatus = normalizeDutyStatus(duty_status, 'motive');

  // Update driver's HOS status
  if (driverId) {
    const { error } = await supabaseAdmin
      .from('drivers')
      .update({
        hos_status: normalizedStatus,
        hos_last_updated_at: updated_at || new Date().toISOString()
      })
      .eq('id', driverId);

    if (error) {
      log('Error updating driver HOS:', error.message);
    }
  }

  // Log the HOS event
  await supabaseAdmin
    .from('eld_hos_logs')
    .insert({
      user_id: userId,
      driver_id: driverId,
      external_driver_id: driverExternalId.toString(),
      duty_status: normalizedStatus,
      start_time: updated_at || new Date().toISOString(),
      log_date: new Date(updated_at || Date.now()).toISOString().split('T')[0],
      origin: 'webhook',
      provider: 'motive',
      created_at: new Date().toISOString()
    });

  return { success: true, driverId };
}

/**
 * Handle Motive HOS violation webhook
 */
export async function handleMotiveHosViolation(connectionId, userId, payload) {
  const {
    id: violationId,
    type,
    name,
    start_time,
    end_time,
    driver
  } = payload;

  log(`Processing Motive HOS violation: ${type}`);

  // Find local driver
  const driverId = driver?.id ? await findDriver(userId, driver.id, 'motive') : null;

  // Insert violation record
  const { error } = await supabaseAdmin
    .from('eld_hos_violations')
    .upsert({
      user_id: userId,
      driver_id: driverId,
      violation_type: type,
      severity: 'violation',
      description: name,
      occurred_at: start_time,
      resolved_at: end_time,
      source: 'eld_webhook',
      external_violation_id: violationId?.toString(),
      created_at: new Date().toISOString()
    }, {
      onConflict: 'external_violation_id',
      ignoreDuplicates: false
    });

  if (error) {
    log('Error inserting HOS violation:', error.message);
  }

  // Create urgent notification
  if (driverId) {
    await createNotification(userId, {
      type: 'HOS_VIOLATION',
      title: 'HOS Violation Detected',
      message: `${name}: ${driver?.first_name} ${driver?.last_name}`,
      urgency: 'CRITICAL',
      entityType: 'driver',
      entityId: driverId,
      data: { violationType: type, violationId }
    });
  }

  return { success: true, driverId };
}

/**
 * Handle Samsara DriverDutyStatusChanged webhook
 */
export async function handleSamsaraHosUpdate(connectionId, userId, payload) {
  const { driver, hosStatusType, vehicle, startTime, location } = payload;

  if (!driver?.id) {
    return { success: false, error: 'Missing driver data' };
  }

  log(`Processing Samsara HOS update for driver ${driver.id}: ${hosStatusType}`);

  // Find local driver and vehicle
  const driverId = await findDriver(userId, driver.id, 'samsara');
  const vehicleId = vehicle?.id ? await findVehicle(userId, vehicle.id, 'samsara') : null;

  // Normalize duty status
  const normalizedStatus = normalizeDutyStatus(hosStatusType, 'samsara');

  // Update driver's HOS status
  if (driverId) {
    await supabaseAdmin
      .from('drivers')
      .update({
        hos_status: normalizedStatus,
        hos_last_updated_at: startTime || new Date().toISOString()
      })
      .eq('id', driverId);
  }

  // Log the HOS event
  await supabaseAdmin
    .from('eld_hos_logs')
    .insert({
      user_id: userId,
      driver_id: driverId,
      external_driver_id: driver.id.toString(),
      vehicle_id: vehicleId,
      duty_status: normalizedStatus,
      start_time: startTime,
      location_name: location?.name,
      latitude: location?.latitude,
      longitude: location?.longitude,
      log_date: new Date(startTime || Date.now()).toISOString().split('T')[0],
      origin: 'webhook',
      provider: 'samsara',
      created_at: new Date().toISOString()
    });

  return { success: true, driverId };
}

// ============================================================
// FAULT CODE HANDLERS
// ============================================================

/**
 * Handle Motive fault_code_opened/closed webhook
 */
export async function handleMotiveFaultCode(connectionId, userId, payload, action) {
  const {
    id: faultId,
    code_label,
    code_description,
    first_observed_at,
    last_observed_at,
    status,
    fmi,
    vehicle
  } = payload;

  log(`Processing Motive fault code ${action}: ${code_label}`);

  // Find local vehicle
  const vehicleId = vehicle?.id ? await findVehicle(userId, vehicle.id, 'motive') : null;

  const isActive = status === 'open';
  const severity = determineFaultSeverity(fmi, code_description);

  // Upsert fault code
  const { error } = await supabaseAdmin
    .from('eld_fault_codes')
    .upsert({
      user_id: userId,
      vehicle_id: vehicleId,
      external_vehicle_id: vehicle?.id?.toString(),
      fault_code: code_label,
      fault_code_type: 'J1939',
      fmi: fmi,
      description: code_description,
      severity: severity,
      first_observed_at: first_observed_at,
      last_observed_at: last_observed_at,
      resolved_at: isActive ? null : last_observed_at,
      is_active: isActive,
      provider: 'motive',
      created_at: new Date().toISOString()
    }, {
      onConflict: 'vehicle_id,fault_code',
      ignoreDuplicates: false
    });

  if (error) {
    log('Error upserting fault code:', error.message);
  }

  // Create notification for critical/warning faults
  if (isActive && vehicleId && (severity === 'critical' || severity === 'warning')) {
    await createNotification(userId, {
      type: 'VEHICLE_FAULT_CODE',
      title: `${severity === 'critical' ? 'Critical' : 'Warning'}: ${code_label}`,
      message: code_description,
      urgency: severity === 'critical' ? 'CRITICAL' : 'HIGH',
      entityType: 'vehicle',
      entityId: vehicleId,
      data: { faultCode: code_label, faultId }
    });
  }

  return { success: true, vehicleId };
}

/**
 * Handle Samsara VehicleDtcUpdated webhook
 */
export async function handleSamsaraFaultCode(connectionId, userId, payload) {
  const { vehicle, faultCodes } = payload;

  if (!vehicle?.id || !faultCodes?.length) {
    return { success: false, error: 'Missing data' };
  }

  log(`Processing Samsara fault codes for vehicle ${vehicle.id}`);

  // Find local vehicle
  const vehicleId = await findVehicle(userId, vehicle.id, 'samsara');

  for (const fault of faultCodes) {
    const severity = determineFaultSeverity(fault.fmi, fault.description);

    await supabaseAdmin
      .from('eld_fault_codes')
      .upsert({
        user_id: userId,
        vehicle_id: vehicleId,
        external_vehicle_id: vehicle.id.toString(),
        fault_code: fault.dtcShortCode || fault.faultCode,
        fault_code_type: fault.source || 'OBD2',
        spn: fault.spn,
        fmi: fault.fmi,
        description: fault.description,
        severity: severity,
        first_observed_at: fault.observedAt,
        last_observed_at: fault.observedAt,
        is_active: fault.isActive !== false,
        provider: 'samsara',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'vehicle_id,fault_code',
        ignoreDuplicates: false
      });

    // Notify for critical faults
    if (fault.isActive !== false && vehicleId && severity === 'critical') {
      await createNotification(userId, {
        type: 'VEHICLE_FAULT_CODE',
        title: `Critical: ${fault.dtcShortCode || fault.faultCode}`,
        message: fault.description,
        urgency: 'CRITICAL',
        entityType: 'vehicle',
        entityId: vehicleId,
        data: { faultCode: fault.dtcShortCode }
      });
    }
  }

  return { success: true, vehicleId };
}

// ============================================================
// GEOFENCE EVENT HANDLERS (for IFTA jurisdiction tracking)
// ============================================================

/**
 * Handle Motive vehicle_geofence_event webhook
 */
export async function handleMotiveGeofenceEvent(connectionId, userId, payload) {
  const {
    event_type,
    geofence_id,
    start_time,
    end_time,
    vehicle
  } = payload;

  log(`Processing Motive geofence event: ${event_type}`);

  // This can be used to track state border crossings if geofences are set up for them
  // For now, we rely on GPS-based jurisdiction detection

  return { success: true };
}

/**
 * Handle Samsara GeofenceEntry/GeofenceExit webhook
 */
export async function handleSamsaraGeofenceEvent(connectionId, userId, payload) {
  const { eventType, geofence, vehicle, entryTime, exitTime, location } = payload;

  log(`Processing Samsara geofence event: ${eventType}`);

  // Can be used for state border tracking if geofences match jurisdictions
  return { success: true };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Determine fault code severity based on FMI and description
 */
function determineFaultSeverity(fmi, description) {
  // FMI (Failure Mode Identifier) values that indicate critical issues
  const criticalFMIs = [0, 1, 2, 3, 4, 5, 6]; // Above/below normal, short circuit, etc.

  if (fmi !== undefined && criticalFMIs.includes(fmi)) {
    return 'critical';
  }

  // Check description for keywords
  const desc = (description || '').toLowerCase();
  if (desc.includes('critical') || desc.includes('failure') || desc.includes('malfunction')) {
    return 'critical';
  }
  if (desc.includes('warning') || desc.includes('abnormal')) {
    return 'warning';
  }

  return 'info';
}

/**
 * Create notification for user
 */
async function createNotification(userId, {
  type,
  title,
  message,
  urgency = 'MEDIUM',
  entityType = 'eld',
  entityId = null,
  data = {},
  linkTo = null
}) {
  try {
    await supabaseAdmin.rpc('create_notification', {
      p_user_id: userId,
      p_title: title,
      p_message: message,
      p_notification_type: type,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_link_to: linkTo || '/dashboard/fleet',
      p_due_date: null,
      p_urgency: urgency
    });
  } catch (error) {
    log(`Error creating notification: ${error.message}`);
  }
}

/**
 * Log webhook event for debugging and replay
 */
export async function logWebhookEvent(userId, provider, eventType, payload, processed = false, error = null) {
  try {
    await supabaseAdmin
      .from('eld_webhook_events')
      .insert({
        user_id: userId,
        provider: provider,
        event_type: eventType,
        payload: payload,
        processed: processed,
        processed_at: processed ? new Date().toISOString() : null,
        error_message: error,
        created_at: new Date().toISOString()
      });
  } catch (err) {
    log(`Error logging webhook event: ${err.message}`);
  }
}

export default {
  handleMotiveLocationUpdated,
  handleSamsaraVehicleStats,
  handleMotiveHosUpdate,
  handleMotiveHosViolation,
  handleSamsaraHosUpdate,
  handleMotiveFaultCode,
  handleSamsaraFaultCode,
  handleMotiveGeofenceEvent,
  handleSamsaraGeofenceEvent,
  logWebhookEvent
};
