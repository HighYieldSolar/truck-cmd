// src/components/dashboard/DashboardHeader.js
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

/**
 * Dashboard Header Component
 * 
 * @param {Object} props Component props
 * @param {Object} props.user Current user object
 * @param {Function} props.onRefresh Function to trigger data refresh
 * @param {boolean} props.isLoading Whether data is currently loading
 */
export default function DashboardHeader({ user, onRefresh, isLoading }) {
  return (
    <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl shadow-md p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold mb-1">
            Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-blue-100">Here&#39;s what&#39;s happening with your trucking business today</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex items-center font-medium disabled:opacity-70"
          >
            <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link
            href="/dashboard/dispatching/new"
            className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center font-medium"
          >
            <Plus size={18} className="mr-2" />
            New Load
          </Link>
        </div>
      </div>
    </div>
  );
}