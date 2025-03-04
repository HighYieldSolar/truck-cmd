"use client";

export default function StatsOverview({ earnings = 0, expenses = 0, activeLoads = 0 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded shadow-md">
        <h3 className="text-lg font-semibold text-black">Total Earnings</h3>
        <p className="text-2xl font-bold text-green-600">${earnings.toLocaleString()}</p>
      </div>
      <div className="bg-white p-4 rounded shadow-md">
        <h3 className="text-lg font-semibold text-black">Total Expenses</h3>
        <p className="text-2xl font-bold text-red-600">${expenses.toLocaleString()}</p>
      </div>
      <div className="bg-white p-4 rounded shadow-md">
        <h3 className="text-lg font-semibold text-black">Active Loads</h3>
        <p className="text-2xl font-bold text-blue-600">{activeLoads}</p>
      </div>
    </div>
  );
}