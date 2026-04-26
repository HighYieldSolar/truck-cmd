"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { fetchDrivers, getDriverStats } from "@/lib/services/driverService";
import { fetchTrucks } from "@/lib/services/truckService";
import { fetchMaintenanceRecords } from "@/lib/services/maintenanceService";

const POLL_MS = 60_000;

/**
 * The ELD service modules (eldHosService, eldGpsService, eldConnectionService)
 * pull in admin clients that depend on `SUPABASE_SERVICE_ROLE_KEY` — a
 * server-only secret. We must not import them in client code. Instead, the
 * server already exposes `/api/eld/{hos,gps,connections}` which wrap those
 * services with proper Bearer-token auth and tier gating. This helper does the
 * round-trip with the user's current Supabase session.
 */
async function fetchEld(path) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return null;
    const res = await fetch(path, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null; // 401/403/500 → silently degrade to empty data
    return await res.json();
  } catch {
    return null;
  }
}

const TONE_KEYS = ["slate", "emerald", "blue", "amber", "rose"];
function toneFor(name = "") {
  return TONE_KEYS[(name.charCodeAt(0) || 0) % TONE_KEYS.length];
}

function daysBetween(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d - new Date()) / 86_400_000);
}

function ageMinutes(t) {
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((Date.now() - d.getTime()) / 60_000));
}

function ageLabel(min) {
  if (min == null) return "—";
  if (min < 2) return "now";
  if (min < 60) return `${min}m`;
  if (min < 1440) return `${Math.round(min / 60)}h`;
  return `${Math.round(min / 1440)}d`;
}

const DUTY_MAP = {
  D: "Driving",
  ON: "On Duty",
  OFF: "Off Duty",
  SB: "Sleeper",
  Driving: "Driving",
  "On Duty": "On Duty",
  "Off Duty": "Off Duty",
  Sleeper: "Sleeper",
};

function formatHos(driver) {
  // driver.hos_status from drivers table OR currentStatus from eldHosService
  const raw = driver.currentStatus || driver.hos_status || null;
  if (!raw) return { duty: "Not Connected" };
  const duty = DUTY_MAP[raw] || raw;
  const minutes =
    driver.availableDriveMinutes ?? driver.hos_available_drive_minutes ?? null;
  const remaining =
    minutes != null && duty !== "Off Duty"
      ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`
      : null;
  const stale = ageMinutes(driver.lastUpdated || driver.hos_last_updated_at) > 30;
  return { duty, remaining, stale };
}

/**
 * Centralized fleet data hook. Loads drivers, vehicles, maintenance, HOS, GPS,
 * active faults, and ELD connection in parallel; polls every 60s; exposes a
 * single normalized shape that the new UI consumes.
 */
export default function useFleetData(userId) {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [stats, setStats] = useState({});
  const [eld, setEld] = useState({ connected: false, lastSync: null, provider: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function loadAll() {
      try {
        const [
          rawDrivers,
          rawVehicles,
          rawMaint,
          driverStats,
          hosResp,
          gpsResp,
          connResp,
        ] = await Promise.all([
          fetchDrivers(userId).catch(() => []),
          fetchTrucks(userId).catch(() => []),
          fetchMaintenanceRecords(userId).catch(() => []),
          getDriverStats(userId).catch(() => ({})),
          fetchEld("/api/eld/hos/dashboard"),
          fetchEld("/api/eld/gps/dashboard"),
          fetchEld("/api/eld/connections"),
        ]);

        if (cancelled) return;

        // Scope active faults explicitly to the user's vehicle ids so we never
        // depend on RLS being correct on the vehicle_active_faults view.
        let scopedFaults = [];
        const ownedIds = rawVehicles.map((v) => v.id).filter(Boolean);
        if (ownedIds.length > 0) {
          // The vehicle_active_faults view is created by the ELD migration
          // and may not exist in every environment (e.g. local dev without
          // the migration applied). Swallow the error and fall back to no
          // faults instead of bubbling a red 400 to the console.
          try {
            const { data: f, error: fErr } = await supabase
              .from("vehicle_active_faults")
              .select(
                "vehicle_id, eld_vehicle_id, code, description, severity, is_active"
              )
              .in("vehicle_id", ownedIds)
              .eq("is_active", true);
            if (!fErr) scopedFaults = f || [];
          } catch {
            scopedFaults = [];
          }
        }
        if (cancelled) return;

        // Index helpers — note these come from API routes that wrap the
        // server-only ELD services. Field names match the underlying service
        // shapes: HOS dashboard returns `drivers`, GPS dashboard returns
        // `vehicles`, each vehicle has a nested `location: { ... }` object.
        const hosByDriverId = new Map();
        (hosResp?.drivers || []).forEach((h) => h?.id && hosByDriverId.set(h.id, h));

        const gpsByVehicleId = new Map();
        (gpsResp?.vehicles || []).forEach((g) => g?.localVehicleId && gpsByVehicleId.set(g.localVehicleId, g));

        const faultsByVehicleId = new Map();
        scopedFaults.forEach((f) => {
          const id = f.vehicle_id;
          if (!id) return;
          const list = faultsByVehicleId.get(id) || [];
          // Consumers (VehicleDrawerBody, useActionQueue) read code_description;
          // the column on vehicle_active_faults is `description`. Normalize here
          // so downstream code doesn't have to know about the schema name.
          list.push({ ...f, code_description: f.code_description ?? f.description });
          faultsByVehicleId.set(id, list);
        });

        const vehiclesById = new Map(rawVehicles.map((v) => [v.id, v]));
        const driversById = new Map(rawDrivers.map((d) => [d.id, d]));

        // Drivers ↔ vehicles cross-reference (vehicles.assigned_driver_id)
        const vehicleByDriverId = new Map();
        rawVehicles.forEach((v) => {
          if (v.assigned_driver_id) vehicleByDriverId.set(v.assigned_driver_id, v);
        });

        // Maintenance "next due" per vehicle (smallest non-completed days-until)
        const nextMaintByVehicleId = new Map();
        rawMaint.forEach((m) => {
          if (!m.truck_id) return;
          if (m.status === "Completed" || m.status === "Cancelled") return;
          const days = daysBetween(m.due_date);
          if (days == null) return;
          const cur = nextMaintByVehicleId.get(m.truck_id);
          if (cur == null || days < cur) nextMaintByVehicleId.set(m.truck_id, days);
        });

        // ─── Normalize drivers ─────────────────────────────────────
        const normDrivers = rawDrivers.map((d) => {
          const hosSrc = hosByDriverId.get(d.id) || d;
          const hos = formatHos(hosSrc);
          const assignedVeh = vehicleByDriverId.get(d.id) || null;
          const vehGps = assignedVeh ? gpsByVehicleId.get(assignedVeh.id) : null;
          return {
            id: d.id,
            raw: d,
            name: d.name || "—",
            avatar: toneFor(d.name || d.id),
            cdl: d.position || "CDL-A",
            dot: d.license_number || null,
            status: d.status || "Inactive",
            email: d.email,
            phone: d.phone,
            hireDate: d.hire_date,
            license: daysBetween(d.license_expiry),
            medical: daysBetween(d.medical_card_expiry),
            licenseExpiry: d.license_expiry,
            medicalExpiry: d.medical_card_expiry,
            licenseState: d.license_state,
            city: d.city,
            stateCode: d.state,
            emergencyContact: d.emergency_contact,
            emergencyPhone: d.emergency_phone,
            imageUrl: d.image_url,
            notes: d.notes,
            assignedVehicleId: assignedVeh?.id || null,
            truck: assignedVeh
              ? `${assignedVeh.name || assignedVeh.license_plate || "Vehicle"}${
                  assignedVeh.make ? ` — ${assignedVeh.make} ${assignedVeh.model || ""}`.trim() : ""
                }`
              : null,
            hos,
            location: vehGps?.address || null,
            locationAge: vehGps?.ageMinutes ?? null,
            connectedToEld: !!d.eld_external_id,
          };
        });

        // ─── Normalize vehicles ────────────────────────────────────
        const normVehicles = rawVehicles.map((v) => {
          const gps = gpsByVehicleId.get(v.id);
          const faults = faultsByVehicleId.get(v.id) || [];
          const driver = v.assigned_driver_id ? driversById.get(v.assigned_driver_id) : null;
          const critCount = faults.filter((f) => f.severity === "critical").length;
          const warnCount = faults.length - critCount;
          let health;
          if (critCount > 0) {
            health = { kind: "critical", count: critCount, faults, label: `${critCount} critical` };
          } else if (warnCount > 0) {
            health = { kind: "warning", count: warnCount, faults, label: `${warnCount} warning${warnCount === 1 ? "" : "s"}` };
          } else {
            health = { kind: "healthy", faults: [], label: "Healthy" };
          }

          const am = gps?.ageMinutes ?? ageMinutes(v.last_location_at);
          const lkl = v.last_known_location || {};
          const gpsLoc = gps?.location || {};
          return {
            id: v.id,
            raw: v,
            name: v.name || `Truck ${v.license_plate || v.id?.slice(0, 4)}`,
            plate: v.license_plate || "—",
            vin: v.vin,
            mmy: [v.make, v.model, v.year].filter(Boolean).join(" "),
            year: v.year,
            status: v.status || "Active",
            health,
            location: {
              city: gpsLoc.address || lkl.address || lkl.city || (v.city || "—"),
              ageMinutes: am,
              ageLabel: ageLabel(am),
              heading: gpsLoc.heading ?? lkl.heading ?? 0,
              speed: gpsLoc.speedMph ?? gpsLoc.speed ?? lkl.speed_mph ?? 0,
              moving: gps?.isMoving ?? ((gpsLoc.speedMph ?? 0) > 5),
              lat: gpsLoc.lat ?? gpsLoc.latitude ?? lkl.latitude ?? null,
              lng: gpsLoc.lng ?? gpsLoc.longitude ?? lkl.longitude ?? null,
            },
            driver: driver?.name || null,
            driverId: driver?.id || null,
            odo: v.odometer_miles ?? null,
            engineHours: v.engine_hours ?? null,
            nextMaint: nextMaintByVehicleId.get(v.id) ?? null,
            registration: daysBetween(v.registration_expiry),
            insurance: daysBetween(v.insurance_expiry),
            inspection: daysBetween(v.inspection_expiry),
            registrationExpiry: v.registration_expiry,
            insuranceExpiry: v.insurance_expiry,
            inspectionExpiry: v.inspection_expiry,
            connectedToEld: !!v.eld_external_id,
            imageUrl: v.image_url,
          };
        });

        // ─── Normalize maintenance ─────────────────────────────────
        const normMaint = rawMaint.map((m) => {
          const veh = m.trucks || vehiclesById.get(m.truck_id) || {};
          const days = daysBetween(m.due_date);
          const overdue =
            (m.status !== "Completed" && m.status !== "Cancelled") && days != null && days < 0;
          return {
            id: m.id,
            raw: m,
            vehicleId: m.truck_id,
            vehicle: veh.name || `Vehicle ${m.truck_id?.slice(0, 4) || ""}`,
            vid: m.truck_id?.slice(0, 8),
            type: m.maintenance_type || "Service",
            description: m.description,
            due: days,
            dueDate: m.due_date,
            status: overdue ? "Overdue" : m.status || "Pending",
            provider: m.service_provider || "—",
            cost: Number(m.cost) || 0,
            est: m.status !== "Completed",
            completed: m.completed_date,
            invoiceNumber: m.invoice_number,
            odoAt: m.odometer_at_service,
            odo: m.odometer_at_service ? `${m.odometer_at_service.toLocaleString()} mi` : "—",
            synced: !!m.expense_id,
            manual: false, // TODO when source column exists
          };
        });

        const primaryConn = connResp?.primaryConnection || connResp?.connections?.[0] || null;
        setDrivers(normDrivers);
        setVehicles(normVehicles);
        setMaintenance(normMaint);
        setStats(driverStats || {});
        setEld({
          connected: !!connResp?.connected || !!primaryConn?.id,
          lastSync: primaryConn?.last_sync_at || null,
          provider: primaryConn?.provider || null,
        });
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load fleet data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    const t = setInterval(loadAll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [userId, reloadKey]);

  // Live counts for the status strip
  const liveCounts = useMemo(() => {
    const driving = drivers.filter((d) => d.hos.duty === "Driving").length;
    const onDuty = drivers.filter((d) => d.hos.duty === "On Duty").length;
    const inMotion = vehicles.filter((v) => v.location.moving).length;
    let critFaults = 0;
    vehicles.forEach((v) => v.health.kind === "critical" && (critFaults += v.health.count || 1));
    return { driving, onDuty, inMotion, faults: critFaults, hos: 0 };
  }, [drivers, vehicles]);

  return {
    drivers,
    vehicles,
    maintenance,
    stats,
    eld,
    loading,
    error,
    reload,
    liveCounts,
  };
}
