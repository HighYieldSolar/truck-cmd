"use client";

import Link from "next/link";
import { CheckCircle2, AlertTriangle, AlertCircle, Truck, MapPin } from "lucide-react";
import { DrawerSection, KV } from "../FleetDrawer";
import { DaysChip, ManualBadge, LocationAge, ageToLabel } from "../atoms";

/**
 * Vehicle drawer body — Live Health card, Live Location, odometer & engine
 * hours stat cards, Compliance, IFTA this quarter (placeholder until joined).
 */
export default function VehicleDrawerBody({ v, drivers = [], tab = "Overview" }) {
  if (tab === "Health") return <HealthTab v={v} />;
  if (tab === "Location") return <LocationTab v={v} />;
  if (tab === "Maintenance") return <MaintenanceTab v={v} />;
  if (tab === "Fuel") return <FuelTab v={v} />;
  return <OverviewTab v={v} drivers={drivers} />;
}

function OverviewTab({ v, drivers }) {
  const driver = drivers.find((d) => d.id === v.driverId);
  return (
    <>
      <LiveHealthCard v={v} />
      <LiveLocationCard v={v} />
      <OdoEnginePair v={v} />

      <DrawerSection title="Compliance">
        <KV
          label="Registration"
          value={
            <span className="inline-flex items-center gap-1.5 flex-wrap">
              {v.registrationExpiry || "—"}
              {v.registration != null && <DaysChip days={v.registration} label="Reg" />}
            </span>
          }
        />
        <KV
          label="Insurance"
          value={
            <span className="inline-flex items-center gap-1.5 flex-wrap">
              {v.insuranceExpiry || "—"}
              {v.insurance != null && <DaysChip days={v.insurance} label="Ins" />}
            </span>
          }
        />
        <KV
          label="DOT inspection"
          value={
            <span className="inline-flex items-center gap-1.5 flex-wrap">
              {v.inspectionExpiry || "—"}
              {v.inspection != null && <DaysChip days={v.inspection} label="DOT" />}
            </span>
          }
        />
      </DrawerSection>

      <DrawerSection title="Assignment">
        <KV
          label="Assigned driver"
          value={
            v.driverId ? (
              <Link
                href={`/dashboard/fleet?tab=drivers&row=${v.driverId}`}
                className="text-blue-700 hover:underline"
              >
                {v.driver}
              </Link>
            ) : null
          }
        />
        {driver?.hos?.duty && (
          <KV
            label="Driver HOS"
            value={
              <span className="text-slate-700 dark:text-gray-300">
                {driver.hos.duty}
                {driver.hos.remaining ? ` · ${driver.hos.remaining}` : ""}
              </span>
            }
          />
        )}
      </DrawerSection>

      <DrawerSection title="Vehicle">
        <KV label="Make / model / year" value={v.mmy} />
        <KV label="License plate" value={v.plate} mono />
        <KV label="VIN" value={v.vin} mono />
      </DrawerSection>
    </>
  );
}

function LiveHealthCard({ v }) {
  const k = v.health.kind;
  const cls =
    k === "critical"
      ? "bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40"
      : k === "warning"
      ? "bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/40"
      : "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40";
  return (
    <DrawerSection
      title="Live health"
      badge={
        k !== "healthy" ? (
          <span className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">{v.health.count} active</span>
        ) : null
      }
    >
      <div className={`p-3 border rounded-md ${cls}`}>
        {(v.health.faults || []).length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-[13px]">
            <CheckCircle2 size={14} strokeWidth={2.25} />
            <b>Healthy</b> — no active faults
          </div>
        ) : (
          v.health.faults.slice(0, 5).map((f, i) => {
            const Icon = f.severity === "critical" ? AlertTriangle : AlertCircle;
            const cFg = f.severity === "critical" ? "text-rose-600" : "text-amber-600";
            return (
              <div key={i} className={`flex items-center gap-2.5 ${i ? "pt-2" : ""}`}>
                <Icon size={14} className={cFg} />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[12px] font-semibold text-slate-900 dark:text-gray-100">
                    {f.code}
                  </div>
                  <div className="text-[12px] text-slate-600 dark:text-gray-400 mt-0.5 truncate">
                    {f.code_description}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DrawerSection>
  );
}

function LiveLocationCard({ v }) {
  return (
    <DrawerSection
      title="Live location"
      badge={
        <LocationAge ageMinutes={v.location.ageMinutes} label={v.location.ageLabel} />
      }
    >
      <div className="flex gap-3">
        <div className="w-[140px] h-[100px] bg-slate-900 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center">
          <MapPin size={20} className="text-emerald-400" />
        </div>
        <div className="flex-1 text-[12.5px]">
          <div className="font-semibold text-slate-900 dark:text-gray-100">{v.location.city || "—"}</div>
          <div className="mt-2 flex gap-3 tabular-nums">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-gray-400">Speed</div>
              <div
                className={`font-semibold ${v.location.moving ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-gray-300"}`}
              >
                {v.location.speed} mph
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-gray-400">Heading</div>
              <div className="font-semibold text-slate-700 dark:text-gray-300">
                {v.location.moving ? `${v.location.heading}°` : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DrawerSection>
  );
}

function OdoEnginePair({ v }) {
  return (
    <div className="flex gap-3 mb-5">
      <StatCard
        label="Odometer"
        value={
          v.odo != null ? (
            <>
              {v.odo.toLocaleString()} <span className="text-[13px] text-slate-400 dark:text-gray-500">mi</span>
            </>
          ) : (
            "—"
          )
        }
        sub={v.location.ageLabel ? `from ELD · ${v.location.ageLabel} ago` : "—"}
      />
      <StatCard
        label="Engine hours"
        value={
          v.engineHours != null ? (
            <>
              {v.engineHours.toLocaleString()}{" "}
              <span className="text-[13px] text-slate-400 dark:text-gray-500">hrs</span>
            </>
          ) : (
            "—"
          )
        }
        sub={v.location.ageLabel ? `from ELD · ${v.location.ageLabel} ago` : "—"}
      />
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-md">
      <div className="text-[11px] text-slate-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
        {label}
      </div>
      <div className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-gray-100 tabular-nums mt-1">
        {value}
      </div>
      <div className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">{sub}</div>
    </div>
  );
}

function HealthTab({ v }) {
  return (
    <div>
      <LiveHealthCard v={v} />
      <DrawerSection title="Diagnostic notes">
        <div className="text-[12.5px] text-slate-500 dark:text-gray-400">
          Active fault detail and repair recommendations show here once a fault is selected.
        </div>
      </DrawerSection>
    </div>
  );
}

function LocationTab({ v }) {
  return (
    <div>
      <LiveLocationCard v={v} />
      <DrawerSection title="Recent pings">
        <div className="text-[12.5px] text-slate-500 dark:text-gray-400">
          Last 10 GPS pings will appear here, pulled from{" "}
          <code className="font-mono text-slate-700 dark:text-gray-300">eld_vehicle_locations</code>.
        </div>
      </DrawerSection>
    </div>
  );
}

function MaintenanceTab({ v }) {
  return (
    <DrawerSection title="Maintenance">
      <div className="text-[12.5px] text-slate-500 dark:text-gray-400">
        Scheduled and completed maintenance for this vehicle. Use the Maintenance tab for the full table.
      </div>
    </DrawerSection>
  );
}

function FuelTab({ v }) {
  return (
    <DrawerSection title="Recent fuel">
      <div className="text-[12.5px] text-slate-500 dark:text-gray-400">
        Last 5 fuel entries will appear here. Manually-entered fills get an{" "}
        <ManualBadge /> badge.
      </div>
    </DrawerSection>
  );
}
