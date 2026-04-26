"use client";

import { Truck, MapPin, User, Pencil, ExternalLink, Trash2 } from "lucide-react";
import { StatusPill, HealthChip, DaysChip, LocationAge, RowMenu } from "../atoms";
import { FleetRow } from "../FleetTable";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Vehicle row — same two-line shape as DriverRow but vehicle-flavored.
 * Health chip + odometer + next-maint chip on the right.
 */
export default function VehicleRow({ v, dense, isSelected, onClick, onSelect, onEdit, onOpen, onDelete }) {
  const { t } = useTranslation("fleet");
  return (
    <FleetRow selected={isSelected} onClick={onClick} dense={dense} ariaLabel={v.name}>
      <div
        className="w-9 flex items-center justify-center self-stretch"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          aria-label={`Select ${v.name}`}
          checked={!!isSelected}
          onChange={(e) => onSelect?.(e.target.checked)}
          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 accent-blue-600 dark:accent-blue-500 cursor-pointer"
        />
      </div>

      <div
        className="flex justify-center"
        style={{ flex: `0 0 ${(dense ? 24 : 32) + 8}px`, paddingTop: dense ? 0 : 2 }}
      >
        <div
          className="bg-slate-100 dark:bg-gray-700 rounded-md flex items-center justify-center"
          style={{ width: dense ? 24 : 32, height: dense ? 24 : 32 }}
        >
          <Truck size={dense ? 13 : 16} className="text-slate-600 dark:text-gray-400" />
        </div>
      </div>

      <div className="flex-1 min-w-0 px-2.5">
        <div className={`flex items-center gap-2 ${dense ? "" : "mb-1"}`}>
          <span className="font-semibold text-slate-900 dark:text-gray-100 truncate">{v.name}</span>
          <span className="font-mono text-[11px] text-slate-500 dark:text-gray-400">{v.plate}</span>
          <StatusPill status={v.status} />
        </div>
        {!dense && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500 dark:text-gray-400">
            {v.mmy && <span className="truncate">{v.mmy}</span>}
            {v.driver && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 truncate">
                  <User size={11} className="text-slate-400 dark:text-gray-500" />
                  {v.driver}
                </span>
              </>
            )}
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} className="text-slate-400 dark:text-gray-500" />
              <span className="truncate max-w-[180px]">{v.location.city}</span>
              <LocationAge ageMinutes={v.location.ageMinutes} label={v.location.ageLabel} />
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center px-2.5" style={{ flex: "0 0 130px", paddingTop: dense ? 0 : 4 }}>
        <HealthChip health={v.health} />
      </div>

      <div
        className="flex items-center justify-end px-2.5 text-[12.5px] tabular-nums text-slate-700 dark:text-gray-300"
        style={{ flex: "0 0 110px", paddingTop: dense ? 0 : 6 }}
      >
        {v.odo != null ? (
          <>
            {(v.odo / 1000).toFixed(1)}k <span className="ml-1 text-slate-400 dark:text-gray-500">mi</span>
          </>
        ) : (
          <span className="text-slate-300 dark:text-gray-600">—</span>
        )}
      </div>

      <div
        className="flex items-center justify-end px-2.5"
        style={{ flex: "0 0 120px", paddingTop: dense ? 0 : 4 }}
      >
        {v.nextMaint != null ? (
          <DaysChip days={v.nextMaint} label="Next service" />
        ) : (
          <span className="text-slate-300 dark:text-gray-600">—</span>
        )}
      </div>

      <div className="w-9 flex items-center justify-center self-stretch">
        <RowMenu
          ariaLabel={t("redesign.actionsFor", "Actions for {{name}}", { name: v.name })}
          items={[
            { label: t("redesign.openDetails", "Open details"), icon: ExternalLink, onClick: () => onOpen?.(v) },
            { label: t("redesign.editVehicle", "Edit vehicle"), icon: Pencil, onClick: () => onEdit?.(v) },
            { label: t("redesign.deleteVehicle", "Delete vehicle"), icon: Trash2, onClick: () => onDelete?.(v), danger: true },
          ]}
        />
      </div>
    </FleetRow>
  );
}

export const VEHICLE_COLUMNS = [
  { key: "_icon", label: "", w: 40, sortable: false },
  { key: "name", label: "Vehicle", labelKey: "redesign.cols.vehicle", sortable: true },
  { key: "health", label: "Health", labelKey: "redesign.cols.health", w: 130, sortable: true },
  { key: "odo", label: "Odometer", labelKey: "redesign.cols.odometer", w: 110, right: true, sortable: true },
  { key: "nextMaint", label: "Next maint", labelKey: "redesign.cols.nextMaint", w: 120, right: true, sortable: true },
  { key: "_more", label: "", w: 36, sortable: false },
];
