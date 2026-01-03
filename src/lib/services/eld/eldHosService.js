/**
 * ELD HOS (Hours of Service) Service
 *
 * Provides HOS compliance tracking, violation detection, and driver status monitoring.
 * Integrates with Terminal API for real-time HOS data.
 */

import { createClient } from '@supabase/supabase-js';
import { getConnection, createClientForConnection } from './eldConnectionService';
import { getLocalDriverId } from './eldMappingService';
import { normalizeDutyStatus } from './terminalClient';

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
 * HOS status codes
 */
export const HOS_STATUS = {
  OFF_DUTY: 'OFF',
  SLEEPER_BERTH: 'SB',
  DRIVING: 'D',
  ON_DUTY: 'ON'
};

/**
 * HOS limits (in minutes)
 */
export const HOS_LIMITS = {
  DAILY_DRIVE: 11 * 60,      // 11 hours driving
  DAILY_ON_DUTY: 14 * 60,    // 14-hour window
  WEEKLY_70_HOUR: 70 * 60,   // 70 hours in 8 days
  REST_BREAK: 30,            // 30-minute break required
  SLEEPER_BERTH: 10 * 60     // 10 hours off-duty
};

/**
 * Get current HOS status for all drivers
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Current HOS status for all drivers
 */
export async function getAllDriversHosStatus(userId) {
  try {
    const connectionResult = await getConnection(userId, 'terminal');
    if (connectionResult.error || !connectionResult.data) {
      return { error: true, errorMessage: 'No active ELD connection' };
    }

    const connectionId = connectionResult.data.id;

    // Get drivers with their current HOS status from our database
    const { data: drivers, error } = await supabaseAdmin
      .from('drivers')
      .select(`
        id,
        first_name,
        last_name,
        eld_external_id,
        hos_status,
        hos_available_drive_minutes,
        hos_last_updated_at
      `)
      .eq('user_id', userId)
      .not('eld_external_id', 'is', null);

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    // Enhance with latest HOS logs if available
    const enhancedDrivers = await Promise.all(
      (drivers || []).map(async (driver) => {
        // Get latest daily log for today
        const today = new Date().toISOString().split('T')[0];
        const { data: dailyLog } = await supabaseAdmin
          .from('eld_hos_daily_logs')
          .select('*')
          .eq('connection_id', connectionId)
          .eq('external_driver_id', driver.eld_external_id)
          .eq('log_date', today)
          .single();

        return {
          ...driver,
          fullName: `${driver.first_name} ${driver.last_name}`,
          currentStatus: driver.hos_status || 'UNKNOWN',
          statusLabel: getStatusLabel(driver.hos_status),
          availableDriveTime: formatMinutes(driver.hos_available_drive_minutes),
          availableDriveMinutes: driver.hos_available_drive_minutes || 0,
          lastUpdated: driver.hos_last_updated_at,
          dailyLog: dailyLog ? {
            driveMinutes: dailyLog.drive_minutes,
            onDutyMinutes: dailyLog.on_duty_minutes,
            offDutyMinutes: dailyLog.off_duty_minutes,
            sleeperMinutes: dailyLog.sleeper_minutes,
            hasViolation: dailyLog.has_violation,
            violations: dailyLog.violations
          } : null
        };
      })
    );

    return {
      error: false,
      drivers: enhancedDrivers,
      lastSyncAt: connectionResult.data.last_sync_at
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get detailed HOS data for a specific driver
 * @param {string} userId - User ID
 * @param {string} driverId - Local driver ID
 * @param {string} startDate - Start date (optional, defaults to 7 days ago)
 * @param {string} endDate - End date (optional, defaults to today)
 * @returns {Promise<object>} - Detailed HOS data
 */
export async function getDriverHosDetails(userId, driverId, startDate, endDate) {
  try {
    // Get driver and verify ownership
    const { data: driver, error: driverError } = await supabaseAdmin
      .from('drivers')
      .select('id, first_name, last_name, eld_external_id, hos_status, hos_available_drive_minutes')
      .eq('id', driverId)
      .eq('user_id', userId)
      .single();

    if (driverError || !driver) {
      return { error: true, errorMessage: 'Driver not found' };
    }

    if (!driver.eld_external_id) {
      return { error: true, errorMessage: 'Driver not linked to ELD' };
    }

    const connectionResult = await getConnection(userId, 'terminal');
    if (connectionResult.error || !connectionResult.data) {
      return { error: true, errorMessage: 'No active ELD connection' };
    }

    const connectionId = connectionResult.data.id;

    // Default date range: last 7 days
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get daily logs
    const { data: dailyLogs, error: logsError } = await supabaseAdmin
      .from('eld_hos_daily_logs')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('external_driver_id', driver.eld_external_id)
      .gte('log_date', start)
      .lte('log_date', end)
      .order('log_date', { ascending: false });

    if (logsError) {
      return { error: true, errorMessage: logsError.message };
    }

    // Get individual log entries
    const { data: logEntries, error: entriesError } = await supabaseAdmin
      .from('eld_hos_logs')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('external_driver_id', driver.eld_external_id)
      .gte('log_time', `${start}T00:00:00Z`)
      .lte('log_time', `${end}T23:59:59Z`)
      .order('log_time', { ascending: false });

    if (entriesError) {
      return { error: true, errorMessage: entriesError.message };
    }

    // Calculate summary statistics
    const totalDriveMinutes = dailyLogs?.reduce((sum, log) => sum + (log.drive_minutes || 0), 0) || 0;
    const totalOnDutyMinutes = dailyLogs?.reduce((sum, log) => sum + (log.on_duty_minutes || 0), 0) || 0;
    const violationCount = dailyLogs?.filter(log => log.has_violation).length || 0;

    return {
      error: false,
      driver: {
        id: driver.id,
        name: `${driver.first_name} ${driver.last_name}`,
        currentStatus: driver.hos_status,
        statusLabel: getStatusLabel(driver.hos_status),
        availableDriveTime: formatMinutes(driver.hos_available_drive_minutes)
      },
      dateRange: { start, end },
      dailyLogs: (dailyLogs || []).map(log => ({
        date: log.log_date,
        driveTime: formatMinutes(log.drive_minutes),
        driveMinutes: log.drive_minutes,
        onDutyTime: formatMinutes(log.on_duty_minutes),
        onDutyMinutes: log.on_duty_minutes,
        offDutyTime: formatMinutes(log.off_duty_minutes),
        sleeperTime: formatMinutes(log.sleeper_minutes),
        hasViolation: log.has_violation,
        violations: log.violations,
        certifiedAt: log.certified_at
      })),
      logEntries: (logEntries || []).map(entry => ({
        time: entry.log_time,
        status: entry.duty_status,
        statusLabel: getStatusLabel(entry.duty_status),
        location: entry.location,
        notes: entry.notes,
        vehicle: entry.external_vehicle_id
      })),
      summary: {
        totalDriveTime: formatMinutes(totalDriveMinutes),
        totalDriveMinutes,
        totalOnDutyTime: formatMinutes(totalOnDutyMinutes),
        totalOnDutyMinutes,
        violationCount,
        daysWithViolations: violationCount,
        averageDriveTimePerDay: formatMinutes(Math.round(totalDriveMinutes / (dailyLogs?.length || 1)))
      }
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get available HOS time for all drivers (from Terminal API)
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Available time for all drivers
 */
export async function getAvailableTime(userId) {
  try {
    const connectionResult = await getConnection(userId, 'terminal');
    if (connectionResult.error || !connectionResult.data) {
      return { error: true, errorMessage: 'No active ELD connection' };
    }

    const client = await createClientForConnection(connectionResult.data.id);
    if (!client) {
      return { error: true, errorMessage: 'Failed to create API client' };
    }

    const availableTime = await client.getHosAvailableTime();

    if (!availableTime || !availableTime.data) {
      return { error: true, errorMessage: 'Failed to get available time' };
    }

    // Map to local drivers
    const enhancedData = await Promise.all(
      (availableTime.data || []).map(async (item) => {
        const localDriverId = await getLocalDriverId(connectionResult.data.id, item.driverId);
        let driverName = 'Unknown Driver';

        if (localDriverId) {
          const { data: driver } = await supabaseAdmin
            .from('drivers')
            .select('first_name, last_name')
            .eq('id', localDriverId)
            .single();

          if (driver) {
            driverName = `${driver.first_name} ${driver.last_name}`;
          }
        }

        return {
          externalDriverId: item.driverId,
          localDriverId,
          driverName,
          driveMinutesRemaining: item.driveMinutes || 0,
          driveTimeRemaining: formatMinutes(item.driveMinutes || 0),
          shiftMinutesRemaining: item.shiftMinutes || 0,
          shiftTimeRemaining: formatMinutes(item.shiftMinutes || 0),
          cycleMinutesRemaining: item.cycleMinutes || 0,
          cycleTimeRemaining: formatMinutes(item.cycleMinutes || 0),
          breakRequired: item.breakRequired || false,
          currentDutyStatus: normalizeDutyStatus(item.dutyStatus),
          statusLabel: getStatusLabel(normalizeDutyStatus(item.dutyStatus))
        };
      })
    );

    return {
      error: false,
      drivers: enhancedData,
      updatedAt: new Date().toISOString()
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Check for HOS violations and compliance issues
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Violations and warnings
 */
export async function checkHosCompliance(userId) {
  try {
    const connectionResult = await getConnection(userId, 'terminal');
    if (connectionResult.error || !connectionResult.data) {
      return { error: true, errorMessage: 'No active ELD connection' };
    }

    const connectionId = connectionResult.data.id;

    // Check for violations in the last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: violationLogs, error } = await supabaseAdmin
      .from('eld_hos_daily_logs')
      .select(`
        id,
        log_date,
        external_driver_id,
        has_violation,
        violations,
        drive_minutes,
        on_duty_minutes
      `)
      .eq('connection_id', connectionId)
      .eq('has_violation', true)
      .gte('log_date', weekAgo)
      .order('log_date', { ascending: false });

    if (error) {
      return { error: true, errorMessage: error.message };
    }

    // Get driver names
    const violations = await Promise.all(
      (violationLogs || []).map(async (log) => {
        const localDriverId = await getLocalDriverId(connectionId, log.external_driver_id);
        let driverName = 'Unknown Driver';

        if (localDriverId) {
          const { data: driver } = await supabaseAdmin
            .from('drivers')
            .select('first_name, last_name')
            .eq('id', localDriverId)
            .single();

          if (driver) {
            driverName = `${driver.first_name} ${driver.last_name}`;
          }
        }

        return {
          date: log.log_date,
          driverId: localDriverId,
          driverName,
          violations: log.violations || [],
          driveTime: formatMinutes(log.drive_minutes),
          onDutyTime: formatMinutes(log.on_duty_minutes)
        };
      })
    );

    // Check for drivers approaching limits
    const { data: drivers } = await supabaseAdmin
      .from('drivers')
      .select('id, first_name, last_name, hos_available_drive_minutes')
      .eq('user_id', userId)
      .not('eld_external_id', 'is', null);

    const warnings = (drivers || [])
      .filter(d => d.hos_available_drive_minutes !== null && d.hos_available_drive_minutes < 120) // Less than 2 hours
      .map(d => ({
        driverId: d.id,
        driverName: `${d.first_name} ${d.last_name}`,
        remainingDriveTime: formatMinutes(d.hos_available_drive_minutes),
        remainingMinutes: d.hos_available_drive_minutes,
        severity: d.hos_available_drive_minutes < 30 ? 'critical' : 'warning'
      }));

    return {
      error: false,
      violations,
      violationCount: violations.length,
      warnings,
      warningCount: warnings.length,
      hasIssues: violations.length > 0 || warnings.length > 0,
      periodStart: weekAgo,
      periodEnd: new Date().toISOString().split('T')[0]
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Get HOS summary dashboard data
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Dashboard summary
 */
export async function getHosDashboard(userId) {
  try {
    const [driversStatus, compliance] = await Promise.all([
      getAllDriversHosStatus(userId),
      checkHosCompliance(userId)
    ]);

    if (driversStatus.error) {
      return driversStatus;
    }

    const drivers = driversStatus.drivers || [];

    // Count drivers by status
    const statusCounts = {
      driving: drivers.filter(d => d.currentStatus === 'D').length,
      onDuty: drivers.filter(d => d.currentStatus === 'ON').length,
      sleeper: drivers.filter(d => d.currentStatus === 'SB').length,
      offDuty: drivers.filter(d => d.currentStatus === 'OFF').length,
      unknown: drivers.filter(d => !d.currentStatus || d.currentStatus === 'UNKNOWN').length
    };

    // Drivers low on time
    const lowOnTime = drivers.filter(d =>
      d.availableDriveMinutes !== null && d.availableDriveMinutes < 120
    );

    return {
      error: false,
      totalDrivers: drivers.length,
      statusCounts,
      driversCurrentlyDriving: statusCounts.driving,
      driversOnDuty: statusCounts.driving + statusCounts.onDuty,
      driversLowOnTime: lowOnTime.length,
      lowOnTimeDrivers: lowOnTime.map(d => ({
        id: d.id,
        name: d.fullName,
        remainingTime: d.availableDriveTime,
        remainingMinutes: d.availableDriveMinutes
      })),
      recentViolations: compliance.violations?.slice(0, 5) || [],
      violationCount: compliance.violationCount || 0,
      warningCount: compliance.warningCount || 0,
      lastUpdated: driversStatus.lastSyncAt
    };

  } catch (error) {
    return { error: true, errorMessage: error.message };
  }
}

/**
 * Format minutes to human readable time
 */
function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined) return '--:--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Get human readable status label
 */
function getStatusLabel(status) {
  const labels = {
    'OFF': 'Off Duty',
    'SB': 'Sleeper Berth',
    'D': 'Driving',
    'ON': 'On Duty',
    'UNKNOWN': 'Unknown'
  };
  return labels[status] || status || 'Unknown';
}

export default {
  getAllDriversHosStatus,
  getDriverHosDetails,
  getAvailableTime,
  checkHosCompliance,
  getHosDashboard,
  HOS_STATUS,
  HOS_LIMITS
};
