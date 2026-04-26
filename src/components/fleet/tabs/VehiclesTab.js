"use client";

import { useMemo, useState } from "react";
import FleetTable from "../FleetTable";
import FleetSkeletonTable from "../FleetSkeletonTable";
import FleetEmptyState from "../FleetEmptyState";
import FleetFilterBar from "../FleetFilterBar";
import FleetSelectionBar, { SELECTION_ACTIONS } from "../FleetSelectionBar";
import FleetTableFooter from "../FleetTableFooter";
import VehicleRow, { VEHICLE_COLUMNS } from "../rows/VehicleRow";
import FleetMap from "../FleetMap";
import { ageToLabel } from "../atoms/LocationAge";
import { useTranslation } from "@/context/LanguageContext";

const SEGMENTS = ["All", "Active", "In Maintenance", "Out of Service", "Idle"];

const VEHICLE_SEGMENT_KEYS = {
  All: "redesign.segments.all",
  Active: "redesign.segments.active",
  "In Maintenance": "redesign.segments.inMaintenance",
  "Out of Service": "redesign.segments.outOfService",
  Idle: "redesign.segments.idle",
};

export default function VehiclesTab({
  vehicles = [],
  loading,
  url,
  onOpenRow,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onBulkArchiveVehicles,
  onBulkExport,
  filterChip,
  eldConnected,
  eldLastSync,
  canAccessMap = true,
}) {
  const { t } = useTranslation("fleet");
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const filtered = useMemo(() => {
    let rows = vehicles.slice();

    if (url.status && url.status !== "All") {
      rows = rows.filter((v) => v.status === url.status);
    }

    if (filterChip === "in-motion") rows = rows.filter((v) => v.location.moving);
    if (filterChip === "faults") rows = rows.filter((v) => v.health.kind !== "healthy");

    if (url.q) {
      const q = url.q.toLowerCase();
      rows = rows.filter(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.plate?.toLowerCase().includes(q) ||
          v.vin?.toLowerCase().includes(q) ||
          v.mmy?.toLowerCase().includes(q) ||
          v.driver?.toLowerCase().includes(q)
      );
    }

    rows.sort((a, b) => {
      let av, bv;
      switch (sortKey) {
        case "name":
          av = a.name || "";
          bv = b.name || "";
          break;
        case "health":
          av = healthRank(a.health.kind);
          bv = healthRank(b.health.kind);
          break;
        case "odo":
          av = a.odo ?? 0;
          bv = b.odo ?? 0;
          break;
        case "nextMaint":
          av = a.nextMaint ?? Infinity;
          bv = b.nextMaint ?? Infinity;
          break;
        default:
          av = "";
          bv = "";
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [vehicles, url.status, url.q, filterChip, sortKey, sortDir]);

  const segmentCounts = useMemo(() => {
    const out = { All: vehicles.length };
    SEGMENTS.slice(1).forEach((s) => {
      out[s] = vehicles.filter((v) => v.status === s).length;
    });
    return out;
  }, [vehicles]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const dense = url.density === "compact";

  const allSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const someSelected = pageRows.some((r) => selected.has(r.id));

  const toggleAll = (checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      pageRows.forEach((r) => (checked ? next.add(r.id) : next.delete(r.id)));
      return next;
    });
  };
  const toggleOne = (id, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleSort = (k) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const empty =
    !loading && vehicles.length === 0
      ? <FleetEmptyState entity="vehicles" kind="empty" onPrimary={onAddVehicle} onSecondary={() => {}} />
      : !loading && total === 0
      ? <FleetEmptyState
          entity="vehicles"
          kind="noresults"
          filtersSummary={[
            url.q && `“${url.q}”`,
            url.status && url.status !== "All" && `Status: ${url.status}`,
            filterChip && `Chip: ${filterChip}`,
          ]
            .filter(Boolean)
            .join(" · ")}
          onClearFilters={() => {
            url.setSearch("");
            url.setStatus("All");
            url.setFilterChip(null);
          }}
        />
      : null;

  const selectedVehicles = useMemo(
    () => filtered.filter((v) => selected.has(v.id)),
    [filtered, selected]
  );

  const showSelection = selected.size > 0;
  const bulkActions = SELECTION_ACTIONS.vehicles({
    onExport: selectedVehicles.length
      ? () => onBulkExport?.({ kind: "vehicle", items: selectedVehicles })
      : undefined,
    onArchive: selectedVehicles.length
      ? () => {
          onBulkArchiveVehicles?.(selectedVehicles);
          setSelected(new Set());
        }
      : undefined,
    // Edit status & Assign driver are not yet wired — left undefined so the
    // bar hides them rather than rendering dead buttons.
  });

  const lastUpdated = eldLastSync
    ? ageToLabel(Math.max(0, Math.round((Date.now() - new Date(eldLastSync).getTime()) / 60000))) + " ago"
    : null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {showSelection ? (
        <FleetSelectionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          actions={bulkActions}
        />
      ) : (
        <FleetFilterBar
          segments={SEGMENTS}
          segmentLabel={(s) => t(VEHICLE_SEGMENT_KEYS[s] || "", s)}
          activeSegment={url.status || "All"}
          segmentCounts={segmentCounts}
          q={url.q}
          onSearch={url.setSearch}
          onSegment={url.setStatus}
          density={url.density}
          onDensity={url.setDensity}
          filterCount={filterChip ? 1 : 0}
          mapToggle={canAccessMap ? { on: url.mapOn, onToggle: url.toggleMap } : null}
        />
      )}

      {canAccessMap && url.mapOn && (
        <FleetMap
          vehicles={pageRows}
          selectedId={url.row}
          onPin={onOpenRow}
          lastUpdatedLabel={lastUpdated}
          height={320}
        />
      )}

      <FleetTable
        columns={VEHICLE_COLUMNS}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        allSelected={allSelected}
        someSelected={someSelected && !allSelected}
        onSelectAll={toggleAll}
        loading={loading}
        skeleton={<FleetSkeletonTable rows={8} columns={VEHICLE_COLUMNS} />}
        empty={empty}
      >
        {pageRows.map((v) => (
          <VehicleRow
            key={v.id}
            v={v}
            dense={dense}
            isSelected={selected.has(v.id)}
            onSelect={(checked) => toggleOne(v.id, checked)}
            onClick={() => onOpenRow?.(v.id)}
            onOpen={(veh) => onOpenRow?.(veh.id)}
            onEdit={(veh) => onEditVehicle?.(veh)}
            onDelete={(veh) => onDeleteVehicle?.(veh)}
          />
        ))}
      </FleetTable>

      <FleetTableFooter
        count={pageRows.length}
        total={total}
        page={page}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={(s) => {
          setPageSize(s);
          setPage(1);
        }}
      />
    </div>
  );
}

function healthRank(k) {
  return k === "critical" ? 0 : k === "warning" ? 1 : 2;
}
