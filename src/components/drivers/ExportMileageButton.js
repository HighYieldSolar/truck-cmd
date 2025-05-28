"use client";

import { useState } from "react";
import {
  FileDown,
  RefreshCw,
  Calendar,
  File,
  Download
} from "lucide-react";
import { exportTripDataAsCSV } from "@/lib/services/mileageService";

export default function ExportMileageButton({
  tripId,
  vehicleName = 'Vehicle',
  startDate = '',
  endDate = '',
  mileageData = []
}) {
  const [loading, setLoading] = useState(false);

  // Handle export
  const handleExport = async () => {
    if (!tripId || mileageData.length === 0) return;

    try {
      setLoading(true);

      // Export trip data as CSV
      const csvData = await exportTripDataAsCSV(tripId);

      // Create a blob and trigger download
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);

      // Use the tripId, vehicle name, and dates in the filename for better organization
      const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
      const fileName = `state_mileage_${vehicleName.replace(/\s+/g, '_')}_${formattedStartDate}.csv`;

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error exporting mileage data:', error);
      alert('Failed to export mileage data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
      disabled={loading || !tripId || mileageData.length === 0}
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      Export Mileage Report
    </button>
  );
}