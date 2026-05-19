/**
 * ELD Real-time Data Hook
 *
 * Provides real-time subscriptions to ELD data via Supabase Realtime.
 * Automatically subscribes to vehicle locations, driver HOS, and fault codes.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook that fetches the local drivers + vehicles tables and returns lookup
 * maps for resolving the operator-friendly name shown in Fleet from a
 * realtime ELD row.
 *
 * Returns two flavors of map for each entity so callers can prefer the
 * stable UUID match (set by the ELD sync at insert time) and fall back
 * to the provider's external id if that's all that's available:
 *
 *   vehicleNameById      — keyed by local vehicles.id (UUID)
 *   vehicleNameByEldId   — keyed by vehicles.eld_external_id (provider id)
 *   driverNameById       — keyed by local drivers.id (UUID)
 *   driverNameByEldId    — keyed by drivers.eld_external_id (provider id)
 *
 * Looking up by UUID is the canonical path because the realtime views
 * (vehicle_current_locations, driver_hos_status) carry the local
 * UUID alongside the provider id, and the UUID can't drift even if
 * eld_external_id values get out of sync after a re-pairing.
 *
 * @param {string} userId - Local user id (drivers/vehicles are user-scoped)
 */
export function useELDNameMaps(userId) {
  const [maps, setMaps] = useState({
    vehicleNameById: {},
    vehicleNameByEldId: {},
    driverNameById: {},
    driverNameByEldId: {},
    loading: true,
  });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      try {
        const [vehiclesRes, driversRes] = await Promise.all([
          supabase
            .from('vehicles')
            .select('id, name, license_plate, eld_external_id')
            .eq('user_id', userId),
          supabase
            .from('drivers')
            .select('id, name, eld_external_id')
            .eq('user_id', userId),
        ]);

        if (cancelled) return;

        const vehicleNameById = {};
        const vehicleNameByEldId = {};
        for (const v of vehiclesRes.data || []) {
          const display = v.name || v.license_plate || v.eld_external_id || '';
          if (!display) continue;
          if (v.id) vehicleNameById[v.id] = display;
          if (v.eld_external_id) vehicleNameByEldId[v.eld_external_id] = display;
        }

        const driverNameById = {};
        const driverNameByEldId = {};
        for (const d of driversRes.data || []) {
          const display = (d.name || d.eld_external_id || '').trim();
          if (!display) continue;
          if (d.id) driverNameById[d.id] = display;
          if (d.eld_external_id) driverNameByEldId[d.eld_external_id] = display;
        }

        setMaps({
          vehicleNameById,
          vehicleNameByEldId,
          driverNameById,
          driverNameByEldId,
          loading: false,
        });
      } catch {
        if (!cancelled) setMaps((m) => ({ ...m, loading: false }));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return maps;
}

/**
 * Hook for real-time vehicle locations
 *
 * @param {string} userId - User ID to subscribe for
 * @param {object} options - Configuration options
 * @returns {object} - { locations, loading, error, refresh }
 */
export function useRealtimeVehicleLocations(userId, options = {}) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);

  // Fetch initial data
  const fetchLocations = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('vehicle_current_locations')
        .select('*')
        .eq('organization_id', userId)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setLocations(data || []);
      setError(null);
    } catch (err) {
      console.error('[useRealtimeVehicleLocations] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    fetchLocations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`vehicle_locations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_current_locations',
          filter: `organization_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLocations(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLocations(prev =>
              prev.map(loc =>
                loc.id === payload.new.id ? payload.new : loc
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setLocations(prev =>
              prev.filter(loc => loc.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [userId, fetchLocations]);

  return {
    locations,
    loading,
    error,
    refresh: fetchLocations,
  };
}

/**
 * Hook for real-time driver HOS status
 *
 * @param {string} userId - User ID to subscribe for
 * @param {object} options - Configuration options
 * @returns {object} - { drivers, loading, error, refresh }
 */
export function useRealtimeDriverHOS(userId, options = {}) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);

  // Fetch initial data
  const fetchDrivers = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('driver_hos_status')
        .select('*')
        .eq('organization_id', userId)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDrivers(data || []);
      setError(null);
    } catch (err) {
      console.error('[useRealtimeDriverHOS] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    fetchDrivers();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`driver_hos:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_hos_status',
          filter: `organization_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDrivers(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setDrivers(prev =>
              prev.map(driver =>
                driver.id === payload.new.id ? payload.new : driver
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setDrivers(prev =>
              prev.filter(driver => driver.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [userId, fetchDrivers]);

  // Get drivers with violations
  const driversWithViolations = drivers.filter(d => d.has_violation);

  // Get drivers by status
  const driversByStatus = {
    driving: drivers.filter(d => d.duty_status === 'driving'),
    on_duty: drivers.filter(d => d.duty_status === 'on_duty'),
    off_duty: drivers.filter(d => d.duty_status === 'off_duty'),
    sleeper: drivers.filter(d => d.duty_status === 'sleeper'),
  };

  return {
    drivers,
    driversWithViolations,
    driversByStatus,
    loading,
    error,
    refresh: fetchDrivers,
  };
}

/**
 * Hook for real-time vehicle fault codes
 *
 * @param {string} userId - User ID to subscribe for
 * @param {object} options - Configuration options
 * @returns {object} - { faults, loading, error, refresh }
 */
export function useRealtimeFaultCodes(userId, options = {}) {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);

  // Fetch initial data
  const fetchFaults = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('vehicle_active_faults')
        .select('*')
        .eq('organization_id', userId)
        .eq('is_active', true)
        .order('severity', { ascending: true }) // Critical first
        .order('last_observed_at', { ascending: false });

      if (fetchError) throw fetchError;
      setFaults(data || []);
      setError(null);
    } catch (err) {
      console.error('[useRealtimeFaultCodes] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    fetchFaults();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`vehicle_faults:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_active_faults',
          filter: `organization_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.is_active) {
              setFaults(prev => [payload.new, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.is_active) {
              setFaults(prev =>
                prev.map(fault =>
                  fault.id === payload.new.id ? payload.new : fault
                )
              );
            } else {
              // Fault resolved, remove from list
              setFaults(prev =>
                prev.filter(fault => fault.id !== payload.new.id)
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setFaults(prev =>
              prev.filter(fault => fault.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [userId, fetchFaults]);

  // Categorize faults by severity
  const criticalFaults = faults.filter(f => f.severity === 'critical');
  const warningFaults = faults.filter(f => f.severity === 'warning');
  const infoFaults = faults.filter(f => f.severity === 'info');

  return {
    faults,
    criticalFaults,
    warningFaults,
    infoFaults,
    hasCritical: criticalFaults.length > 0,
    loading,
    error,
    refresh: fetchFaults,
  };
}

/**
 * Combined hook for all ELD real-time data
 *
 * @param {string} userId - User ID to subscribe for
 * @returns {object} - Combined real-time data
 */
export function useELDRealtime(userId) {
  const vehicleData = useRealtimeVehicleLocations(userId);
  const hosData = useRealtimeDriverHOS(userId);
  const faultData = useRealtimeFaultCodes(userId);

  const loading = vehicleData.loading || hosData.loading || faultData.loading;
  const error = vehicleData.error || hosData.error || faultData.error;

  const refresh = useCallback(() => {
    vehicleData.refresh();
    hosData.refresh();
    faultData.refresh();
  }, [vehicleData, hosData, faultData]);

  return {
    // Vehicle Locations
    vehicles: vehicleData.locations,
    vehiclesLoading: vehicleData.loading,

    // Driver HOS
    drivers: hosData.drivers,
    driversWithViolations: hosData.driversWithViolations,
    driversByStatus: hosData.driversByStatus,
    driversLoading: hosData.loading,

    // Fault Codes
    faults: faultData.faults,
    criticalFaults: faultData.criticalFaults,
    hasCriticalFaults: faultData.hasCritical,
    faultsLoading: faultData.loading,

    // Combined
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for IFTA mileage data (not real-time, on-demand)
 *
 * @param {string} userId - User ID
 * @param {string} quarter - Quarter to fetch (e.g., '2026-Q1')
 * @returns {object} - { mileage, loading, error, refresh }
 */
export function useIFTAMileage(userId, quarter) {
  const [mileage, setMileage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMileage = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Build query
      let query = supabase
        .from('ifta_realtime_mileage')
        .select('*')
        .eq('organization_id', userId);

      if (quarter) {
        query = query.eq('quarter', quarter);
      }

      const { data, error: fetchError } = await query
        .order('jurisdiction', { ascending: true });

      if (fetchError) throw fetchError;
      setMileage(data || []);
      setError(null);
    } catch (err) {
      console.error('[useIFTAMileage] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, quarter]);

  useEffect(() => {
    fetchMileage();
  }, [fetchMileage]);

  // Calculate totals
  const totalMiles = mileage.reduce((sum, m) => sum + (m.miles || 0), 0);
  const mileageByJurisdiction = mileage.reduce((acc, m) => {
    acc[m.jurisdiction] = (acc[m.jurisdiction] || 0) + (m.miles || 0);
    return acc;
  }, {});

  return {
    mileage,
    totalMiles,
    mileageByJurisdiction,
    loading,
    error,
    refresh: fetchMileage,
  };
}

export default useELDRealtime;
