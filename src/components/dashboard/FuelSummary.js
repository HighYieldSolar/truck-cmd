import { Fuel, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

export default function FuelSummary({ fuelStats }) {
  const { totalGallons, totalAmount, avgPricePerGallon } = fuelStats || {
    totalGallons: 0,
    totalAmount: 0,
    avgPricePerGallon: 0
  };
  
  return (
    <div className="bg-white p-4 rounded shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-black">Fuel Summary</h3>
        <Link href="/dashboard/fuel" className="text-sm text-blue-500 hover:text-blue-700">
          View Fuel Tracker
        </Link>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-500">Total Gallons</p>
          <p className="text-xl font-bold">{totalGallons.toFixed(1)}</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">Total Cost</p>
          <p className="text-xl font-bold">${totalAmount.toFixed(2)}</p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">Avg. Price/Gal</p>
          <p className="text-xl font-bold">${avgPricePerGallon.toFixed(3)}</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link 
          href="/dashboard/fuel/add" 
          className="block w-full text-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
        >
          <Fuel size={16} className="inline-block mr-2" />
          Add Fuel Purchase
        </Link>
      </div>
    </div>
  );
}