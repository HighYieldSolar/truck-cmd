"use client";

import { useMemo, useState } from "react";
import FleetTable from "../FleetTable";
import FleetSkeletonTable from "../FleetSkeletonTable";
import FleetEmptyState from "../FleetEmptyState";
import FleetFilterBar from "../FleetFilterBar";
import FleetSelectionBar, { SELECTION_ACTIONS } from "../FleetSelectionBar";
import FleetTableFooter from "../FleetTableFooter";
import MaintenanceRow, {
  MAINTENANCE_COLUMNS_UPCOMING,
  MAINTENANCE_COLUMNS_HISTORY,
} from "../rows/MaintenanceRow";
import { useTranslation } from "@/context/LanguageContext";

const SEGMENTS_UPCOMING = ["All", "Pending", "Scheduled", "In Progress", "Overdue"];
const SEGMENTS_HISTORY = ["All", "Completed", "Cancelled"];

const MAINT_SEGMENT_KEYS = {
  All: "redesign.segments.all",
  Pending: "redesign.segments.pending",
  Scheduled: "redesign.segments.scheduled",
  "In Progress": "redesign.segments.inProgress",
  Overdue: "redesign.segments.overdue",
  Completed: "redesign.segments.completed",
  Cancelled: "redesign.segments.cancelled",
};

export default function MaintenanceTab({
  maintenance = [],
  loading,
  url,
  onOpenRow,
  onAddMaintenance,
  onEditMaintenance,
  onMarkComplete,
}) {
  const { t } = useTranslation("fleet");
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortKey, setSortKey] = useState("due");
  const [sortDir, setSortDir] = useState("asc");

  const isHistory = url.maint === "history";
  const SEGMENTS = isHistory ? SEGMENTS_HISTORY : SEGMENTS_UPCOMING;
  const cols = isHistory ? MAINTENANCE_COLUMNS_HISTORY : MAINTENANCE_COLUMNS_UPCOMING;

  const filtered = useMemo(() => {
    let rows = maintenance.slice();

    rows = rows.filter((m) =>
      isHistory
        ? m.status === "Completed" || m.status === "Cancelled"
        : m.status !== "Completed" && m.status !== "Cancelled"
    );

    if (url.status && url.status !== "All") {
      rows = rows.filter((m) => m.status === url.status);
    }

    if (url.q) {
      const q = url.q.toLowerCase();
      rows = rows.filter(
        (m) =>
          m.vehicle?.toLowerCase().includes(q) ||
          m.type?.toLowerCase().includes(q) ||
          m.provider?.toLowerCase().includes(q) ||
          m.invoiceNumber?.toLowerCase().includes(q)
      );
    }

    rows.sort((a, b) => {
      let av, bv;
      switch (sortKey) {
        case "vehicle":
          av = a.vehicle || "";
          bv = b.vehicle || "";
          break;
        case "type":
          av = a.type || "";
          bv = b.type || "";
          break;
        case "due":
          av = a.due ?? Infinity;
          bv = b.due ?? Infinity;
          break;
        case "completed":
          av = a.completed || "";
          bv = b.completed || "";
          break;
        case "cost":
          av = a.cost || 0;
          bv = b.cost || 0;
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
  }, [maintenance, isHistory, url.status, url.q, sortKey, sortDir]);

  const segmentCounts = useMemo(() => {
    const base = isHistory
      ? maintenance.filter((m) => m.status === "Completed" || m.status === "Cancelled")
      : maintenance.filter((m) => m.status !== "Completed" && m.status !== "Cancelled");
    const out = { All: base.length };
    SEGMENTS.slice(1).forEach((s) => {
      out[s] = base.filter((m) => m.status === s).length;
    });
    return out;
  }, [maintenance, isHistory, SEGMENTS]);

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
    !loading && maintenance.length === 0
      ? <FleetEmptyState entity="maintenance" kind="empty" onPrimary={onAddMaintenance} />
      : !loading && total === 0
      ? <FleetEmptyState
          entity="maintenance"
          kind="noresults"
          onClearFilters={() => {
            url.setSearch("");
            url.setStatus("All");
          }}
        />
      : null;

  const showSelection = selected.size > 0;
  const bulkActions = SELECTION_ACTIONS.maintenance({
    onMarkComplete: () => {},
    onAssignVendor: () => {},
    onExport: () => {},
    onArchive: () => {},
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-1 px-5 py-2 bg-white dark:bg-gray-800 border-b border-slate-100 dark:border-gray-700 shrink-0">
        <SubTabBtn active={!isHistory} onClick={() => url.setMaint("upcoming")} label={t("redesign.upcoming", "Upcoming")} />
        <SubTabBtn active={isHistory} onClick={() => url.setMaint("history")} label={t("redesign.history", "History")} />
        <div className="flex-1" />
      </div>

      {showSelection ? (
        <FleetSelectionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          actions={bulkActions}
        />
      ) : (
        <FleetFilterBar
          segments={SEGMENTS}
          segmentLabel={(s) => t(MAINT_SEGMENT_KEYS[s] || "", s)}
          activeSegment={url.status || "All"}
          segmentCounts={segmentCounts}
          q={url.q}
          onSearch={url.setSearch}
          onSegment={url.setStatus}
          density={url.density}
          onDensity={url.setDensity}
        />
      )}

      <FleetTable
        columns={cols}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        allSelected={allSelected}
        someSelected={someSelected && !allSelected}
        onSelectAll={toggleAll}
        loading={loading}
        skeleton={<FleetSkeletonTable rows={8} columns={cols} />}
        empty={empty}
      >
        {pageRows.map((m) => (
          <MaintenanceRow
            key={m.id}
            m={m}
            kind={isHistory ? "history" : "upcoming"}
            dense={dense}
            isSelected={selected.has(m.id)}
            onSelect={(checked) => toggleOne(m.id, checked)}
            onClick={() => onOpenRow?.(m.id)}
            onMarkComplete={onMarkComplete}
            onOpen={(rec) => onOpenRow?.(rec.id)}
            onEdit={(rec) => onEditMaintenance?.(rec)}
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

function SubTabBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center h-7 px-3 rounded-md text-[12.5px] font-medium tracking-tight transition ${
        active
          ? "bg-gray-100 dark:bg-gray-700 text-slate-900 dark:text-gray-100"
          : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100 hover:bg-slate-50 dark:hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  );
}
