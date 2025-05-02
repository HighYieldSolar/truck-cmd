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
          <div key={index} className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="rounded-lg p-3 bg-gray-200 h-10 w-10 mr-4"></div>
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))
      ) : (
        <>
          <InfoCard
            title="Active Loads"
            value={stats.activeLoads}
            icon={<Truck size={20} className="text-blue-600" />}
            href="/dashboard/dispatching"
            color="blue"
          />
          <InfoCard
            title="Pending Invoices"
            value={stats.pendingInvoices}
            icon={<FileText size={20} className="text-yellow-600" />}
            href="/dashboard/invoices"
            color="yellow"
          />
          <InfoCard
            title="Upcoming Deliveries"
            value={stats.upcomingDeliveries}
            icon={<Calendar size={20} className="text-purple-600" />}
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
        return { bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'green':
        return { bg: 'bg-green-50', text: 'text-green-600' };
      case 'red':
        return { bg: 'bg-red-50', text: 'text-red-600' };
      case 'yellow':
        return { bg: 'bg-yellow-50', text: 'text-yellow-600' };
      case 'purple':
        return { bg: 'bg-purple-50', text: 'text-purple-600' };
      default:
        return { bg: 'bg-blue-50', text: 'text-blue-600' };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <Link href={href} className="block bg-white rounded-xl shadow-sm px-5 py-5 border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`rounded-lg p-3 ${colorClasses.bg} ${colorClasses.text} mr-4`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{value}</p>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </div>
    </Link>
  );
}