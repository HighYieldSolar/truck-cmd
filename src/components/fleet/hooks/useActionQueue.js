"use client";

import { useMemo } from "react";
import { useTranslation } from "@/context/LanguageContext";

const SEV_RANK = { crit: 0, warn: 1, info: 2 };

/**
 * Aggregates fleet-side action items from drivers, vehicles, and maintenance.
 * Returns items sorted by severity, then age. Designed to drive the embedded
 * Action Queue card and the bell-icon slide-out.
 *
 *   crit  → expired docs, active critical faults, HOS feed stale
 *   warn  → ≤14d to expiry, warnings, overdue maintenance
 *   info  → ≤30d to expiry, completed sync notices
 */
export default function useActionQueue({ drivers = [], vehicles = [], maintenance = [] }) {
  const { t } = useTranslation("fleet");
  return useMemo(() => {
    const items = [];

    const tq = (k, fb, vars) => t(`actionQueue.${k}`, fb, vars);

    // Drivers — license / medical
    drivers.forEach((d) => {
      if (d.medical != null && d.medical < 0) {
        items.push({
          id: `med-${d.id}`,
          sev: "crit",
          icon: "alertTri",
          driver: d.name,
          driverId: d.id,
          title: tq("medExpired", "Medical certificate expired"),
          sub: tq("medExpiredSub", "{{days}}d ago · DOT non-compliant", { days: Math.abs(d.medical) }),
          action: tq("renew", "Renew"),
          link: { type: "driver", id: d.id },
        });
      } else if (d.medical != null && d.medical <= 14) {
        items.push({
          id: `med-${d.id}`,
          sev: d.medical <= 7 ? "crit" : "warn",
          icon: "fileText",
          driver: d.name,
          driverId: d.id,
          title: tq("medExpiresIn", "Medical certificate expires in {{days}}d", { days: d.medical }),
          sub: d.raw?.medical_card_expiry || "",
          action: tq("schedule", "Schedule"),
          link: { type: "driver", id: d.id },
        });
      }
      if (d.license != null && d.license < 0) {
        items.push({
          id: `lic-${d.id}`,
          sev: "crit",
          icon: "alertTri",
          driver: d.name,
          driverId: d.id,
          title: tq("cdlExpired", "CDL expired"),
          sub: tq("cdlExpiredSub", "{{days}}d ago — driver cannot operate", { days: Math.abs(d.license) }),
          action: tq("renew", "Renew"),
          link: { type: "driver", id: d.id },
        });
      } else if (d.license != null && d.license <= 14) {
        items.push({
          id: `lic-${d.id}`,
          sev: d.license <= 7 ? "crit" : "warn",
          icon: "shield",
          driver: d.name,
          driverId: d.id,
          title: tq("cdlRenewIn", "CDL renewal in {{days}}d", { days: d.license }),
          sub: d.licenseState
            ? tq("stateLicense", "{{state}} state license", { state: d.licenseState })
            : tq("driverLicense", "Driver license"),
          action: tq("schedule", "Schedule"),
          link: { type: "driver", id: d.id },
        });
      }
      if (d.connectedToEld && d.hos.stale) {
        items.push({
          id: `hos-stale-${d.id}`,
          sev: "warn",
          icon: "alert",
          driver: d.name,
          driverId: d.id,
          title: tq("hosStale", "HOS feed stale"),
          sub: tq("hosStaleSub", "ELD device may be offline"),
          action: tq("diagnose", "Diagnose"),
          link: { type: "driver", id: d.id },
        });
      }
    });

    // Vehicles — active critical faults, expiring docs, stale ELD location
    vehicles.forEach((v) => {
      if (v.health.kind === "critical" && (v.health.faults || []).length) {
        v.health.faults.slice(0, 1).forEach((f) => {
          items.push({
            id: `fault-${v.id}-${f.code}`,
            sev: "crit",
            icon: "alertTri",
            driver: v.driver || v.name,
            vehicleId: v.id,
            title: tq("activeFault", "Active fault — {{code}}", { code: f.code }),
            sub: `${v.name} · ${f.code_description || tq("criticalEngineCode", "Critical engine code")}`,
            action: tq("diagnose", "Diagnose"),
            link: { type: "vehicle", id: v.id },
          });
        });
      }
      [
        ["registration", tq("docRegistration", "Registration")],
        ["insurance", tq("docInsurance", "Insurance")],
        ["inspection", tq("docInspection", "DOT inspection")],
      ].forEach(([k, lbl]) => {
        const days = v[k];
        if (days == null) return;
        if (days < 0) {
          items.push({
            id: `${k}-${v.id}`,
            sev: "crit",
            icon: "alertTri",
            driver: v.name,
            vehicleId: v.id,
            title: tq("docExpired", "{{doc}} expired", { doc: lbl }),
            sub: tq("docExpiredSub", "{{days}}d ago — {{name}}", { days: Math.abs(days), name: v.name }),
            action: tq("renew", "Renew"),
            link: { type: "vehicle", id: v.id },
          });
        } else if (days <= 14) {
          items.push({
            id: `${k}-${v.id}`,
            sev: days <= 7 ? "crit" : "warn",
            icon: "fileText",
            driver: v.name,
            vehicleId: v.id,
            title: tq("docExpiresIn", "{{doc}} expires in {{days}}d", { doc: lbl, days }),
            sub: v.name,
            action: tq("renew", "Renew"),
            link: { type: "vehicle", id: v.id },
          });
        }
      });
      if (v.connectedToEld && v.location.ageMinutes != null && v.location.ageMinutes > 1440) {
        items.push({
          id: `gps-stale-${v.id}`,
          sev: "warn",
          icon: "alert",
          driver: v.name,
          vehicleId: v.id,
          title: tq("gpsOffline", "GPS feed offline"),
          sub: tq("gpsOfflineSub", "Last update {{age}} ago", { age: v.location.ageLabel }),
          action: tq("diagnose", "Diagnose"),
          link: { type: "vehicle", id: v.id },
        });
      }
    });

    // Maintenance — overdue and due-soon
    maintenance.forEach((m) => {
      if (m.status === "Completed" || m.status === "Cancelled") return;
      if (m.due == null) return;
      if (m.due < 0) {
        items.push({
          id: `maint-${m.id}`,
          sev: "warn",
          icon: "wrench",
          driver: m.vehicle,
          maintenanceId: m.id,
          title: tq("maintOverdue", "{{type}} overdue", { type: m.type }),
          sub: tq("maintOverdueSub", "{{days}}d past due · {{vehicle}}", { days: Math.abs(m.due), vehicle: m.vehicle }),
          action: tq("markComplete", "Mark complete"),
          link: { type: "maintenance", id: m.id },
        });
      } else if (m.due <= 7) {
        items.push({
          id: `maint-${m.id}`,
          sev: "info",
          icon: "wrench",
          driver: m.vehicle,
          maintenanceId: m.id,
          title: tq("maintDueIn", "{{type}} due in {{days}}d", { type: m.type, days: m.due }),
          sub: m.vehicle,
          action: tq("schedule", "Schedule"),
          link: { type: "maintenance", id: m.id },
        });
      }
    });

    items.sort((a, b) => {
      const r = SEV_RANK[a.sev] - SEV_RANK[b.sev];
      if (r) return r;
      return 0;
    });
    return items;
  }, [drivers, vehicles, maintenance, t]);
}
