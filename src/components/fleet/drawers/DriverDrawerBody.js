"use client";

import Link from "next/link";
import { DrawerSection, KV } from "../FleetDrawer";
import { HosChip, DaysChip } from "../atoms";

/**
 * Driver drawer body — multi-tab content rendered based on the active tab name.
 */
export default function DriverDrawerBody({ d, vehicles = [], tab = "Overview" }) {
  const assignedVehicle = vehicles.find((v) => v.id === d?.assignedVehicleId);

  if (tab === "HOS") return <HosTab d={d} />;
  if (tab === "Documents") return <DocumentsTab d={d} />;
  if (tab === "Activity") return <ActivityTab d={d} />;
  if (tab === "Notes") return <NotesTab d={d} />;
  return <OverviewTab d={d} assignedVehicle={assignedVehicle} />;
}

function OverviewTab({ d, assignedVehicle }) {
  return (
    <>
      <DrawerSection title="Contact">
        <KV label="Phone" value={d.phone} mono />
        <KV label="Email" value={d.email} />
        <KV label="Hire date" value={d.hireDate} />
        {(d.city || d.stateCode) && (
          <KV
            label="Home"
            value={[d.city, d.stateCode].filter(Boolean).join(", ")}
          />
        )}
      </DrawerSection>

      <DrawerSection
        title="Compliance"
        badge={
          (d.medical != null && d.medical < 0) || (d.license != null && d.license < 0) ? (
            <span className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">expired</span>
          ) : null
        }
      >
        <KV
          label="CDL"
          value={
            <span className="inline-flex items-center gap-1.5 flex-wrap">
              <span>{d.cdl || "—"}</span>
              {d.licenseState && <span className="text-slate-500 dark:text-gray-400">· {d.licenseState}</span>}
              {d.license != null && <DaysChip days={d.license} label="License" />}
            </span>
          }
        />
        <KV
          label="Medical card"
          value={
            d.medical != null ? (
              <span className="inline-flex items-center gap-1.5 flex-wrap">
                {d.medicalExpiry && (
                  <span className="text-slate-500 dark:text-gray-400">expires {d.medicalExpiry}</span>
                )}
                <DaysChip days={d.medical} label="Medical" />
              </span>
            ) : null
          }
        />
      </DrawerSection>

      <DrawerSection title="Assignment">
        <KV
          label="Vehicle"
          value={
            d.assignedVehicleId ? (
              <Link
                href={`/dashboard/fleet?tab=vehicles&row=${d.assignedVehicleId}`}
                className="text-blue-700 hover:underline"
              >
                {d.truck || "—"}
              </Link>
            ) : null
          }
        />
        <KV label="Last location" value={d.location} />
        <KV
          label="Emergency contact"
          value={
            d.emergencyContact
              ? `${d.emergencyContact}${d.emergencyPhone ? ` · ${d.emergencyPhone}` : ""}`
              : null
          }
        />
      </DrawerSection>

      <DrawerSection title="HOS · today">
        <HosCard d={d} />
      </DrawerSection>
    </>
  );
}

function HosCard({ d }) {
  // The duty status drives the bars; for now the percentages are derived from
  // the available drive time vs the 11h limit. The breakdown comes from the
  // drivers table; refine to use eld_hos_daily_logs on a dedicated HOS tab.
  const driveLeftMin = (() => {
    if (!d.hos.remaining) return 660;
    const [h, m] = d.hos.remaining.split(":").map(Number);
    return h * 60 + m;
  })();
  const drivePct = Math.max(0, Math.min(100, ((660 - driveLeftMin) / 660) * 100));

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-md text-[12.5px]">
      <div className="flex items-center justify-between mb-2">
        <HosChip duty={d.hos.duty} remaining={d.hos.remaining} stale={d.hos.stale} />
        {d.connectedToEld ? (
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Connected</span>
        ) : (
          <span className="text-[11px] text-slate-500 dark:text-gray-400">Not connected to ELD</span>
        )}
      </div>
      <div className="flex justify-between mb-1">
        <span className="text-slate-500 dark:text-gray-400">Drive used</span>
        <span className="tabular-nums font-semibold">
          {Math.round((660 - driveLeftMin) / 60 * 10) / 10}h / 11h
        </span>
      </div>
      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded mb-3">
        <div
          className="h-full rounded bg-emerald-500"
          style={{ width: `${drivePct}%` }}
        />
      </div>
      <div className="text-[11.5px] text-slate-500 dark:text-gray-400">
        Drive remaining{" "}
        <b className="text-slate-700 dark:text-gray-300 tabular-nums">{d.hos.remaining || "—"}</b>
      </div>
    </div>
  );
}

function HosTab({ d }) {
  return (
    <DrawerSection title="HOS detail · today">
      <HosCard d={d} />
      <div className="text-[12px] text-slate-500 dark:text-gray-400 mt-3">
        Daily log breakdown coming soon. Pulled live from {d.connectedToEld ? "your ELD provider" : "manual entries"}.
      </div>
    </DrawerSection>
  );
}

function DocumentsTab({ d }) {
  return (
    <DrawerSection title="Documents">
      <KV
        label="CDL"
        value={
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            {d.cdl}
            {d.license != null && <DaysChip days={d.license} label="CDL" />}
          </span>
        }
      />
      <KV
        label="Medical card"
        value={
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            {d.medicalExpiry || "—"}
            {d.medical != null && <DaysChip days={d.medical} label="Medical" />}
          </span>
        }
      />
      <div className="text-[11.5px] text-slate-500 dark:text-gray-400 mt-2">
        Document file upload coming soon. Add MVR, drug screen, and signed handbook here.
      </div>
    </DrawerSection>
  );
}

function ActivityTab({ d }) {
  return (
    <DrawerSection title="Recent activity">
      <div className="text-[12.5px] text-slate-500 dark:text-gray-400">
        Recent loads, dispatch events, and HOS log entries will appear here. Pulled live from loads + ELD events.
      </div>
    </DrawerSection>
  );
}

function NotesTab({ d }) {
  return (
    <DrawerSection title="Notes">
      <div className="whitespace-pre-wrap text-[13px] text-slate-700 dark:text-gray-300">
        {d.notes || <span className="text-slate-400 dark:text-gray-500">No notes yet.</span>}
      </div>
    </DrawerSection>
  );
}
