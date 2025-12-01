// src/components/dashboard/BusinessOverview.js
import Link from "next/link";
import { Truck, FileText, Calendar, ChevronRight } from "lucide-react";

/**
 * Business Overview Component
 * Shows secondary stats like active loads, pending invoices, upcoming deliveries
 *
 * @param {Object} props Component props
 * @param {Object} props.stats Dashboard statistics
 * @param {boolean} props.isLoading Whether data is loading
 */
export default function BusinessOverview({ stats, isLoading }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {isLoading ? (
        // Skeleton loaders for info cards
        Array(3).fill(0).map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/10 p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="rounded-lg p-3 bg-gray-200 dark:bg-gray-700 h-10 w-10 mr-4"></div>
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))
      ) : (
        <>
          <InfoCard
            title="Active Loads"
            value={stats.activeLoads}
            icon={<Truck size={20} className="text-blue-600 dark:text-blue-400" />}
            href="/dashboard/dispatching"
            color="blue"
          />
          <InfoCard
            title="Pending Invoices"
            value={stats.pendingInvoices}
            icon={<FileText size={20} className="text-yellow-600 dark:text-yellow-400" />}
            href="/dashboard/invoices"
            color="yellow"
          />
          <InfoCard
            title="Upcoming Deliveries"
            value={stats.upcomingDeliveries}
            icon={<Calendar size={20} className="text-purple-600 dark:text-purple-400" />}
            href="/dashboard/dispatching"
            color="purple"
          />
        </>
      )}
    </div>
  );
}

/**
 * Info Card Component
 * Individual card for secondary stats with link
 */
function InfoCard({ title, value, icon, href, color = "blue" }) {
  // Define color classes based on the color prop
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-600 dark:text-blue-400',
          hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-600',
          hoverBg: 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
        };
      case 'green':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-600 dark:text-green-400',
          hoverBorder: 'hover:border-green-300 dark:hover:border-green-600',
          hoverBg: 'hover:bg-green-50/50 dark:hover:bg-green-900/10'
        };
      case 'red':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-600 dark:text-red-400',
          hoverBorder: 'hover:border-red-300 dark:hover:border-red-600',
          hoverBg: 'hover:bg-red-50/50 dark:hover:bg-red-900/10'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          text: 'text-yellow-600 dark:text-yellow-400',
          hoverBorder: 'hover:border-yellow-300 dark:hover:border-yellow-600',
          hoverBg: 'hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          text: 'text-purple-600 dark:text-purple-400',
          hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-600',
          hoverBg: 'hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-600 dark:text-blue-400',
          hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-600',
          hoverBg: 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <Link
      href={href}
      className={`group block bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/10 px-5 py-5 border border-gray-200 dark:border-gray-700 ${colorClasses.hoverBorder} ${colorClasses.hoverBg} hover:shadow-lg dark:hover:shadow-gray-900/30 hover:-translate-y-0.5 transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`rounded-lg p-3 ${colorClasses.bg} ${colorClasses.text} mr-4 group-hover:scale-110 transition-transform duration-200`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-400 dark:text-gray-500 group-hover:translate-x-1 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-all duration-200" />
      </div>
    </Link>
  );
}