"use client";

import { Download, Flag } from "lucide-react";

export default function StateSummary({ fuelData = [], onExportForIFTA }) {
  // Group and calculate fuel by state
  const stateData = fuelData.reduce((acc, entry) => {
    if (!acc[entry.state]) {
      acc[entry.state] = {
        state: entry.state,
        state_name: entry.state_name,
        gallons: 0,
        amount: 0,
        purchases: 0
      };
    }
    
    acc[entry.state].gallons += entry.gallons;
    acc[entry.state].amount += entry.total_amount;
    acc[entry.state].purchases += 1;
    
    return acc;
  }, {});
  
  // Convert to array and sort by gallons (descending)
  const stateArray = Object.values(stateData).sort((a, b) => b.gallons - a.gallons);
  
  if (stateArray.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
          <Flag size={24} className="text-blue-600" />
        </div>
        <h3 className="text-lg font-medium mb-2">No State Data Available</h3>
        <p className="text-gray-500">Add fuel entries to see a breakdown by state.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Fuel by State</h3>
        {onExportForIFTA && (
          <button 
            onClick={onExportForIFTA}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <Download size={14} className="mr-1" />
            Export for IFTA
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gallons
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchases
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg. Price/Gal
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stateArray.map((state) => (
              <tr key={state.state} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Flag size={16} className="text-gray-400 mr-2" />
                    <div className="text-sm font-medium text-gray-900">
                      {state.state_name} ({state.state})
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{state.gallons.toFixed(3)} gal</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">${state.amount.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{state.purchases}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ${(state.amount / state.gallons).toFixed(3)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Total ({stateArray.length} states)
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {stateArray.reduce((sum, state) => sum + state.gallons, 0).toFixed(3)} gal
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${stateArray.reduce((sum, state) => sum + state.amount, 0).toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {stateArray.reduce((sum, state) => sum + state.purchases, 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                $
                {(
                  stateArray.reduce((sum, state) => sum + state.amount, 0) /
                  stateArray.reduce((sum, state) => sum + state.gallons, 0)
                ).toFixed(3)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}