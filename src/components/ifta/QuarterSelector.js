"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronDown, RefreshCw } from "lucide-react";

export default function QuarterSelector({ activeQuarter, setActiveQuarter, isLoading = false }) {
  const [quarters, setQuarters] = useState([]);
  
  // Generate available quarters (current and past 7 quarters)
  useEffect(() => {
    const generateQuarters = () => {
      const result = [];
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
      
      // Include current quarter and past 7 quarters
      for (let i = 0; i < 8; i++) {
        let quarter = currentQuarter - i;
        let year = currentYear;
        
        // Adjust year if we go back to previous year
        while (quarter <= 0) {
          quarter += 4;
          year -= 1;
        }
        
        result.push({
          id: `${year}-Q${quarter}`,
          label: `${year} Q${quarter} (${getQuarterMonths(quarter)})`,
          current: i === 0
        });
      }
      
      setQuarters(result);
    };
    
    generateQuarters();
  }, []);
  
  // Helper to get month labels for quarter
  const getQuarterMonths = (quarter) => {
    switch (quarter) {
      case 1: return "Jan-Mar";
      case 2: return "Apr-Jun";
      case 3: return "Jul-Sep";
      case 4: return "Oct-Dec";
      default: return "";
    }
  };

  // Parse quarter string into more readable format
  const formatQuarterLabel = (quarterString) => {
    if (!quarterString) return "";
    
    const [year, quarter] = quarterString.split('-Q');
    return `${year} Quarter ${quarter} (${getQuarterMonths(parseInt(quarter))})`;
  };
  
  // Handle changing the quarter
  const handleQuarterChange = (e) => {
    setActiveQuarter(e.target.value);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex items-center mb-3 sm:mb-0">
          <Calendar size={18} className="text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">IFTA Reporting Period</h3>
        </div>
        
        <div className="relative w-full sm:w-auto">
          <select
            id="quarter"
            name="quarter"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={activeQuarter}
            onChange={handleQuarterChange}
            disabled={isLoading}
          >
            {quarters.map((quarter) => (
              <option 
                key={quarter.id} 
                value={quarter.id}
                className={quarter.current ? "font-bold" : ""}
              >
                {quarter.label} {quarter.current ? "(Current)" : ""}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            {isLoading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-xs text-blue-500 uppercase font-medium">Reporting Quarter</div>
          <div className="text-lg font-medium text-blue-700">{formatQuarterLabel(activeQuarter)}</div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-xs text-green-500 uppercase font-medium">Filing Deadline</div>
          <div className="text-lg font-medium text-green-700">
            {activeQuarter && activeQuarter.includes('Q') ? (
              <>
                {activeQuarter.includes('Q1') && "April 30"}
                {activeQuarter.includes('Q2') && "July 31"}
                {activeQuarter.includes('Q3') && "October 31"}
                {activeQuarter.includes('Q4') && "January 31"}
              </>
            ) : "Check your jurisdiction"}
          </div>
        </div>
        
        <div className="md:col-span-2 bg-yellow-50 p-3 rounded-lg">
          <div className="text-xs text-yellow-600 uppercase font-medium">REMINDER</div>
          <div className="text-sm text-yellow-700">
            Keep all fuel receipts and mileage records for at least 4 years. IFTA jurisdictions may audit your records at any time.
          </div>
        </div>
      </div>
    </div>
  );
}