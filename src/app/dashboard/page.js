import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-4">
        <h2 className="text-xl font-bold mb-6">Truck Command</h2>
        <nav>
          <ul className="space-y-2">
            <li className="p-2 rounded bg-blue-500 text-white">Dashboard</li>
            <li className="p-2 rounded hover:bg-gray-200">IFTA Calculator</li>
            <li className="p-2 rounded hover:bg-gray-200">Load Management</li>
            <li className="p-2 rounded hover:bg-gray-200">Invoices</li>
            <li className="p-2 rounded hover:bg-gray-200">Expenses</li>
            <li className="p-2 rounded hover:bg-gray-200">Customers</li>
            <li className="p-2 rounded hover:bg-gray-200">Reminders</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow-md">
            <h3 className="text-lg font-semibold">Total Earnings</h3>
            <p className="text-2xl font-bold text-green-600">$12,500</p>
          </div>
          <div className="bg-white p-4 rounded shadow-md">
            <h3 className="text-lg font-semibold">Total Expenses</h3>
            <p className="text-2xl font-bold text-red-600">$3,200</p>
          </div>
          <div className="bg-white p-4 rounded shadow-md">
            <h3 className="text-lg font-semibold">Active Loads</h3>
            <p className="text-2xl font-bold text-blue-600">8</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-4 rounded shadow-md">
          <h3 className="text-lg font-semibold mb-2">Recent Invoices</h3>
          <ul>
            <li className="flex justify-between border-b p-2">
              <span>Invoice #12345</span> <span className="text-green-600">$1,200</span>
            </li>
            <li className="flex justify-between border-b p-2">
              <span>Invoice #12346</span> <span className="text-green-600">$950</span>
            </li>
            <li className="flex justify-between border-b p-2">
              <span>Invoice #12347</span> <span className="text-green-600">$2,100</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}