// src/components/dashboard/FuelSummary.js
import Link from "next/link";
import { Fuel, Plus } from "lucide-react";

/**
 * Fuel Summary Component
 * Displays fuel statistics in a card on the dashboard
 * 
 * @param {Object} props Component props
 * @param {Object} props.stats Fuel statistics
 */
export default function FuelSummary({ stats = {} }) {
  const totalGallons = stats.totalGallons || 0;
  const totalAmount = stats.totalAmount || 0;
  const avgPricePerGallon = stats.avgPricePerGallon || 0;
  const uniqueStates = stats.uniqueStates || 0;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-yellow-500 px-5 py-4 text-white">
        <h3 className="font-semibold flex items-center">
          <Fuel size={18} className="mr-2" />
          Fuel Tracker
        </h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Gallons</div>
            <div className="text-black text-2xl font-semibold">{totalGallons.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Spent</div>
            <div className="text-black text-2xl font-semibold">${totalAmount.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Avg Price/Gal</div>
            <div className="text-black text-2xl font-semibold">${avgPricePerGallon.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">States</div>
            <div className="text-black text-2xl font-semibold">{uniqueStates}</div>
          </div>
        </div>
        <Link
          href="/dashboard/fuel"
          className="flex items-center justify-center w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Add Fuel Purchase
        </Link>
      </div>
    </div>
  );
}