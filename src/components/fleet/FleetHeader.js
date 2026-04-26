"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Download, Truck, ChevronDown } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Fleet hero header — blue gradient card with eyebrow + title + subtitle +
 * action cluster. Visually consistent with the Mileage / IFTA / other dashboard
 * pages so the redesigned fleet page feels like the same product.
 */
export default function FleetHeader({ onAddDriver, onAddVehicle, onAddMaintenance, onExport }) {
  const { t } = useTranslation("fleet");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="mb-6 relative">
      {/* Gradient + decorative layers are clipped to the rounded card so they
          don't bleed onto the page; the action cluster lives outside this
          clip so its dropdown can extend past the card. */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-white/50 to-emerald-300/70" />
      </div>

      <div className="relative p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-white">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-2.5 rounded-xl">
            <Truck size={28} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100 dark:text-blue-200 mb-1">
              {t("hero.eyebrow", "Operations")}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {t("title", "Fleet")}
            </h1>
            <p className="text-blue-100 dark:text-blue-200 text-sm md:text-base mt-1 max-w-xl">
              {t("hero.subtitle", "Drivers, vehicles, and maintenance — one page.")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onExport}
            className="h-10 px-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            <span>{t("hero.export", "Export")}</span>
          </button>

          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="h-10 pl-3 pr-2.5 bg-white text-blue-600 rounded-xl shadow-md flex items-center gap-2 text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              <Plus size={16} strokeWidth={2.5} />
              {t("hero.add", "Add")}
              <ChevronDown size={13} className="text-blue-400" />
            </button>
            {open && (
              <div className="absolute right-0 top-12 z-30 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1.5 text-[13px]">
                <MenuItem
                  onClick={() => { setOpen(false); onAddDriver?.(); }}
                  label={t("drivers.addDriver", "Add driver")}
                  hint={t("hero.addDriverHint", "Tracks license & medical")}
                />
                <MenuItem
                  onClick={() => { setOpen(false); onAddVehicle?.(); }}
                  label={t("vehicles.addVehicle", "Add vehicle")}
                  hint={t("hero.addVehicleHint", "Tracks compliance & mileage")}
                />
                <MenuItem
                  onClick={() => { setOpen(false); onAddMaintenance?.(); }}
                  label={t("maintenance.scheduleMaintenance", "Schedule maintenance")}
                  hint={t("hero.addMaintHint", "Plan a service")}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ label, hint, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex flex-col gap-0.5 transition-colors"
    >
      <span className="font-semibold text-gray-900 dark:text-gray-100">{label}</span>
      <span className="text-[11.5px] text-gray-500 dark:text-gray-400">{hint}</span>
    </button>
  );
}
