"use client";

import { useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";

/**
 * Component that displays a badge indicating a trip was imported from State Mileage Tracker
 * @param {Object} props Component props
 * @param {Object} props.trip The IFTA trip record
 */
export default function IFTAMileageBadge({ trip }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  
  // Skip rendering if trip doesn't have mileage_trip_id
  if (!trip.mileage_trip_id) {
    return null;
  }
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      <Link 
        href={`/dashboard/mileage?trip=${trip.mileage_trip_id}`}
        className="inline-flex items-center text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200"
        target="_blank"
      >
        <MapPin size={12} className="mr-1" />
        State Mileage
        <ExternalLink size={10} className="ml-1" />
      </Link>
      
      {tooltipVisible && (
        <div className="absolute bottom-full left-0 mb-2 bg-gray-800 text-white text-xs rounded py-1 px-2 w-48 shadow-lg z-10">
          <p>Imported from State Mileage Tracker</p>
          <div className="absolute bottom-0 left-3 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
        </div>
      )}
    </div>
  );
}