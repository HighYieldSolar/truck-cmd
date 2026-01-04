/**
 * ELD Diagnostics Service
 *
 * Handles vehicle diagnostics data including fault codes and health alerts.
 */

import { createClient } from '@supabase/supabase-js';
import { getConnection, createProviderForConnection } from './eldConnectionService';
import { getLocalVehicleId } from './eldMappingService';

const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args) => DEBUG && console.log('[eldDiagnosticsService]', ...args);

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
 * Get diagnostics data for a user
 *
 * @param {string} userId - User ID
 * @returns {Object} Diagnostics data with fault codes and summary
 */
export async function getDiagnosticsData(userId) {
  try {
    // Get active ELD connection
    const connectionResult = await getConnection(userId, 'terminal');
    const connection = connectionResult?.data;

    if (!connection) {
      return {
        error: false,
        faultCodes: [],
        summary: {
          totalFaults: 0,
          criticalCount: 0,
          warningCount: 0,
          infoCount: 0,
          vehiclesWithFaults: 0
        },
        lastUpdated: new Date().toISOString()
      };
    }

    // Fetch fault codes from database
    const { data: faultCodes, error: faultError } = await supabaseAdmin
      .from('eld_fault_codes')
      .select(`
        id,
        vehicle_id,
        code,
        description,
        severity,
        source,
        first_observed_at,
        last_observed_at,
        is_active,
        vehicles:vehicle_id (
          id,
          name,
          license_plate
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('severity', { ascending: true })
      .order('last_observed_at', { ascending: false })
      .limit(50);

    if (faultError) {
      log('Error fetching fault codes:', faultError);
      // Return empty data instead of error
      return {
        error: false,
        faultCodes: [],
        summary: {
          totalFaults: 0,
          criticalCount: 0,
          warningCount: 0,
          infoCount: 0,
          vehiclesWithFaults: 0
        },
        lastUpdated: new Date().toISOString()
      };
    }

    // Calculate summary
    const summary = {
      totalFaults: faultCodes?.length || 0,
      criticalCount: faultCodes?.filter(f => f.severity === 'critical').length || 0,
      warningCount: faultCodes?.filter(f => f.severity === 'warning').length || 0,
      infoCount: faultCodes?.filter(f => f.severity === 'info').length || 0,
      vehiclesWithFaults: new Set(faultCodes?.map(f => f.vehicle_id)).size || 0
    };

    // Format fault codes for response
    const formattedFaults = (faultCodes || []).map(fault => ({
      id: fault.id,
      vehicleId: fault.vehicle_id,
      vehicleName: fault.vehicles?.name || 'Unknown Vehicle',
      licensePlate: fault.vehicles?.license_plate || null,
      code: fault.code,
      description: fault.description,
      severity: fault.severity,
      source: fault.source,
      firstObservedAt: fault.first_observed_at,
      lastObservedAt: fault.last_observed_at,
      isActive: fault.is_active
    }));

    return {
      error: false,
      faultCodes: formattedFaults,
      summary,
      lastUpdated: connection.last_sync_at || new Date().toISOString()
    };

  } catch (error) {
    log('Error getting diagnostics data:', error);
    return {
      error: true,
      errorMessage: 'Failed to get diagnostics data'
    };
  }
}

/**
 * Sync fault codes from ELD provider
 *
 * @param {string} userId - User ID
 * @param {string} connectionId - ELD connection ID
 * @returns {Object} Sync result
 */
export async function syncFaultCodes(userId, connectionId) {
  try {
    log('Syncing fault codes for user:', userId);

    // Get ELD provider client
    const client = await createProviderForConnection(connectionId);

    if (!client) {
      return {
        error: true,
        errorMessage: 'Failed to get ELD provider client'
      };
    }

    // Fetch fault codes from ELD provider
    let allFaults = [];
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const params = { limit: 100 };
      if (cursor) params.cursor = cursor;

      const response = await client.get('/safety/events', { params });

      if (response.data?.data) {
        allFaults = allFaults.concat(response.data.data);
      }

      cursor = response.data?.cursor;
      hasMore = !!cursor;
    }

    log(`Fetched ${allFaults.length} fault events from Terminal`);

    // Process and store fault codes
    let syncedCount = 0;

    for (const fault of allFaults) {
      try {
        // Map external vehicle ID to local ID
        const vehicleId = await getLocalVehicleId(userId, fault.vehicle?.id);

        if (!vehicleId) {
          log('Skipping fault - no mapped vehicle:', fault.vehicle?.id);
          continue;
        }

        // Determine severity from event type
        const severity = determineSeverity(fault.type, fault.severity);

        // Upsert fault code
        const { error: upsertError } = await supabaseAdmin
          .from('eld_fault_codes')
          .upsert({
            user_id: userId,
            connection_id: connectionId,
            external_id: fault.id,
            vehicle_id: vehicleId,
            code: fault.code || fault.type || 'UNKNOWN',
            description: fault.description || fault.type || 'Unknown fault',
            severity,
            source: 'terminal',
            first_observed_at: fault.startedAt || new Date().toISOString(),
            last_observed_at: fault.endedAt || fault.startedAt || new Date().toISOString(),
            is_active: !fault.endedAt,
            raw_data: fault
          }, {
            onConflict: 'connection_id,external_id'
          });

        if (upsertError) {
          log('Error upserting fault code:', upsertError);
        } else {
          syncedCount++;
        }
      } catch (faultError) {
        log('Error processing fault:', faultError);
      }
    }

    // Update connection last sync time
    await supabaseAdmin
      .from('eld_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connectionId);

    return {
      error: false,
      syncedCount
    };

  } catch (error) {
    log('Error syncing fault codes:', error);
    return {
      error: true,
      errorMessage: 'Failed to sync fault codes'
    };
  }
}

/**
 * Clear resolved fault codes
 *
 * @param {string} userId - User ID
 * @param {string} faultId - Fault code ID to clear
 * @returns {Object} Result
 */
export async function clearFaultCode(userId, faultId) {
  try {
    const { error } = await supabaseAdmin
      .from('eld_fault_codes')
      .update({ is_active: false })
      .eq('id', faultId)
      .eq('user_id', userId);

    if (error) {
      log('Error clearing fault code:', error);
      return {
        error: true,
        errorMessage: 'Failed to clear fault code'
      };
    }

    return { error: false };

  } catch (error) {
    log('Error clearing fault code:', error);
    return {
      error: true,
      errorMessage: 'Failed to clear fault code'
    };
  }
}

/**
 * Determine severity from event type
 *
 * @param {string} eventType - Event type from ELD
 * @param {string} providedSeverity - Severity provided by ELD
 * @returns {string} Normalized severity
 */
function determineSeverity(eventType, providedSeverity) {
  // Use provided severity if available
  if (providedSeverity) {
    const normalized = providedSeverity.toLowerCase();
    if (['critical', 'high', 'emergency'].includes(normalized)) return 'critical';
    if (['warning', 'medium', 'moderate'].includes(normalized)) return 'warning';
    return 'info';
  }

  // Determine from event type
  const criticalTypes = [
    'ENGINE_FAULT',
    'BRAKE_FAILURE',
    'TRANSMISSION_FAULT',
    'ABS_FAULT',
    'CRITICAL',
    'EMERGENCY'
  ];

  const warningTypes = [
    'CHECK_ENGINE',
    'LOW_OIL',
    'LOW_COOLANT',
    'WARNING',
    'MAINTENANCE_DUE'
  ];

  const type = (eventType || '').toUpperCase();

  if (criticalTypes.some(t => type.includes(t))) return 'critical';
  if (warningTypes.some(t => type.includes(t))) return 'warning';

  return 'info';
}

export default {
  getDiagnosticsData,
  syncFaultCodes,
  clearFaultCode
};
