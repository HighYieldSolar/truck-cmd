"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { DrawerSection, KV } from "../FleetDrawer";
import { StatusPill, DaysChip, ManualBadge } from "../atoms";

export default function MaintenanceDrawerBody({ m, vehicle, tab = "Overview", onMarkComplete }) {
  if (tab === "Notes") {
    return (
      <DrawerSection title="Notes">
        <div className="text-[13px] text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
          {m.description || <span className="text-slate-400 dark:text-gray-500">No notes yet.</span>}
        </div>
      </DrawerSection>
    );
  }

  const isUpcoming = m.status !== "Completed" && m.status !== "Cancelled";

  return (
    <>
      <DrawerSection title="Service">
        <KV label="Type" value={m.type} />
        <KV label="Description" value={m.description} />
        {m.dueDate && (
          <KV
            label="Due date"
            value={
              <span className="inline-flex items-center gap-1.5 flex-wrap">
                {m.dueDate}
                {m.due != null && <DaysChip days={m.due} label="Due" />}
              </span>
            }
          />
        )}
        {m.completed && <KV label="Completed" value={m.completed} />}
        <KV label="Status" value={<StatusPill status={m.status} />} />
        <KV
          label="Cost"
          value={
            <span className="font-mono tabular-nums">
              ${m.cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {m.est && <span className="text-[10px] text-slate-400 dark:text-gray-500 ml-1">est</span>}
            </span>
          }
        />
      </DrawerSection>

      <DrawerSection title="Provider">
        <KV
          label="Vendor"
          value={
            <span className="inline-flex items-center gap-1.5">
              {m.provider}
              {m.manual && <ManualBadge />}
            </span>
          }
        />
        <KV label="Invoice #" value={m.invoiceNumber} mono />
      </DrawerSection>

      <DrawerSection
        title="Vehicle"
        badge={
          m.synced ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
              <CheckCircle2 size={12} /> Synced to expenses
            </span>
          ) : null
        }
      >
        <KV
          label="Vehicle"
          value={
            m.vehicleId ? (
              <Link
                href={`/dashboard/fleet?tab=vehicles&row=${m.vehicleId}`}
                className="text-blue-700 hover:underline"
              >
                {m.vehicle}
              </Link>
            ) : (
              m.vehicle
            )
          }
        />
        <KV label="Odometer at service" value={m.odo} />
      </DrawerSection>

      {isUpcoming && (
        <button
          onClick={() => onMarkComplete?.(m)}
          className="w-full inline-flex items-center justify-center gap-1.5 h-9 mt-2 rounded-md bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-[13px] font-medium"
        >
          Mark complete
        </button>
      )}
    </>
  );
}
