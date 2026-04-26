"use client";

import { Truck, MapPin, Pencil, ExternalLink, Trash2 } from "lucide-react";
import { Avatar, StatusPill, HosChip, DaysChip, RowMenu } from "../atoms";
import { FleetRow } from "../FleetTable";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Driver row — two-line avatar-led layout (FKRowB shape).
 * In compact mode the second-line chips fold into proper columns.
 */
export default function DriverRow({ d, selected, dense, onClick, onSelect, isSelected, onEdit, onOpen, onDelete }) {
  const { t } = useTranslation("fleet");
  return (
    <FleetRow selected={selected || isSelected} onClick={onClick} dense={dense} ariaLabel={d.name}>
      {/* Checkbox cell */}
      <div className="w-9 flex items-center justify-center self-stretch" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          aria-label={`Select ${d.name}`}
          checked={!!isSelected}
          onChange={(e) => onSelect?.(e.target.checked, e)}
          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 accent-blue-600 dark:accent-blue-500 cursor-pointer"
        />
      </div>

      {/* Avatar */}
      <div
        className="flex justify-center"
        style={{ flex: `0 0 ${(dense ? 24 : 32) + 8}px`, paddingTop: dense ? 0 : 2 }}
      >
        <Avatar name={d.name} tone={d.avatar} size={dense ? 24 : 32} src={d.imageUrl} />
      </div>

      {/* Identity + secondary line. On mobile: name gets the full row,
          status pill sits inline on the right; the id and other meta drop
          to a second line so names aren't squashed. On md+ the original
          inline layout returns. */}
      <div className="flex-1 min-w-0 px-2.5">
        <div className={`flex items-center gap-2 ${dense ? "" : "mb-1"}`}>
          <span className="font-semibold text-slate-900 dark:text-gray-100 truncate flex-1 md:flex-initial md:max-w-[220px]">
            {d.name}
          </span>
          <span className="hidden md:inline font-mono text-[11px] text-slate-500 dark:text-gray-400">
            {d.id?.slice(0, 8) || ""}
          </span>
          <StatusPill status={d.status} />
        </div>
        {!dense && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500 dark:text-gray-400">
            {d.id && (
              <span className="md:hidden font-mono text-[11px] text-slate-500 dark:text-gray-400">
                {d.id?.slice(0, 8)}
              </span>
            )}
            <HosChip duty={d.hos.duty} remaining={d.hos.remaining} stale={d.hos.stale} size="xs" />
            {d.truck && (
              <span className="inline-flex items-center gap-1 min-w-0">
                <Truck size={11} className="text-slate-400 dark:text-gray-500 flex-shrink-0" />
                <span className="text-slate-600 dark:text-gray-400 truncate">{d.truck}</span>
              </span>
            )}
            {d.location && (
              <span className="inline-flex items-center gap-1 min-w-0">
                <MapPin size={11} className="text-slate-400 dark:text-gray-500 flex-shrink-0" />
                <span className="truncate">{d.location}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Compact-only inline columns */}
      {dense && (
        <>
          <div className="px-2.5 flex items-center" style={{ flex: "0 0 200px" }}>
            <HosChip duty={d.hos.duty} remaining={d.hos.remaining} stale={d.hos.stale} size="xs" />
          </div>
          <div
            className="px-2.5 flex items-center text-[12px] text-slate-500 dark:text-gray-400 truncate"
            style={{ flex: "0 0 220px" }}
          >
            {d.truck || <span className="text-slate-400 dark:text-gray-500">—</span>}
          </div>
        </>
      )}

      {/* Lic / Med chips — hidden on mobile (status info already covered
          via the HOS chip in the secondary line); shown on md+ at fixed
          width so the table aligns. */}
      <div
        className="hidden md:flex items-center gap-1 justify-end px-2.5"
        style={{ flex: "0 0 140px", paddingTop: dense ? 0 : 4 }}
      >
        {d.license != null ? <DaysChip days={d.license} label="License" /> : <span className="text-slate-300 dark:text-gray-600">—</span>}
        {d.medical != null ? <DaysChip days={d.medical} label="Medical" /> : <span className="text-slate-300 dark:text-gray-600">—</span>}
      </div>

      {/* More — sits flush on the right of the row on mobile and matches
          desktop alignment. */}
      <div className="w-9 flex items-center justify-center self-start md:self-stretch flex-shrink-0">
        <RowMenu
          ariaLabel={t("redesign.actionsFor", "Actions for {{name}}", { name: d.name })}
          items={[
            { label: t("redesign.openDetails", "Open details"), icon: ExternalLink, onClick: () => onOpen?.(d) },
            { label: t("redesign.editDriver", "Edit driver"), icon: Pencil, onClick: () => onEdit?.(d) },
            { label: t("redesign.deleteDriver", "Delete driver"), icon: Trash2, onClick: () => onDelete?.(d), danger: true },
          ]}
        />
      </div>
    </FleetRow>
  );
}

export const DRIVER_COLUMNS_COMFORTABLE = [
  { key: "_avatar", label: "", w: 40, sortable: false },
  { key: "name", label: "Driver", labelKey: "redesign.cols.driver", sortable: true },
  { key: "_chips", label: "Lic · Med", labelKey: "redesign.cols.licMed", w: 140, right: true, sortable: false },
  { key: "_more", label: "", w: 36, sortable: false },
];

export const DRIVER_COLUMNS_COMPACT = [
  { key: "_avatar", label: "", w: 32, sortable: false },
  { key: "name", label: "Driver", labelKey: "redesign.cols.driver", sortable: true },
  { key: "hos", label: "HOS · Remaining", labelKey: "redesign.cols.hosRemaining", w: 200, sortable: true },
  { key: "truck", label: "Assigned vehicle", labelKey: "redesign.cols.assignedVehicle", w: 220, sortable: true },
  { key: "_chips", label: "Lic · Med", labelKey: "redesign.cols.licMed", w: 140, right: true, sortable: false },
  { key: "_more", label: "", w: 36, sortable: false },
];
