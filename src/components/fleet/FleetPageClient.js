"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";

import FleetHeader from "./FleetHeader";
import FleetStatusStrip from "./FleetStatusStrip";
import FleetActionQueueEmbedded from "./FleetActionQueueEmbedded";
import FleetTabs from "./FleetTabs";
import FleetDrawer from "./FleetDrawer";
import { Avatar, StatusPill, HosChip, HealthChip } from "./atoms";

import DriversTab from "./tabs/DriversTab";
import VehiclesTab from "./tabs/VehiclesTab";
import MaintenanceTab from "./tabs/MaintenanceTab";

import DriverDrawerBody from "./drawers/DriverDrawerBody";
import VehicleDrawerBody from "./drawers/VehicleDrawerBody";
import MaintenanceDrawerBody from "./drawers/MaintenanceDrawerBody";

import DriverFormModal from "./DriverFormModal";
import TruckFormModal from "./TruckFormModal";
import MaintenanceFormModal from "./MaintenanceFormModal";

import { useFleetUrlState, useFleetData, useActionQueue } from "./hooks";
import { completeMaintenanceRecord } from "@/lib/services/maintenanceService";
import { Truck } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

const DRIVER_TABS = ["Overview", "HOS", "Documents", "Activity", "Notes"];
const VEHICLE_TABS = ["Overview", "Health", "Location", "Maintenance", "Fuel"];
const MAINT_TABS = ["Overview", "Notes"];

/**
 * The single fleet page — header, status strip, embedded action queue,
 * tabs (drivers/vehicles/maintenance), drawer, and Add modals.
 *
 * State/data live in three hooks:
 *   useFleetUrlState  — tab/row/filters/search synced to ?query
 *   useFleetData      — all entities, normalized, polling every 60s
 *   useActionQueue    — derived list of attention items
 */
export default function FleetPageClient() {
  const { t } = useTranslation("fleet");
  const url = useFleetUrlState();
  const [user, setUser] = useState(null);
  const { canAccess } = useFeatureAccess();
  const canAccessMap = canAccess?.("eldGpsTracking") ?? true;

  // Modal state — { mode: 'add' | 'edit', kind: 'driver'|'vehicle'|'maintenance' } | null
  const [modal, setModal] = useState(null);
  const closeModal = () => setModal(null);
  const openAdd = (kind) => setModal({ mode: "add", kind });
  const openEdit = (kind) => setModal({ mode: "edit", kind });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      // DashboardLayout handles redirect to /login when user is null.
      setUser(error || !data?.user ? null : data.user);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { drivers, vehicles, maintenance, eld, loading, reload, liveCounts } =
    useFleetData(user?.id);

  const queue = useActionQueue({ drivers, vehicles, maintenance });

  const tabCounts = useMemo(
    () => ({
      drivers: drivers.length,
      vehicles: vehicles.length,
      maintenance: maintenance.filter(
        (m) => m.status !== "Completed" && m.status !== "Cancelled"
      ).length,
    }),
    [drivers, vehicles, maintenance]
  );

  const peers = useMemo(() => {
    if (url.tab === "drivers") return drivers.map((d) => d.id);
    if (url.tab === "vehicles") return vehicles.map((v) => v.id);
    if (url.tab === "maintenance") return maintenance.map((m) => m.id);
    return [];
  }, [url.tab, drivers, vehicles, maintenance]);

  const handleStatusPick = (it) => {
    if (it.target !== url.tab) url.setTab(it.target);
    url.setFilterChip(url.filterChip === it.key ? null : it.key);
  };

  const handleQueueClick = (item) => {
    const link = item?.link;
    if (!link) return;
    const tab =
      link.type === "driver"
        ? "drivers"
        : link.type === "vehicle"
        ? "vehicles"
        : "maintenance";
    url.update({ tab, row: link.id, filter: null, status: null });
  };

  // ─── Drawer payload ───────────────────────────────────────────
  const drawer = useMemo(() => {
    if (!url.row) return null;
    if (url.tab === "drivers") {
      const d = drivers.find((x) => x.id === url.row);
      if (!d) return null;
      return {
        kind: "drivers",
        title: d.name,
        subtitle: (
          <>
            <span className="font-mono">{d.id?.slice(0, 8)}</span>
            <span>·</span>
            <span>{d.cdl}</span>
            {d.dot && (
              <>
                <span>·</span>
                <span>License #{d.dot}</span>
              </>
            )}
            <StatusPill status={d.status} />
          </>
        ),
        avatar: <Avatar name={d.name} tone={d.avatar} size={44} src={d.imageUrl} />,
        headerExtra: (
          <>
            <HosChip duty={d.hos.duty} remaining={d.hos.remaining} stale={d.hos.stale} />
            {d.truck && (
              <span className="text-[12px] text-slate-600 dark:text-gray-400 inline-flex items-center gap-1">
                <Truck size={11} className="text-slate-400 dark:text-gray-500" />
                {d.truck}
              </span>
            )}
          </>
        ),
        tabs: DRIVER_TABS,
        body: (tab) => <DriverDrawerBody d={d} vehicles={vehicles} tab={tab} />,
      };
    }
    if (url.tab === "vehicles") {
      const v = vehicles.find((x) => x.id === url.row);
      if (!v) return null;
      return {
        kind: "vehicles",
        title: v.name,
        subtitle: (
          <>
            <span className="font-mono">{v.plate}</span>
            <span>·</span>
            <StatusPill status={v.status} />
          </>
        ),
        avatar: (
          <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
            <Truck size={22} className="text-slate-700 dark:text-gray-300" />
          </div>
        ),
        headerExtra: (
          <>
            <HealthChip health={v.health} />
            {v.driver && (
              <span className="text-[12px] text-slate-600 dark:text-gray-400">{v.driver}</span>
            )}
          </>
        ),
        tabs: VEHICLE_TABS,
        body: (tab) => <VehicleDrawerBody v={v} drivers={drivers} tab={tab} />,
      };
    }
    if (url.tab === "maintenance") {
      const m = maintenance.find((x) => x.id === url.row);
      if (!m) return null;
      const veh = vehicles.find((vv) => vv.id === m.vehicleId);
      return {
        kind: "maintenance",
        title: m.type,
        subtitle: (
          <>
            <span>{m.vehicle}</span>
            <span>·</span>
            <StatusPill status={m.status} />
          </>
        ),
        avatar: (
          <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
            <Truck size={22} className="text-slate-700 dark:text-gray-300" />
          </div>
        ),
        headerExtra: null,
        tabs: MAINT_TABS,
        body: (tab) => <MaintenanceDrawerBody m={m} vehicle={veh} tab={tab} />,
      };
    }
    return null;
  }, [url.tab, url.row, drivers, vehicles, maintenance]);

  // ─── Page ───
  const pageBody = (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <FleetHeader
          onAddDriver={() => openAdd("driver")}
          onAddVehicle={() => openAdd("vehicle")}
          onAddMaintenance={() => openAdd("maintenance")}
        />

        <div className="mb-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <FleetStatusStrip
            counts={liveCounts}
            onPick={handleStatusPick}
            activeFilter={url.filterChip}
            syncedAgo={
              eld.lastSync
                ? Math.round((Date.now() - new Date(eld.lastSync).getTime()) / 60000)
                : null
            }
            syncedLabel={
              eld.connected
                ? `${t("strip.syncedFrom", "Synced from")} ${eld.provider || "ELD"}`
                : t("strip.eldNotConnected", "ELD not connected")
            }
          />
        </div>

        <FleetActionQueueEmbedded items={queue} onItemClick={handleQueueClick} />

        <div
          className="mt-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          style={{ minHeight: "calc(100vh - 320px)" }}
        >
          <FleetTabs
            active={url.tab}
            counts={tabCounts}
            onChange={(t) => url.setTab(t)}
          />

          <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {url.tab === "drivers" && (
            <DriversTab
              drivers={drivers}
              loading={loading}
              url={url}
              filterChip={url.filterChip}
              onOpenRow={(id) => url.setRow(id)}
              onAddDriver={() => openAdd("driver")}
              onEditDriver={(d) => { url.setRow(d.id); openEdit("driver"); }}
            />
          )}
          {url.tab === "vehicles" && (
            <VehiclesTab
              vehicles={vehicles}
              loading={loading}
              url={url}
              filterChip={url.filterChip}
              eldConnected={eld.connected}
              eldLastSync={eld.lastSync}
              canAccessMap={canAccessMap}
              onOpenRow={(id) => url.setRow(id)}
              onAddVehicle={() => openAdd("vehicle")}
              onEditVehicle={(v) => { url.setRow(v.id); openEdit("vehicle"); }}
            />
          )}
          {url.tab === "maintenance" && (
            <MaintenanceTab
              maintenance={maintenance}
              loading={loading}
              url={url}
              onOpenRow={(id) => url.setRow(id)}
              onAddMaintenance={() => openAdd("maintenance")}
              onEditMaintenance={(m) => { url.setRow(m.id); openEdit("maintenance"); }}
              onMarkComplete={async (m) => {
                if (!m?.id) return;
                try {
                  await completeMaintenanceRecord(m.id, {
                    completed_date: new Date().toISOString().slice(0, 10),
                  }, true /* syncToExpense */);
                  reload();
                } catch (e) {
                  console.error("Failed to mark complete", e);
                }
              }}
            />
          )}
          </div>
        </div>
      </div>

      {drawer && (
        <FleetDrawer
          kind={drawer.kind}
          title={drawer.title}
          subtitle={drawer.subtitle}
          avatar={drawer.avatar}
          headerExtra={drawer.headerExtra}
          tabs={drawer.tabs}
          peers={peers}
          currentId={url.row}
          onNav={(id) => url.setRow(id)}
          onClose={() => url.closeRow()}
          onEdit={() => {
            if (drawer.kind === "drivers") openEdit("driver");
            if (drawer.kind === "vehicles") openEdit("vehicle");
            if (drawer.kind === "maintenance") openEdit("maintenance");
          }}
        >
          {(t) => drawer.body(t)}
        </FleetDrawer>
      )}

      {/* Add / Edit modals reuse existing form components. `mode === "edit"`
          pre-fills with the currently-selected drawer row; `mode === "add"`
          opens an empty form regardless of row selection. */}
      <DriverFormModal
        isOpen={modal?.kind === "driver"}
        onClose={closeModal}
        userId={user?.id}
        driver={
          modal?.kind === "driver" && modal?.mode === "edit" && url.row
            ? drivers.find((d) => d.id === url.row)?.raw
            : null
        }
        onSubmit={() => {
          closeModal();
          reload();
        }}
      />
      <TruckFormModal
        isOpen={modal?.kind === "vehicle"}
        onClose={closeModal}
        userId={user?.id}
        truck={
          modal?.kind === "vehicle" && modal?.mode === "edit" && url.row
            ? vehicles.find((v) => v.id === url.row)?.raw
            : null
        }
        drivers={drivers.map((d) => d.raw)}
        onSubmit={() => {
          closeModal();
          reload();
        }}
      />
      <MaintenanceFormModal
        isOpen={modal?.kind === "maintenance"}
        onClose={closeModal}
        userId={user?.id}
        record={
          modal?.kind === "maintenance" && modal?.mode === "edit" && url.row
            ? maintenance.find((m) => m.id === url.row)?.raw
            : null
        }
        trucks={vehicles.map((v) => v.raw)}
        onSubmit={() => {
          closeModal();
          reload();
        }}
      />
    </main>
  );

  return (
    <DashboardLayout activePage="fleet">
      {pageBody}
    </DashboardLayout>
  );
}
