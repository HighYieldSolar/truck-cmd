// src/components/expenses/ExpenseSummary.js
"use client";

import { 
  Wallet, 
  BarChart2, 
  Calendar, 
  Clock, 
  TrendingUp 
} from "lucide-react";

export default function ExpenseSummary({ stats, dateRange }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.total)}</p>
          </div>
          <div className="bg-red-100 p-3 rounded-xl">
            <Wallet size={20} className="text-red-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">{dateRange} expenses</span>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Top Category</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {stats.topCategory ? stats.topCategory.name : "None"}
            </p>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl">
            <BarChart2 size={20} className="text-blue-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">
            {stats.topCategory 
              ? `${formatCurrency(stats.topCategory.amount)}` 
              : "No data available"}
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Daily Average</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(stats.dailyAverage)}</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-xl">
            <Calendar size={20} className="text-purple-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">Average spending per day</span>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Monthly Trend</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {stats.monthlyTrend > 0 ? '+' : ''}{stats.monthlyTrend !== undefined ? `${stats.monthlyTrend}%` : "N/A"}
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-xl">
            <TrendingUp size={20} className="text-green-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">Compared to previous month</span>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Categories</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {Object.keys(stats.byCategory).filter(cat => stats.byCategory[cat] > 0).length}
            </p>
          </div>
          <div className="bg-orange-100 p-3 rounded-xl">
            <Clock size={20} className="text-orange-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">Active spending categories</span>
        </div>
      </div>
    </div>
  );
}