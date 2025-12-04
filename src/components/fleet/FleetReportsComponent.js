"use client";

import { useState, useEffect } from "react";
import {
  Download,
  BarChart2,
  FileCog,
  AlertTriangle,
  FileText,
  ArrowRight,
  Calendar,
  RefreshCw,
  Check
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fetchTrucks, getTruckStats } from "@/lib/services/truckService";
import { fetchDrivers, getDriverStats, checkDriverDocumentStatus } from "@/lib/services/driverService";
import { fetchMaintenanceRecords, getUpcomingMaintenance, getOverdueMaintenance } from "@/lib/services/maintenanceService";

// Storage key for last generated timestamps
const REPORT_TIMESTAMPS_KEY = "fleet_report_timestamps";

// Get stored timestamps from localStorage
function getStoredTimestamps() {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(REPORT_TIMESTAMPS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save timestamp to localStorage
function saveTimestamp(reportType) {
  if (typeof window === "undefined") return;
  try {
    const timestamps = getStoredTimestamps();
    timestamps[reportType] = new Date().toISOString();
    localStorage.setItem(REPORT_TIMESTAMPS_KEY, JSON.stringify(timestamps));
  } catch {
    // Ignore storage errors
  }
}

// Format timestamp for display
function formatTimestamp(isoString) {
  if (!isoString) return "Never";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export default function FleetReportsComponent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState({
    summary: false,
    maintenance: false,
    documents: false,
    export: false
  });
  const [success, setSuccess] = useState({
    summary: false,
    maintenance: false,
    documents: false,
    export: false
  });
  const [timestamps, setTimestamps] = useState({});

  // Load user and timestamps on mount
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setTimestamps(getStoredTimestamps());
    }
    init();
  }, []);

  // Clear success state after animation
  const showSuccess = (type) => {
    setSuccess(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setSuccess(prev => ({ ...prev, [type]: false }));
    }, 2000);
  };

  // Generate Fleet Summary Report PDF
  const generateFleetSummaryReport = async () => {
    if (!user) return;

    setLoading(prev => ({ ...prev, summary: true }));

    try {
      // Fetch all data
      const [trucks, drivers, truckStats, driverStats] = await Promise.all([
        fetchTrucks(user.id),
        fetchDrivers(user.id),
        getTruckStats(user.id),
        getDriverStats(user.id)
      ]);

      // Dynamically import jsPDF
      const [jsPDFModule, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable")
      ]);
      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Header
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.text("Fleet Summary Report", 14, 20);

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

      // Fleet Statistics Section
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.setFont(undefined, "bold");
      doc.text("Fleet Statistics", 14, 42);

      // Stats boxes
      const statsY = 48;
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");

      // Vehicle stats
      doc.text(`Total Vehicles: ${truckStats.total}`, 14, statsY);
      doc.text(`Active: ${truckStats.active}`, 14, statsY + 5);
      doc.text(`In Maintenance: ${truckStats.maintenance}`, 14, statsY + 10);
      doc.text(`Out of Service: ${truckStats.outOfService}`, 14, statsY + 15);

      // Driver stats
      doc.text(`Total Drivers: ${driverStats.total}`, 100, statsY);
      doc.text(`Active: ${driverStats.active}`, 100, statsY + 5);
      doc.text(`Inactive: ${driverStats.inactive}`, 100, statsY + 10);
      doc.text(`Expiring Docs: ${driverStats.expiringLicense + driverStats.expiringMedical}`, 100, statsY + 15);

      // Vehicles Table
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Vehicles", 14, 78);

      const vehicleRows = trucks.map(truck => [
        truck.name || "-",
        `${truck.year || ""} ${truck.make || ""} ${truck.model || ""}`.trim() || "-",
        truck.vin || "-",
        truck.license_plate || "-",
        truck.status || "-"
      ]);

      autoTable(doc, {
        startY: 82,
        head: [["Name", "Vehicle", "VIN", "License Plate", "Status"]],
        body: vehicleRows,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 50 },
          2: { cellWidth: 40 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 }
        }
      });

      // Drivers Table
      const driversStartY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Drivers", 14, driversStartY);

      const driverRows = drivers.map(driver => {
        const docStatus = checkDriverDocumentStatus(driver);
        return [
          driver.name || "-",
          driver.position || "-",
          driver.phone || "-",
          driver.license_number || "-",
          driver.status || "-"
        ];
      });

      autoTable(doc, {
        startY: driversStartY + 4,
        head: [["Name", "Position", "Phone", "License #", "Status"]],
        body: driverRows,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 9 }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Fleet Summary Report | Page ${i} of ${pageCount} | Truck Command`,
          105, 287, { align: "center" }
        );
      }

      // Save PDF
      doc.save(`Fleet_Summary_Report_${new Date().toISOString().split("T")[0]}.pdf`);

      // Update timestamp
      saveTimestamp("summary");
      setTimestamps(getStoredTimestamps());
      showSuccess("summary");
    } catch (error) {
      console.error("Error generating fleet summary report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, summary: false }));
    }
  };

  // Generate Maintenance Schedule Report PDF
  const generateMaintenanceReport = async () => {
    if (!user) return;

    setLoading(prev => ({ ...prev, maintenance: true }));

    try {
      // Fetch maintenance data
      const [upcomingMaint, overdueMaint, allMaint] = await Promise.all([
        getUpcomingMaintenance(user.id, 90),
        getOverdueMaintenance(user.id),
        fetchMaintenanceRecords(user.id)
      ]);

      const [jsPDFModule, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable")
      ]);
      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Header
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.text("Maintenance Schedule Report", 14, 20);

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

      // Summary Stats
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont(undefined, "bold");
      doc.text("Summary", 14, 42);

      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(`Overdue Items: ${overdueMaint.length}`, 14, 50);
      doc.text(`Upcoming (90 days): ${upcomingMaint.length}`, 14, 56);
      doc.text(`Total Records: ${allMaint.length}`, 14, 62);

      // Overdue Section (if any)
      let currentY = 75;

      if (overdueMaint.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.setTextColor(220, 38, 38); // Red
        doc.text("OVERDUE MAINTENANCE", 14, currentY);
        doc.setTextColor(0);

        const overdueRows = overdueMaint.map(record => [
          record.trucks?.name || "-",
          record.type || "-",
          new Date(record.due_date).toLocaleDateString(),
          record.status || "-",
          record.notes || "-"
        ]);

        autoTable(doc, {
          startY: currentY + 4,
          head: [["Vehicle", "Type", "Due Date", "Status", "Notes"]],
          body: overdueRows,
          theme: "striped",
          headStyles: { fillColor: [220, 38, 38], textColor: 255 },
          styles: { fontSize: 9 }
        });

        currentY = doc.lastAutoTable.finalY + 15;
      }

      // Upcoming Maintenance
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0);
      doc.text("Upcoming Maintenance (Next 90 Days)", 14, currentY);

      if (upcomingMaint.length > 0) {
        const upcomingRows = upcomingMaint.map(record => {
          const dueDate = new Date(record.due_date);
          const today = new Date();
          const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

          return [
            record.trucks?.name || "-",
            record.type || "-",
            dueDate.toLocaleDateString(),
            `${daysUntil} days`,
            record.status || "-"
          ];
        });

        autoTable(doc, {
          startY: currentY + 4,
          head: [["Vehicle", "Type", "Due Date", "Days Until", "Status"]],
          body: upcomingRows,
          theme: "striped",
          headStyles: { fillColor: [249, 115, 22], textColor: 255 },
          styles: { fontSize: 9 }
        });
      } else {
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.text("No upcoming maintenance scheduled.", 14, currentY + 8);
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Maintenance Schedule Report | Page ${i} of ${pageCount} | Truck Command`,
          105, 287, { align: "center" }
        );
      }

      doc.save(`Maintenance_Schedule_${new Date().toISOString().split("T")[0]}.pdf`);

      saveTimestamp("maintenance");
      setTimestamps(getStoredTimestamps());
      showSuccess("maintenance");
    } catch (error) {
      console.error("Error generating maintenance report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, maintenance: false }));
    }
  };

  // Generate Document Expiration Report PDF
  const generateDocumentExpirationReport = async () => {
    if (!user) return;

    setLoading(prev => ({ ...prev, documents: true }));

    try {
      const drivers = await fetchDrivers(user.id);

      const [jsPDFModule, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable")
      ]);
      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Header
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.text("Document Expiration Report", 14, 20);

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

      // Process driver documents
      const now = new Date();
      const expiringDocuments = [];
      const expiredDocuments = [];

      drivers.forEach(driver => {
        const licenseExpiry = new Date(driver.license_expiry);
        const medicalExpiry = new Date(driver.medical_card_expiry);

        const licenseDays = Math.floor((licenseExpiry - now) / (1000 * 60 * 60 * 24));
        const medicalDays = Math.floor((medicalExpiry - now) / (1000 * 60 * 60 * 24));

        // License
        if (licenseDays < 0) {
          expiredDocuments.push({
            driver: driver.name,
            document: "CDL License",
            expiry: driver.license_expiry,
            days: licenseDays,
            state: driver.license_state
          });
        } else if (licenseDays <= 90) {
          expiringDocuments.push({
            driver: driver.name,
            document: "CDL License",
            expiry: driver.license_expiry,
            days: licenseDays,
            state: driver.license_state
          });
        }

        // Medical Card
        if (medicalDays < 0) {
          expiredDocuments.push({
            driver: driver.name,
            document: "Medical Card",
            expiry: driver.medical_card_expiry,
            days: medicalDays,
            state: "-"
          });
        } else if (medicalDays <= 90) {
          expiringDocuments.push({
            driver: driver.name,
            document: "Medical Card",
            expiry: driver.medical_card_expiry,
            days: medicalDays,
            state: "-"
          });
        }
      });

      // Sort by days remaining
      expiredDocuments.sort((a, b) => a.days - b.days);
      expiringDocuments.sort((a, b) => a.days - b.days);

      // Summary
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont(undefined, "bold");
      doc.text("Summary", 14, 42);

      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.text(`Expired Documents: ${expiredDocuments.length}`, 14, 50);
      doc.text(`Expiring in 90 Days: ${expiringDocuments.length}`, 14, 56);
      doc.text(`Total Drivers: ${drivers.length}`, 14, 62);

      let currentY = 75;

      // Expired Documents Section
      if (expiredDocuments.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.setTextColor(220, 38, 38);
        doc.text("EXPIRED DOCUMENTS", 14, currentY);
        doc.setTextColor(0);

        const expiredRows = expiredDocuments.map(item => [
          item.driver,
          item.document,
          new Date(item.expiry).toLocaleDateString(),
          `${Math.abs(item.days)} days ago`,
          "EXPIRED"
        ]);

        autoTable(doc, {
          startY: currentY + 4,
          head: [["Driver", "Document", "Expired On", "Days Overdue", "Status"]],
          body: expiredRows,
          theme: "striped",
          headStyles: { fillColor: [220, 38, 38], textColor: 255 },
          styles: { fontSize: 9 }
        });

        currentY = doc.lastAutoTable.finalY + 15;
      }

      // Expiring Documents Section
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0);
      doc.text("Documents Expiring Within 90 Days", 14, currentY);

      if (expiringDocuments.length > 0) {
        const expiringRows = expiringDocuments.map(d => {
          let urgency = "Low";
          if (d.days <= 14) urgency = "Critical";
          else if (d.days <= 30) urgency = "High";
          else if (d.days <= 60) urgency = "Medium";

          return [
            d.driver,
            d.document,
            new Date(d.expiry).toLocaleDateString(),
            `${d.days} days`,
            urgency
          ];
        });

        autoTable(doc, {
          startY: currentY + 4,
          head: [["Driver", "Document", "Expiry Date", "Days Left", "Urgency"]],
          body: expiringRows,
          theme: "striped",
          headStyles: { fillColor: [249, 115, 22], textColor: 255 },
          styles: { fontSize: 9 },
          didDrawCell: (data) => {
            // Color code urgency column
            if (data.section === "body" && data.column.index === 4) {
              const urgency = data.cell.raw;
              if (urgency === "Critical") {
                doc.setTextColor(220, 38, 38);
              } else if (urgency === "High") {
                doc.setTextColor(249, 115, 22);
              }
            }
          }
        });
      } else {
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.text("No documents expiring in the next 90 days.", 14, currentY + 8);
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Document Expiration Report | Page ${i} of ${pageCount} | Truck Command`,
          105, 287, { align: "center" }
        );
      }

      doc.save(`Document_Expiration_Report_${new Date().toISOString().split("T")[0]}.pdf`);

      saveTimestamp("documents");
      setTimestamps(getStoredTimestamps());
      showSuccess("documents");
    } catch (error) {
      console.error("Error generating document expiration report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, documents: false }));
    }
  };

  // Helper to escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Helper to format phone number
  const formatPhone = (phone) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Helper to format currency
  const formatCurrency = (amount) => {
    if (!amount) return "";
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Export all fleet data to CSV
  const exportFleetData = async () => {
    if (!user) return;

    setLoading(prev => ({ ...prev, export: true }));

    try {
      // Fetch all data including user profile
      const [trucks, drivers, maintenance, truckStats, driverStats, profileResult] = await Promise.all([
        fetchTrucks(user.id),
        fetchDrivers(user.id),
        fetchMaintenanceRecords(user.id),
        getTruckStats(user.id),
        getDriverStats(user.id),
        supabase.from("users").select("*").eq("id", user.id).single()
      ]);

      const profile = profileResult.data || {};

      // Calculate additional stats
      const now = new Date();
      const activeDrivers = drivers.filter(d => d.status === "Active").length;
      const activeTrucks = trucks.filter(t => t.status === "Active").length;
      const pendingMaintenance = maintenance.filter(m => m.status !== "Completed").length;
      const overdueMaintenance = maintenance.filter(m => {
        if (m.status === "Completed") return false;
        return new Date(m.due_date) < now;
      }).length;
      const totalMaintenanceCost = maintenance
        .filter(m => m.status === "Completed" && m.cost)
        .reduce((sum, m) => sum + parseFloat(m.cost || 0), 0);

      // Calculate expiring documents
      const expiringDocs = drivers.reduce((count, driver) => {
        const licenseExpiry = new Date(driver.license_expiry);
        const medicalExpiry = new Date(driver.medical_card_expiry);
        const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (licenseExpiry <= thirtyDays && licenseExpiry >= now) count++;
        if (medicalExpiry <= thirtyDays && medicalExpiry >= now) count++;
        return count;
      }, 0);

      // Build CSV content
      let lines = [];

      // ============================================
      // HEADER SECTION - Business Information
      // ============================================
      lines.push("═══════════════════════════════════════════════════════════════════════════════");
      lines.push("                           FLEET DATA EXPORT REPORT                            ");
      lines.push("═══════════════════════════════════════════════════════════════════════════════");
      lines.push("");

      // Business Information
      lines.push("BUSINESS INFORMATION");
      lines.push("───────────────────────────────────────────────────────────────────────────────");
      if (profile.company_name) {
        lines.push(`Company Name:,${escapeCSV(profile.company_name)}`);
      }
      if (profile.full_name) {
        lines.push(`Owner/Manager:,${escapeCSV(profile.full_name)}`);
      }
      if (profile.address || profile.city || profile.state || profile.zip) {
        const address = [profile.address, profile.city, profile.state, profile.zip].filter(Boolean).join(", ");
        lines.push(`Address:,${escapeCSV(address)}`);
      }
      if (profile.phone) {
        lines.push(`Phone:,${escapeCSV(formatPhone(profile.phone))}`);
      }
      if (profile.email || user.email) {
        lines.push(`Email:,${escapeCSV(profile.email || user.email)}`);
      }
      lines.push("");
      lines.push(`Report Generated:,${escapeCSV(new Date().toLocaleString())}`);
      lines.push("");
      lines.push("");

      // ============================================
      // FLEET SUMMARY STATISTICS
      // ============================================
      lines.push("FLEET SUMMARY STATISTICS");
      lines.push("───────────────────────────────────────────────────────────────────────────────");
      lines.push("");
      lines.push("Category,Count,Details");
      lines.push(`Total Vehicles,${truckStats.total},${activeTrucks} active`);
      lines.push(`Active Vehicles,${truckStats.active},Ready for dispatch`);
      lines.push(`In Maintenance,${truckStats.maintenance},Currently being serviced`);
      lines.push(`Out of Service,${truckStats.outOfService},Not operational`);
      lines.push("");
      lines.push(`Total Drivers,${driverStats.total},${activeDrivers} active`);
      lines.push(`Active Drivers,${driverStats.active},Available for work`);
      lines.push(`Inactive Drivers,${driverStats.inactive},Not currently working`);
      lines.push(`Expiring Documents,${expiringDocs},Within next 30 days`);
      lines.push("");
      lines.push(`Maintenance Records,${maintenance.length},All time`);
      lines.push(`Pending Maintenance,${pendingMaintenance},Scheduled or in progress`);
      lines.push(`Overdue Maintenance,${overdueMaintenance},Past due date`);
      lines.push(`Total Maintenance Cost,${formatCurrency(totalMaintenanceCost)},Completed services`);
      lines.push("");
      lines.push("");

      // ============================================
      // VEHICLES SECTION
      // ============================================
      lines.push("═══════════════════════════════════════════════════════════════════════════════");
      lines.push("                              VEHICLE INVENTORY                                ");
      lines.push("═══════════════════════════════════════════════════════════════════════════════");
      lines.push("");
      lines.push("Vehicle Name,Year,Make,Model,Type,VIN,License Plate,Status,Fuel Type,Tank Capacity,MPG,Color,Notes");

      if (trucks.length > 0) {
        trucks.forEach(truck => {
          lines.push([
            escapeCSV(truck.name),
            escapeCSV(truck.year),
            escapeCSV(truck.make),
            escapeCSV(truck.model),
            escapeCSV(truck.type),
            escapeCSV(truck.vin),
            escapeCSV(truck.license_plate),
            escapeCSV(truck.status),
            escapeCSV(truck.fuel_type),
            escapeCSV(truck.tank_capacity ? `${truck.tank_capacity} gal` : ""),
            escapeCSV(truck.mpg),
            escapeCSV(truck.color),
            escapeCSV(truck.notes)
          ].join(","));
        });
      } else {
        lines.push("No vehicles found");
      }
      lines.push("");
      lines.push(`Total Vehicles: ${trucks.length}`);
      lines.push("");
      lines.push("");

      // ============================================
      // DRIVERS SECTION
      // ============================================
      lines.push("═══════════════════════════════════════════════════════════════════════════════");
      lines.push("                               DRIVER ROSTER                                   ");
      lines.push("═══════════════════════════════════════════════════════════════════════════════");
      lines.push("");
      lines.push("Driver Name,Position,Status,Phone,Email,License Number,License State,License Expiry,License Status,Medical Card Expiry,Medical Status,Hire Date,City,State,Emergency Contact,Emergency Phone");

      if (drivers.length > 0) {
        drivers.forEach(driver => {
          const licenseExpiry = new Date(driver.license_expiry);
          const medicalExpiry = new Date(driver.medical_card_expiry);
          const licenseDays = Math.floor((licenseExpiry - now) / (1000 * 60 * 60 * 24));
          const medicalDays = Math.floor((medicalExpiry - now) / (1000 * 60 * 60 * 24));

          let licenseStatus = "Valid";
          if (licenseDays < 0) licenseStatus = "EXPIRED";
          else if (licenseDays <= 30) licenseStatus = "Expiring Soon";

          let medicalStatus = "Valid";
          if (medicalDays < 0) medicalStatus = "EXPIRED";
          else if (medicalDays <= 30) medicalStatus = "Expiring Soon";

          lines.push([
            escapeCSV(driver.name),
            escapeCSV(driver.position),
            escapeCSV(driver.status),
            escapeCSV(formatPhone(driver.phone)),
            escapeCSV(driver.email),
            escapeCSV(driver.license_number),
            escapeCSV(driver.license_state),
            escapeCSV(formatDate(driver.license_expiry)),
            escapeCSV(licenseStatus),
            escapeCSV(formatDate(driver.medical_card_expiry)),
            escapeCSV(medicalStatus),
            escapeCSV(formatDate(driver.hire_date)),
            escapeCSV(driver.city),
            escapeCSV(driver.state),
            escapeCSV(driver.emergency_contact),
            escapeCSV(formatPhone(driver.emergency_phone))
          ].join(","));
        });
      } else {
        lines.push("No drivers found");
      }
      lines.push("");
      lines.push(`Total Drivers: ${drivers.length}`);
      lines.push("");
      lines.push("");

      // ============================================
      // MAINTENANCE RECORDS SECTION
      // ============================================
      lines.push("═══════════════════════════════════════════════════════════════════════════════");
      lines.push("                            MAINTENANCE RECORDS                                ");
      lines.push("═══════════════════════════════════════════════════════════════════════════════");
      lines.push("");
      lines.push("Vehicle,Maintenance Type,Status,Priority,Due Date,Days Until Due,Completed Date,Cost,Odometer,Service Provider,Invoice Number,Notes");

      if (maintenance.length > 0) {
        // Sort by due date
        const sortedMaintenance = [...maintenance].sort((a, b) => {
          if (a.status === "Completed" && b.status !== "Completed") return 1;
          if (a.status !== "Completed" && b.status === "Completed") return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        });

        sortedMaintenance.forEach(record => {
          const dueDate = new Date(record.due_date);
          const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

          let priority = "Normal";
          if (record.status !== "Completed") {
            if (daysUntil < 0) priority = "OVERDUE";
            else if (daysUntil <= 7) priority = "Urgent";
            else if (daysUntil <= 14) priority = "High";
          } else {
            priority = "Completed";
          }

          let daysDisplay = "";
          if (record.status !== "Completed") {
            if (daysUntil < 0) daysDisplay = `${Math.abs(daysUntil)} days overdue`;
            else if (daysUntil === 0) daysDisplay = "Due today";
            else daysDisplay = `${daysUntil} days`;
          }

          lines.push([
            escapeCSV(record.trucks?.name || "Unknown"),
            escapeCSV(record.type),
            escapeCSV(record.status),
            escapeCSV(priority),
            escapeCSV(formatDate(record.due_date)),
            escapeCSV(daysDisplay),
            escapeCSV(formatDate(record.completed_date)),
            escapeCSV(formatCurrency(record.cost)),
            escapeCSV(record.odometer_at_service ? `${record.odometer_at_service} mi` : ""),
            escapeCSV(record.service_provider),
            escapeCSV(record.invoice_number),
            escapeCSV(record.notes)
          ].join(","));
        });
      } else {
        lines.push("No maintenance records found");
      }
      lines.push("");
      lines.push(`Total Maintenance Records: ${maintenance.length}`);
      lines.push(`Total Maintenance Cost: ${formatCurrency(totalMaintenanceCost)}`);
      lines.push("");
      lines.push("");

      // ============================================
      // DOCUMENT EXPIRATION TRACKING
      // ============================================
      lines.push("═══════════════════════════════════════════════════════════════════════════════");
      lines.push("                         DOCUMENT EXPIRATION TRACKING                          ");
      lines.push("═══════════════════════════════════════════════════════════════════════════════");
      lines.push("");
      lines.push("Driver Name,Document Type,Expiry Date,Days Until Expiry,Status,Action Required");

      const docExpirations = [];
      drivers.forEach(driver => {
        const licenseExpiry = new Date(driver.license_expiry);
        const medicalExpiry = new Date(driver.medical_card_expiry);
        const licenseDays = Math.floor((licenseExpiry - now) / (1000 * 60 * 60 * 24));
        const medicalDays = Math.floor((medicalExpiry - now) / (1000 * 60 * 60 * 24));

        docExpirations.push({
          driver: driver.name,
          type: "CDL License",
          expiry: driver.license_expiry,
          days: licenseDays
        });

        docExpirations.push({
          driver: driver.name,
          type: "Medical Card",
          expiry: driver.medical_card_expiry,
          days: medicalDays
        });
      });

      // Sort by days until expiry
      docExpirations.sort((a, b) => a.days - b.days);

      docExpirations.forEach(doc => {
        let status = "Valid";
        let action = "None";

        if (doc.days < 0) {
          status = "EXPIRED";
          action = "Renew immediately";
        } else if (doc.days <= 14) {
          status = "Critical";
          action = "Renew urgently";
        } else if (doc.days <= 30) {
          status = "Warning";
          action = "Schedule renewal";
        } else if (doc.days <= 60) {
          status = "Upcoming";
          action = "Plan renewal";
        }

        let daysDisplay = "";
        if (doc.days < 0) daysDisplay = `${Math.abs(doc.days)} days ago`;
        else daysDisplay = `${doc.days} days`;

        lines.push([
          escapeCSV(doc.driver),
          escapeCSV(doc.type),
          escapeCSV(formatDate(doc.expiry)),
          escapeCSV(daysDisplay),
          escapeCSV(status),
          escapeCSV(action)
        ].join(","));
      });

      lines.push("");
      lines.push("");

      // ============================================
      // FOOTER
      // ============================================
      lines.push("═══════════════════════════════════════════════════════════════════════════════");
      lines.push("                              END OF REPORT                                    ");
      lines.push("═══════════════════════════════════════════════════════════════════════════════");
      lines.push("");
      lines.push(`Report generated by Truck Command Fleet Management System`);
      lines.push(`Generated on: ${new Date().toLocaleString()}`);
      if (profile.company_name) {
        lines.push(`Company: ${profile.company_name}`);
      }

      // Join all lines and create download
      const csvContent = lines.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const fileName = profile.company_name
        ? `${profile.company_name.replace(/[^a-z0-9]/gi, "_")}_Fleet_Export_${new Date().toISOString().split("T")[0]}.csv`
        : `Fleet_Data_Export_${new Date().toISOString().split("T")[0]}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      saveTimestamp("export");
      setTimestamps(getStoredTimestamps());
      showSuccess("export");
    } catch (error) {
      console.error("Error exporting fleet data:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <h3 className="font-medium text-gray-700 dark:text-gray-200 flex items-center">
          <FileText size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
          Fleet Reports
        </h3>
        <button
          onClick={exportFleetData}
          disabled={loading.export}
          className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading.export ? (
            <>
              <RefreshCw size={16} className="mr-1.5 animate-spin" />
              Exporting...
            </>
          ) : success.export ? (
            <>
              <Check size={16} className="mr-1.5" />
              Exported!
            </>
          ) : (
            <>
              <Download size={16} className="mr-1.5" />
              Export Fleet Data
            </>
          )}
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fleet Summary Report */}
          <div
            onClick={!loading.summary ? generateFleetSummaryReport : undefined}
            className={`border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md dark:hover:bg-gray-700/50 transition-all p-5 bg-white dark:bg-gray-800 ${loading.summary ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
          >
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-3">
              {loading.summary ? (
                <RefreshCw size={20} className="text-blue-600 dark:text-blue-400 animate-spin" />
              ) : success.summary ? (
                <Check size={20} className="text-green-600 dark:text-green-400" />
              ) : (
                <BarChart2 size={20} className="text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Fleet Summary Report</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Complete overview of all vehicles and drivers with current status.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Last: {formatTimestamp(timestamps.summary)}
              </span>
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Maintenance Schedule Report */}
          <div
            onClick={!loading.maintenance ? generateMaintenanceReport : undefined}
            className={`border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md dark:hover:bg-gray-700/50 transition-all p-5 bg-white dark:bg-gray-800 ${loading.maintenance ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
          >
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center mb-3">
              {loading.maintenance ? (
                <RefreshCw size={20} className="text-orange-600 dark:text-orange-400 animate-spin" />
              ) : success.maintenance ? (
                <Check size={20} className="text-green-600 dark:text-green-400" />
              ) : (
                <FileCog size={20} className="text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Maintenance Schedule</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Upcoming maintenance activities for all vehicles in your fleet.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Last: {formatTimestamp(timestamps.maintenance)}
              </span>
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Document Expiration Report */}
          <div
            onClick={!loading.documents ? generateDocumentExpirationReport : undefined}
            className={`border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md dark:hover:bg-gray-700/50 transition-all p-5 bg-white dark:bg-gray-800 ${loading.documents ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
          >
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-3">
              {loading.documents ? (
                <RefreshCw size={20} className="text-red-600 dark:text-red-400 animate-spin" />
              ) : success.documents ? (
                <Check size={20} className="text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              )}
            </div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Document Expiration Report</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">List of all documents expiring in the next 90 days.</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Last: {formatTimestamp(timestamps.documents)}
              </span>
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Report Schedule</h4>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex items-start">
            <Calendar size={18} className="text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200">Click any report card above to generate and download a PDF report instantly.</p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">Reports include the latest data from your fleet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
