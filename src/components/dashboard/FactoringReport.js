// src/components/dashboard/FactoringReport.js
import { useState, useEffect } from 'react';
import { getFactoringStats } from '@/lib/services/factoringService';
import { DollarSign, TrendingUp, TrendingDown, Building } from 'lucide-react';

export default function FactoringReport({ userId, period = 'month' }) {
  const [stats, setStats] = useState({
    count: 0,
    totalAmount: 0,
    totalNetAmount: 0,
    totalFees: 0,
    averageFeePercent: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const factoringStats = await getFactoringStats(userId, period);
        setStats(factoringStats);
      } catch (error) {
        // Failed to load stats - will show zero values
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) {
      loadStats();
    }
  }, [userId, period]);
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  if (loading) {
    return (
      <div className="animate-pulse bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  // Don't show the report if no factored loads
  if (stats.count === 0) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
        <h3 className="text-lg font-medium text-blue-900">Factoring Summary</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Factored Loads</p>
            <p className="text-2xl font-semibold">{stats.count}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Total Gross</p>
            <p className="text-2xl font-semibold">{formatCurrency(stats.totalAmount)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Total Fees</p>
            <p className="text-2xl font-semibold text-red-600">{formatCurrency(stats.totalFees)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Net Earnings</p>
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(stats.totalNetAmount)}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Average Fee</p>
            <p className="text-lg font-semibold">
              {stats.averageFeePercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}