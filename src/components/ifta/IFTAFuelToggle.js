"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, Fuel, ChevronRight } from "lucide-react";

/**
 * Component to switch between IFTA Calculator and Fuel Tracker
 * This component renders a tab switcher that passes data between the two features
 */
export default function IFTAFuelToggle({ 
  currentPage, // 'ifta' or 'fuel'
  currentQuarter, // For IFTA page, the currently selected quarter in format 'YYYY-QN'
  activeState = null // For Fuel page, currently selected state filter
}) {
  // Get current quarter for fuel page date range
  const getQuarterDates = (quarterString) => {
    if (!quarterString) return { start: null, end: null };
    
    const [year, qPart] = quarterString.split('-Q');
    const quarter = parseInt(qPart);
    
    if (isNaN(quarter) || quarter < 1 || quarter > 4) return { start: null, end: null };
    
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(parseInt(year), startMonth, 1);
    const endDate = new Date(parseInt(year), startMonth + 3, 0);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  // Parse quarter dates for URL parameters
  const quarterDates = getQuarterDates(currentQuarter);
  
  // Build URLs with appropriate parameters
  const iftaUrl = `/dashboard/ifta${activeState ? `?state=${activeState}` : ''}${currentQuarter ? `${activeState ? '&' : '?'}quarter=${currentQuarter}` : ''}`;
  
  const fuelUrl = `/dashboard/fuel${quarterDates.start ? `?dateRange=Custom&startDate=${quarterDates.start}&endDate=${quarterDates.end}` : ''}${activeState ? `${quarterDates.start ? '&' : '?'}state=${activeState}` : ''}`;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="flex">
        <Link 
          href={iftaUrl}
          className={`py-3 px-4 text-sm font-medium flex items-center flex-1 justify-center ${
            currentPage === 'ifta' 
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calculator size={16} className="mr-2" />
          IFTA Calculator
        </Link>
        
        <Link 
          href={fuelUrl}
          className={`py-3 px-4 text-sm font-medium flex items-center flex-1 justify-center ${
            currentPage === 'fuel' 
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Fuel size={16} className="mr-2" />
          Fuel Tracker
        </Link>
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        {currentPage === 'ifta' ? (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              IFTA calculation requires accurate fuel purchase data. Make sure to keep your fuel tracker up to date.
            </p>
            <Link 
              href={fuelUrl}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              Go to Fuel Tracker
              <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Your fuel purchases are automatically synchronized with IFTA for accurate tax reporting.
            </p>
            <Link 
              href={iftaUrl}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              Go to IFTA Calculator
              <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}