// src/components/dashboard/ActivityPanel.js
import Link from "next/link";
import {
  Clock,
  FileText,
  DollarSign,
  Truck,
  Fuel,
  RefreshCw
} from "lucide-react";

/**
 * Activity Panel Component
 * Shows recent activity and invoices in the main dashboard panel
 *
 * @param {Object} props Component props
 * @param {Array} props.recentActivity Recent activity items
 * @param {Array} props.recentInvoices Recent invoices
 * @param {boolean} props.isLoading Whether data is loading
 */
export default function ActivityPanel({ recentActivity = [], recentInvoices = [], isLoading = false }) {
  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/10 overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="bg-blue-500 dark:bg-blue-600 px-5 py-4 text-white flex justify-between items-center">
          <h3 className="font-semibold flex items-center">
            <Clock size={18} className="mr-2" />
            Recent Activity
          </h3>
          <div className="text-sm text-white/90">Last 7 days</div>
        </div>
        <div className="p-6">
          {isLoading ? (
            // Skeleton loader for activity
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="flex items-start py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 animate-pulse">
                <div className="rounded-full h-10 w-10 bg-gray-200 dark:bg-gray-700 mr-4"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
                </div>
              </div>
            ))
          ) : recentActivity.length === 0 ? (
            <EmptyState
              message="No recent activity found. Start creating loads or invoices to see your activity here."
              icon={<Clock size={24} className="text-gray-400 dark:text-gray-500" />}
            />
          ) : (
            recentActivity.slice(0, 5).map((activity, index) => (
              <ActivityItem key={activity.id || index} activity={activity} />
            ))
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/10 overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="bg-blue-500 dark:bg-blue-600 px-5 py-4 text-white flex justify-between items-center">
          <h3 className="font-semibold flex items-center">
            <FileText size={18} className="mr-2" />
            Recent Invoices
          </h3>
          <Link href="/dashboard/invoices" className="text-sm text-white hover:text-blue-100">
            View All
          </Link>
        </div>
        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center items-center py-6">
              <RefreshCw size={24} className="animate-spin text-blue-500 dark:text-blue-400" />
            </div>
          ) : recentInvoices.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">No recent invoices found.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentInvoices.map((invoice) => (
                <li key={invoice.id} className="py-3 flex justify-between">
                  <div>
                    <Link href={`/dashboard/invoices/${invoice.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Invoice #{invoice.number}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{invoice.customer}</p>
                  </div>
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">${invoice.amount.toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Activity Item Component
 * Individual activity entry in the recent activity feed
 */
function ActivityItem({ activity }) {
  return (
    <div className="flex items-start py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className={`p-2 rounded-full mr-4 ${
        activity.status === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
        activity.status === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
        activity.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
      }`}>
        {activity.type === 'invoice' ? <FileText size={16} /> :
         activity.type === 'expense' ? <DollarSign size={16} /> :
         activity.type === 'load' ? <Truck size={16} /> :
         activity.type === 'fuel' ? <Fuel size={16} /> :
         <Clock size={16} />
        }
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.title}</p>
          <span className="text-xs text-gray-500 dark:text-gray-400">{activity.date}</span>
        </div>
        {activity.amount && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{activity.amount}</p>
        )}
        {activity.client && (
          <p className="text-sm text-gray-600 dark:text-gray-400">Client: {activity.client}</p>
        )}
        {activity.location && (
          <p className="text-sm text-gray-600 dark:text-gray-400">Location: {activity.location}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Empty State Component
 * Shows when there is no data to display
 */
function EmptyState({ message, icon }) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No data to display</h3>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}