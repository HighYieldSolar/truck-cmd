// src/components/dashboard/DashboardStats.js
import { BarChart2, DollarSign, Wallet, TrendingUp, TrendingDown } from "lucide-react";

/**
 * Dashboard Stats Component
 * Displays the primary statistics (earnings, expenses, profit)
 * 
 * @param {Object} props Component props
 * @param {Object} props.stats Dashboard statistics
 * @param {boolean} props.isLoading Whether data is loading
 */
export default function DashboardStats({ stats, isLoading }) {
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {isLoading ? (
        // Skeleton loaders for stats cards
        Array(3).fill(0).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="rounded-lg p-3 bg-gray-200 h-10 w-10"></div>
            </div>
          </div>
        ))
      ) : (
        <>
          <StatCard
            title="Total Earnings (MTD)"
            value={formatCurrency(stats.earnings)}
            change={stats.earningsChange}
            positive={stats.earningsPositive}
            icon={<DollarSign size={22} className="text-green-600" />}
            color="green"
          />
          <StatCard
            title="Total Expenses (MTD)"
            value={formatCurrency(stats.expenses)}
            change={stats.expensesChange}
            positive={stats.expensesPositive}
            icon={<Wallet size={22} className="text-red-600" />}
            color="red"
          />
          <StatCard
            title="Net Profit"
            value={formatCurrency(stats.profit)}
            change={stats.profitChange}
            positive={stats.profitPositive}
            icon={<BarChart2 size={22} className="text-blue-600" />}
            color="blue"
          />
        </>
      )}
    </div>
  );
}

/**
 * Stat Card Component
 * Individual statistic card with trend indicator
 */
function StatCard({ title, value, change, positive, icon, color = "blue" }) {
  // Define color classes based on the color prop
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' };
      case 'green':
        return { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-500' };
      case 'red':
        return { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' };
      case 'yellow':
        return { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: 'text-yellow-500' };
      default:
        return { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses.bg}`}>
          {icon}
        </div>
      </div>
      {change !== null && (
        <div className="mt-3">
          <p className={`text-sm flex items-center ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? (
              <TrendingUp size={16} className="mr-1" />
            ) : (
              <TrendingDown size={16} className="mr-1" />
            )}
            <span>{change}% from last month</span>
          </p>
        </div>
      )}
    </div>
  );
}