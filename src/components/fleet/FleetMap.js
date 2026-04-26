"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Map as MapIcon, RotateCw, AlertCircle } from "lucide-react";

const STATUS_COLORS = {
  Active: { fill: "#10b981", ring: "rgba(16,185,129,0.30)" },
  "In Maintenance": { fill: "#f59e0b", ring: "rgba(245,158,11,0.30)" },
  Maintenance: { fill: "#f59e0b", ring: "rgba(245,158,11,0.30)" },
  "Out of service": { fill: "#f43f5e", ring: "rgba(244,63,94,0.30)" },
  "Out of Service": { fill: "#f43f5e", ring: "rgba(244,63,94,0.30)" },
  Idle: { fill: "#64748b", ring: "rgba(100,116,139,0.30)" },
};

/**
 * FleetMap — Mapbox GL JS map with status-colored pins for vehicles.
 * Falls back to an instructive placeholder if NEXT_PUBLIC_MAPBOX_TOKEN is not set.
 *
 * @param {object} props
 * @param {Array} props.vehicles — normalized fleet vehicles
 * @param {string} [props.selectedId]
 * @param {(id) => void} [props.onPin]
 * @param {() => void} [props.onRefresh]
 * @param {string} [props.lastUpdatedLabel]
 */
export default function FleetMap({
  vehicles = [],
  selectedId,
  onPin,
  onRefresh,
  lastUpdatedLabel,
  height = 320,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState(null);
  const [tokenMissing, setTokenMissing] = useState(false);

  const hasGeo = useMemo(
    () => vehicles.some((v) => v.location?.lat != null && v.location?.lng != null),
    [vehicles]
  );

  useEffect(() => {
    let cancelled = false;
    let mapboxgl;

    async function init() {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) {
        setTokenMissing(true);
        return;
      }
      try {
        mapboxgl = (await import("mapbox-gl")).default;
        await import("mapbox-gl/dist/mapbox-gl.css");
        if (cancelled) return;
        mapboxgl.accessToken = token;

        if (!containerRef.current) return;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [-98.5795, 39.8283], // continental US center
          zoom: 3.4,
          attributionControl: false,
          cooperativeGestures: true,
        });
        map.addControl(new mapboxgl.AttributionControl({ compact: true }));
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
        mapRef.current = map;

        map.on("load", () => {
          renderPins(map, vehicles, selectedId, onPin, mapboxgl);
        });
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load map");
      }
    }

    init();
    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Re-render pins when vehicles or selection changes
  useEffect(() => {
    let mapboxgl;
    async function update() {
      if (!mapRef.current) return;
      try {
        mapboxgl = (await import("mapbox-gl")).default;
      } catch {
        return;
      }
      renderPins(mapRef.current, vehicles, selectedId, onPin, mapboxgl);
    }
    update();
  }, [vehicles, selectedId, onPin]);

  function renderPins(map, list, selId, click, mapboxgl) {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    list.forEach((v) => {
      const lat = v.location?.lat;
      const lng = v.location?.lng;
      if (lat == null || lng == null) return;
      const c = STATUS_COLORS[v.status] || STATUS_COLORS.Idle;
      const moving = v.location.moving;
      const heading = v.location.heading || 0;
      const isSelected = v.id === selId;

      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `${v.name} pin`);
      el.style.cssText =
        `position: relative; width: 24px; height: 24px;
         display: flex; align-items: center; justify-content: center;
         background: transparent; border: 0; cursor: pointer;
         outline: ${isSelected ? "2px solid #0ea5e9" : "none"};
         outline-offset: 2px; border-radius: 999px;`;
      el.onclick = () => click?.(v.id);

      el.innerHTML = moving
        ? `<span style="position:absolute;inset:-6px;border-radius:999px;background:${c.ring};"></span>
           <svg width="20" height="20" viewBox="0 0 20 20"
             style="transform: rotate(${heading}deg); filter: drop-shadow(0 0 4px ${c.ring});">
             <path d="M 10 1 L 17 17 L 10 13 L 3 17 Z" fill="${c.fill}" stroke="#0f172a" stroke-width="1.5"/>
           </svg>`
        : `<span style="display:block;width:12px;height:12px;border-radius:6px;background:${c.fill};
            border:2px solid #0f172a;box-shadow:0 0 0 1px ${c.fill};"></span>`;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
      markersRef.current.push(marker);
    });

    if (selId) {
      const sel = list.find((x) => x.id === selId);
      if (sel?.location?.lat != null && sel?.location?.lng != null) {
        map.flyTo({ center: [sel.location.lng, sel.location.lat], zoom: Math.max(map.getZoom(), 5.5), duration: 600 });
      }
    } else if (markersRef.current.length > 1) {
      try {
        const bounds = new mapboxgl.LngLatBounds();
        list.forEach((v) => {
          if (v.location?.lng != null && v.location?.lat != null) {
            bounds.extend([v.location.lng, v.location.lat]);
          }
        });
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 6, duration: 0 });
      } catch {
        /* ignore */
      }
    }
  }

  // ── Render states ──
  if (tokenMissing) return <Placeholder reason="token-missing" height={height} />;
  if (error) return <Placeholder reason="error" message={error} height={height} />;
  if (!hasGeo) return <Placeholder reason="no-geo" height={height} />;

  const movingCount = vehicles.filter((v) => v.location?.moving).length;

  return (
    <div className="relative shrink-0 border-b border-slate-200" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0 bg-slate-900" />
      <div className="absolute top-3 right-4 flex items-center gap-2 px-2.5 py-1.5 bg-slate-900/85 border border-white/10 rounded-md text-[11.5px] text-slate-200">
        <MapIcon size={12} className="text-slate-400" />
        <span>
          <b className="text-white">{vehicles.length}</b> ·{" "}
          <span className="text-emerald-400">{movingCount} moving</span>
        </span>
      </div>
      <div className="absolute bottom-3 left-4 flex items-center gap-2 text-[11px] text-slate-300/80">
        <span>{lastUpdatedLabel ? `Updated ${lastUpdatedLabel}` : "—"}</span>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1 text-slate-200 hover:text-white"
        >
          <RotateCw size={11} /> Refresh
        </button>
      </div>
    </div>
  );
}

function Placeholder({ reason, message, height }) {
  return (
    <div
      className="relative flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-gray-700"
      style={{ height }}
    >
      {/* Subtle map-style grid that works on both themes */}
      <div
        className="absolute inset-0 opacity-60 dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative z-10 max-w-md text-center px-4">
        {reason === "token-missing" && (
          <>
            <MapIcon size={28} className="mx-auto mb-2 text-slate-400 dark:text-slate-500" />
            <div className="text-[15px] font-semibold text-slate-900 dark:text-white">Map unavailable</div>
            <div className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
              Add a Mapbox token to{" "}
              <code className="font-mono text-slate-700 dark:text-slate-300">.env.local</code> as{" "}
              <code className="font-mono text-slate-700 dark:text-slate-300">NEXT_PUBLIC_MAPBOX_TOKEN</code>{" "}
              to enable live vehicle tracking.
            </div>
          </>
        )}
        {reason === "no-geo" && (
          <>
            <AlertCircle size={26} className="mx-auto mb-2 text-amber-500 dark:text-amber-400" />
            <div className="text-[15px] font-semibold text-slate-900 dark:text-white">No GPS coordinates</div>
            <div className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
              Connect an ELD provider so vehicles report their location, then they'll appear here.
            </div>
          </>
        )}
        {reason === "error" && (
          <>
            <AlertCircle size={26} className="mx-auto mb-2 text-rose-500 dark:text-rose-400" />
            <div className="text-[15px] font-semibold text-slate-900 dark:text-white">Map error</div>
            <div className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">{message}</div>
          </>
        )}
      </div>
    </div>
  );
}
