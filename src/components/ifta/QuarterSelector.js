// src/components/ifta/QuarterSelector.js
"use client";

import { Calendar, ChevronDown } from "lucide-react";

export default function QuarterSelector({ activeQuarter, setActiveQuarter, isLoading = false }) {
  // Get current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;

  // Generate quarters (current year, previous year, and next year)
  const quarters = [];
  for (let year = currentYear + 1; year >= currentYear - 2; year--) {
    for (let q = 4; q >= 1; q--) {
      // Skip future quarters
      if (year === currentYear + 1 && q > currentQuarter) continue;
      if (year > currentYear) continue;

      quarters.push({
        value: `${year}-Q${q}`,
        label: `Q${q} ${year}`,
        year,
        quarter: q
      });
    }
  }

  // Format label for display
  const getDisplayLabel = (value) => {
    if (!value) return "Select Quarter";

    const selectedQuarter = quarters.find(q => q.value === value);
    if (selectedQuarter) {
      return `${selectedQuarter.label}${selectedQuarter.year === currentYear && selectedQuarter.quarter === currentQuarter ? " (Current)" : ""}`;
    }
    return value;
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Calendar size={16} className="text-gray-400" />
      </div>
      <select
        value={activeQuarter}
        onChange={(e) => setActiveQuarter(e.target.value)}
        disabled={isLoading}
        className="appearance-none block w-full pl-10 pr-10 py-2 text-sm border border-gray-600 rounded-lg 
        focus:ring-blue-500 focus:border-blue-500 
        bg-gray-800 text-white"
        style={{ backgroundImage: "url('/path/to/your/icon.svg')" }} // Optional: Add a custom background image
      >
        <option value="" className="bg-gray-800 text-white">Select Quarter</option>
        {
          quarters.map((q) => (
            <option key={q.value} value={q.value} className="bg-gray-800 text-white">
              {q.label}
              {q.year === currentYear && q.quarter === currentQuarter ? " (Current)" : ""}
            </option>
          ))
        }
      </select >
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown size={16} className="text-gray-400" />
      </div>
    </div >
  );
}