"use client";

import { useMemo, useState } from "react";
import FleetTable from "../FleetTable";
import FleetSkeletonTable from "../FleetSkeletonTable";
import FleetEmptyState from "../FleetEmptyState";
import FleetFilterBar from "../FleetFilterBar";
import FleetSelectionBar, { SELECTION_ACTIONS } from "../FleetSelectionBar";
import FleetTableFooter from "../FleetTableFooter";
import DriverRow from "../rows/DriverRow";
import { useTranslation } from "@/context/LanguageContext";

const SEGMENTS = ["All", "Active", "On Leave", "Onboarding", "Suspended"];
const PAGE_SIZE_DEFAULT = 50;

const DRIVER_SEGMENT_KEYS = {
  All: "redesign.segments.all",
  Active: "redesign.segments.active",
  "On Leave": "redesign.segments.onLeave",
  Onboarding: "redesign.segments.onboarding",
  Suspended: "redesign.segments.suspended",
};

/**
 * Drivers tab — wraps the filter bar, table, and footer for drivers.
 */
export default function DriversTab({
  drivers = [],
  loading,
  url,
  onOpenRow,
  onAddDriver,
  onEditDriver,
  onDeleteDriver,
  onBulkArchiveDrivers,
  onBulkExport,
  filterChip,
}) {
  const { t } = useTranslation("fleet");
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const filtered = useMemo(() => {
    let rows = drivers.slice();

    if (url.status && url.status !== "All") {
      rows = rows.filter((d) => d.status === url.status);
    }

    if (filterChip === "driving") rows = rows.filter((d) => d.hos.duty === "Driving");
    if (filterChip === "on-duty") rows = rows.filter((d) => d.hos.duty === "On Duty");
    if (filterChip === "hos-violations") rows = rows.filter((d) => d.hos.stale);

    if (url.q) {
      const q = url.q.toLowerCase();
      rows = rows.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.email?.toLowerCase().includes(q) ||
          d.phone?.toLowerCase().includes(q) ||
          d.dot?.toLowerCase().includes(q) ||
          d.id?.toLowerCase().includes(q)
      );
    }

    rows.sort((a, b) => {
      let av, bv;
      switch (sortKey) {
        case "name":
          av = a.name || "";
          bv = b.name || "";
          break;
        case "license":
          av = a.license ?? Infinity;
          bv = b.license ?? Infinity;
          break;
        case "medical":
          av = a.medical ?? Infinity;
          bv = b.medical ?? Infinity;
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
  }, [drivers, url.status, url.q, filterChip, sortKey, sortDir]);

  const segmentCounts = useMemo(() => {
    const out = { All: drivers.length };
    SEGMENTS.slice(1).forEach((s) => {
      out[s] = drivers.filter((d) => d.status === s).length;
    });
    return out;
  }, [drivers]);

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

  const cols = useMemo(
    () =>
      dense
        ? [
            { key: "_avatar", label: "", w: 32, sortable: false },
            { key: "name", label: "Driver", sortable: true },
            { key: "hos", label: "HOS · Remaining", w: 200, sortable: true },
            { key: "truck", label: "Assigned vehicle", w: 220, sortable: false },
            { key: "_chips", label: "Lic · Med", w: 140, right: true, sortable: false },
            { key: "_more", label: "", w: 36, sortable: false },
          ]
        : [
            { key: "_avatar", label: "", w: 40, sortable: false },
            { key: "name", label: "Driver", sortable: true },
            { key: "_chips", label: "Lic · Med", w: 140, right: true, sortable: false },
            { key: "_more", label: "", w: 36, sortable: false },
          ],
    [dense]
  );

  const empty =
    !loading && drivers.length === 0
      ? <FleetEmptyState entity="drivers" kind="empty" onPrimary={onAddDriver} onSecondary={() => {}} />
      : !loading && total === 0
      ? <FleetEmptyState
          entity="drivers"
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

  const selectedDrivers = useMemo(
    () => filtered.filter((d) => selected.has(d.id)),
    [filtered, selected]
  );

  const showSelection = selected.size > 0;
  const bulkActions = SELECTION_ACTIONS.drivers({
    onExport: selectedDrivers.length
      ? () => onBulkExport?.({ kind: "driver", items: selectedDrivers })
      : undefined,
    onArchive: selectedDrivers.length
      ? () => {
          onBulkArchiveDrivers?.(selectedDrivers);
          setSelected(new Set());
        }
      : undefined,
    // Edit status / Assign / Notify left undefined — bar hides them.
  });

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
          segmentLabel={(s) => t(DRIVER_SEGMENT_KEYS[s] || "", s)}
          activeSegment={url.status || "All"}
          segmentCounts={segmentCounts}
          q={url.q}
          onSearch={url.setSearch}
          onSegment={url.setStatus}
          density={url.density}
          onDensity={url.setDensity}
          filterCount={filterChip ? 1 : 0}
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
        {pageRows.map((d) => (
          <DriverRow
            key={d.id}
            d={d}
            dense={dense}
            isSelected={selected.has(d.id)}
            onSelect={(checked) => toggleOne(d.id, checked)}
            onClick={() => onOpenRow?.(d.id)}
            onOpen={(driver) => onOpenRow?.(driver.id)}
            onEdit={(driver) => onEditDriver?.(driver)}
            onDelete={(driver) => onDeleteDriver?.(driver)}
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
