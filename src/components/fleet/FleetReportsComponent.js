"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  FileDown,
  FileText,
  FileSpreadsheet,
  File,
  Printer,
  Check,
  X,
  RefreshCw,
  Truck,
  Users,
  Wrench,
  AlertTriangle,
  BarChart2
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { fetchTrucks, getTruckStats } from "@/lib/services/truckService";
import { fetchDrivers, getDriverStats, checkDriverDocumentStatus } from "@/lib/services/driverService";
import { fetchMaintenanceRecords, getUpcomingMaintenance, getOverdueMaintenance } from "@/lib/services/maintenanceService";

export default function FleetReportsComponent() {
  const [user, setUser] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    init();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BarChart2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Fleet Reports
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generate and export comprehensive fleet reports
            </p>
          </div>
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
        Export detailed reports about your fleet including vehicle inventory, driver roster,
        maintenance schedules, and document expiration tracking.
      </p>

      <button
        onClick={() => setShowExportModal(true)}
        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        <FileDown className="h-5 w-5 mr-2" />
        Export Fleet Report
      </button>

      {mounted && showExportModal && (
        <FleetExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          user={user}
        />
      )}
    </div>
  );
}

// Fleet Export Modal Component
function FleetExportModal({ isOpen, onClose, user }) {
  const [reportType, setReportType] = useState('summary');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportState, setExportState] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const reportTypes = [
    {
      value: 'summary',
      label: 'Fleet Summary',
      description: 'Overview of vehicles, drivers, and fleet statistics',
      icon: BarChart2
    },
    {
      value: 'maintenance',
      label: 'Maintenance Schedule',
      description: 'Upcoming and overdue maintenance items',
      icon: Wrench
    },
    {
      value: 'documents',
      label: 'Document Expiration',
      description: 'Driver license and medical card expiry tracking',
      icon: AlertTriangle
    },
    {
      value: 'full',
      label: 'Full Fleet Export',
      description: 'Complete data export with all fleet information',
      icon: FileDown
    }
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF Report', description: 'Professional format with branding', icon: FileText },
    { value: 'csv', label: 'Spreadsheet (CSV)', description: 'For Excel or Google Sheets', icon: FileSpreadsheet },
    { value: 'txt', label: 'Plain Text', description: 'Simple format for email', icon: File },
    { value: 'print', label: 'Print', description: 'Send to printer', icon: Printer }
  ];

  // Helper functions
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const formatPhone = (phone) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "";
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Generate Fleet Summary Report PDF
  const generateFleetSummaryPDF = async () => {
    const [trucks, drivers, truckStats, driverStats] = await Promise.all([
      fetchTrucks(user.id),
      fetchDrivers(user.id),
      getTruckStats(user.id),
      getDriverStats(user.id)
    ]);

    const [jsPDFModule, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable")
    ]);
    const jsPDF = jsPDFModule.default;
    const autoTable = autoTableModule.default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const brandBlue = [37, 99, 235];
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Header
    doc.setFillColor(...brandBlue);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('FLEET SUMMARY REPORT', pageWidth / 2, 14, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

    // Statistics Section
    let yPos = 40;
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Fleet Statistics', margin, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Vehicles: ${truckStats.total} (${truckStats.active} active)`, margin, yPos);
    doc.text(`Total Drivers: ${driverStats.total} (${driverStats.active} active)`, 100, yPos);
    yPos += 6;
    doc.text(`In Maintenance: ${truckStats.maintenance}`, margin, yPos);
    doc.text(`Inactive Drivers: ${driverStats.inactive}`, 100, yPos);

    // Vehicles Table
    yPos += 15;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Vehicles', margin, yPos);

    autoTable(doc, {
      startY: yPos + 4,
      head: [['Name', 'Vehicle', 'VIN', 'License Plate', 'Status']],
      body: trucks.map(truck => [
        truck.name || '-',
        `${truck.year || ''} ${truck.make || ''} ${truck.model || ''}`.trim() || '-',
        truck.vin || '-',
        truck.license_plate || '-',
        truck.status || '-'
      ]),
      theme: 'striped',
      headStyles: { fillColor: brandBlue, textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin, bottom: 25 }
    });

    // Drivers Table
    const driversY = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Drivers', margin, driversY);

    autoTable(doc, {
      startY: driversY + 4,
      head: [['Name', 'Position', 'Phone', 'License #', 'Status']],
      body: drivers.map(driver => [
        driver.name || '-',
        driver.position || '-',
        formatPhone(driver.phone) || '-',
        driver.license_number || '-',
        driver.status || '-'
      ]),
      theme: 'striped',
      headStyles: { fillColor: brandBlue, textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin, bottom: 25 }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Fleet Summary Report | Page ${i} of ${pageCount} | Truck Command`, 105, 287, { align: 'center' });
    }

    doc.save(`Fleet_Summary_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generate Maintenance Report PDF
  const generateMaintenancePDF = async () => {
    const [upcomingMaint, overdueMaint] = await Promise.all([
      getUpcomingMaintenance(user.id, 90),
      getOverdueMaintenance(user.id)
    ]);

    const [jsPDFModule, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable")
    ]);
    const jsPDF = jsPDFModule.default;
    const autoTable = autoTableModule.default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const brandBlue = [37, 99, 235];
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Header
    doc.setFillColor(...brandBlue);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('MAINTENANCE SCHEDULE REPORT', pageWidth / 2, 14, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

    let yPos = 40;
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`Overdue Items: ${overdueMaint.length}  |  Upcoming (90 days): ${upcomingMaint.length}`, margin, yPos);

    // Overdue Section
    if (overdueMaint.length > 0) {
      yPos += 12;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('OVERDUE MAINTENANCE', margin, yPos);

      autoTable(doc, {
        startY: yPos + 4,
        head: [['Vehicle', 'Type', 'Due Date', 'Status']],
        body: overdueMaint.map(r => [
          r.trucks?.name || '-',
          r.type || '-',
          formatDate(r.due_date),
          r.status || '-'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin }
      });
      yPos = doc.lastAutoTable.finalY + 12;
    }

    // Upcoming Section
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Upcoming Maintenance (Next 90 Days)', margin, yPos);

    if (upcomingMaint.length > 0) {
      autoTable(doc, {
        startY: yPos + 4,
        head: [['Vehicle', 'Type', 'Due Date', 'Days Until', 'Status']],
        body: upcomingMaint.map(r => {
          const daysUntil = Math.ceil((new Date(r.due_date) - new Date()) / (1000 * 60 * 60 * 24));
          return [r.trucks?.name || '-', r.type || '-', formatDate(r.due_date), `${daysUntil} days`, r.status || '-'];
        }),
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin, bottom: 25 }
      });
    } else {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('No upcoming maintenance scheduled.', margin, yPos + 8);
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Maintenance Schedule Report | Page ${i} of ${pageCount} | Truck Command`, 105, 287, { align: 'center' });
    }

    doc.save(`Maintenance_Schedule_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generate Document Expiration Report PDF
  const generateDocumentsPDF = async () => {
    const drivers = await fetchDrivers(user.id);

    const [jsPDFModule, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable")
    ]);
    const jsPDF = jsPDFModule.default;
    const autoTable = autoTableModule.default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const brandBlue = [37, 99, 235];
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const now = new Date();

    // Process documents
    const expiredDocs = [];
    const expiringDocs = [];

    drivers.forEach(driver => {
      const licenseExpiry = new Date(driver.license_expiry);
      const medicalExpiry = new Date(driver.medical_card_expiry);
      const licenseDays = Math.floor((licenseExpiry - now) / (1000 * 60 * 60 * 24));
      const medicalDays = Math.floor((medicalExpiry - now) / (1000 * 60 * 60 * 24));

      if (licenseDays < 0) {
        expiredDocs.push({ driver: driver.name, document: 'CDL License', expiry: driver.license_expiry, days: licenseDays });
      } else if (licenseDays <= 90) {
        expiringDocs.push({ driver: driver.name, document: 'CDL License', expiry: driver.license_expiry, days: licenseDays });
      }

      if (medicalDays < 0) {
        expiredDocs.push({ driver: driver.name, document: 'Medical Card', expiry: driver.medical_card_expiry, days: medicalDays });
      } else if (medicalDays <= 90) {
        expiringDocs.push({ driver: driver.name, document: 'Medical Card', expiry: driver.medical_card_expiry, days: medicalDays });
      }
    });

    // Header
    doc.setFillColor(...brandBlue);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('DOCUMENT EXPIRATION REPORT', pageWidth / 2, 14, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

    let yPos = 40;
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`Expired: ${expiredDocs.length}  |  Expiring in 90 Days: ${expiringDocs.length}  |  Total Drivers: ${drivers.length}`, margin, yPos);

    // Expired Section
    if (expiredDocs.length > 0) {
      yPos += 12;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('EXPIRED DOCUMENTS', margin, yPos);

      autoTable(doc, {
        startY: yPos + 4,
        head: [['Driver', 'Document', 'Expired On', 'Days Overdue']],
        body: expiredDocs.map(d => [d.driver, d.document, formatDate(d.expiry), `${Math.abs(d.days)} days`]),
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin }
      });
      yPos = doc.lastAutoTable.finalY + 12;
    }

    // Expiring Section
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Documents Expiring Within 90 Days', margin, yPos);

    if (expiringDocs.length > 0) {
      autoTable(doc, {
        startY: yPos + 4,
        head: [['Driver', 'Document', 'Expiry Date', 'Days Left', 'Urgency']],
        body: expiringDocs.sort((a, b) => a.days - b.days).map(d => {
          let urgency = d.days <= 14 ? 'Critical' : d.days <= 30 ? 'High' : d.days <= 60 ? 'Medium' : 'Low';
          return [d.driver, d.document, formatDate(d.expiry), `${d.days} days`, urgency];
        }),
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin, bottom: 25 }
      });
    } else {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('No documents expiring in the next 90 days.', margin, yPos + 8);
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Document Expiration Report | Page ${i} of ${pageCount} | Truck Command`, 105, 287, { align: 'center' });
    }

    doc.save(`Document_Expiration_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generate Full Export CSV
  const generateFullExportCSV = async () => {
    const [trucks, drivers, maintenance, truckStats, driverStats, profileResult] = await Promise.all([
      fetchTrucks(user.id),
      fetchDrivers(user.id),
      fetchMaintenanceRecords(user.id),
      getTruckStats(user.id),
      getDriverStats(user.id),
      supabase.from("users").select("*").eq("id", user.id).single()
    ]);

    const profile = profileResult.data || {};
    const now = new Date();

    let lines = [];
    lines.push('FLEET DATA EXPORT REPORT');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    if (profile.company_name) lines.push(`Company: ${profile.company_name}`);
    lines.push('');

    // Statistics
    lines.push('FLEET STATISTICS');
    lines.push(`Total Vehicles,${truckStats.total}`);
    lines.push(`Active Vehicles,${truckStats.active}`);
    lines.push(`Total Drivers,${driverStats.total}`);
    lines.push(`Active Drivers,${driverStats.active}`);
    lines.push('');

    // Vehicles
    lines.push('VEHICLES');
    lines.push('Name,Year,Make,Model,VIN,License Plate,Status');
    trucks.forEach(t => {
      lines.push([escapeCSV(t.name), escapeCSV(t.year), escapeCSV(t.make), escapeCSV(t.model), escapeCSV(t.vin), escapeCSV(t.license_plate), escapeCSV(t.status)].join(','));
    });
    lines.push('');

    // Drivers
    lines.push('DRIVERS');
    lines.push('Name,Position,Phone,License #,License Expiry,Medical Expiry,Status');
    drivers.forEach(d => {
      lines.push([escapeCSV(d.name), escapeCSV(d.position), escapeCSV(formatPhone(d.phone)), escapeCSV(d.license_number), escapeCSV(formatDate(d.license_expiry)), escapeCSV(formatDate(d.medical_card_expiry)), escapeCSV(d.status)].join(','));
    });
    lines.push('');

    // Maintenance
    lines.push('MAINTENANCE RECORDS');
    lines.push('Vehicle,Type,Due Date,Status,Cost');
    maintenance.forEach(m => {
      lines.push([escapeCSV(m.trucks?.name), escapeCSV(m.type), escapeCSV(formatDate(m.due_date)), escapeCSV(m.status), escapeCSV(formatCurrency(m.cost))].join(','));
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fleet_Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle export
  const handleExport = async () => {
    if (!user) return;
    setExportState('loading');
    setError(null);

    try {
      if (exportFormat === 'pdf' || exportFormat === 'print') {
        switch (reportType) {
          case 'summary':
            await generateFleetSummaryPDF();
            break;
          case 'maintenance':
            await generateMaintenancePDF();
            break;
          case 'documents':
            await generateDocumentsPDF();
            break;
          case 'full':
            await generateFleetSummaryPDF(); // Full export as PDF uses summary
            break;
        }
        if (exportFormat === 'print') {
          setTimeout(() => window.print(), 500);
        }
      } else {
        // CSV/TXT export - use full export for all types
        await generateFullExportCSV();
      }

      setExportState('success');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setExportState('error');
      setError('Failed to generate report. Please try again.');
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[9999] overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && exportState !== 'loading') onClose();
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-lg mx-auto sm:my-8 relative max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4 sm:p-5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <FileDown size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              Export Fleet Report
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            disabled={exportState === 'loading'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Report Type Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
              Select Report Type
            </label>
            <div className="space-y-2">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <label
                    key={type.value}
                    className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      reportType === type.value
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value={type.value}
                      checked={reportType === type.value}
                      onChange={() => setReportType(type.value)}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-lg ${reportType === type.value ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      <Icon size={20} className={reportType === type.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{type.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{type.description}</div>
                    </div>
                    {reportType === type.value && <Check size={18} className="text-blue-600 dark:text-blue-400" />}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
              Select Export Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {formatOptions.map((format) => {
                const Icon = format.icon;
                return (
                  <label
                    key={format.value}
                    className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      exportFormat === format.value
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value={format.value}
                      checked={exportFormat === format.value}
                      onChange={() => setExportFormat(format.value)}
                      className="sr-only"
                    />
                    <Icon size={18} className={exportFormat === format.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} />
                    <span className={`ml-2 text-sm font-medium ${exportFormat === format.value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {format.label.split(' ')[0]}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-md border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {exportState === 'success' && (
            <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-md flex items-center border border-green-200 dark:border-green-800">
              <Check size={16} className="text-green-500 dark:text-green-400 mr-2" />
              <p className="text-sm text-green-700 dark:text-green-300">Export successful!</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-4 py-4 sm:px-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            disabled={exportState === 'loading'}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors disabled:opacity-50"
            disabled={exportState === 'loading' || exportState === 'success'}
          >
            {exportState === 'loading' ? (
              <>
                <RefreshCw size={18} className="animate-spin mr-2" />
                Generating...
              </>
            ) : exportState === 'success' ? (
              <>
                <Check size={18} className="mr-2" />
                Done
              </>
            ) : (
              <>
                <FileDown size={18} className="mr-2" />
                Export Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
