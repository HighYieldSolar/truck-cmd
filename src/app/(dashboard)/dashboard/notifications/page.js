"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSubscription } from "@/context/SubscriptionContext";
import { NotificationListItem, NotificationListItemSkeleton } from "@/components/notifications/NotificationListItem";
import {
  Bell, Filter, AlertCircle, ChevronLeft, ChevronRight,
  RefreshCw,
} from "lucide-react";

const NOTIFICATION_PAGE_SIZE = 15;

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useSubscription();

  const [notificationsList, setNotificationsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotificationsCount, setTotalNotificationsCount] = useState(0);

  const [filters, setFilters] = useState({
    type: "ALL",
    status: "ALL",
  });

  const totalPages = Math.ceil(totalNotificationsCount / NOTIFICATION_PAGE_SIZE);

  const fetchNotifications = useCallback(async (page, currentFilters) => {
    if (!user || !user.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    // Fix status filter logic
    let filterReadStatus = null;
    if (currentFilters.status === "UNREAD") filterReadStatus = false;
    if (currentFilters.status === "READ" || currentFilters.status === "READ") filterReadStatus = true;

    let filterTypesArray = null;
    if (currentFilters.type !== "ALL") {
      filterTypesArray = [currentFilters.type];
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('get_all_notifications', {
        p_user_id: user.id,
        p_page_number: page,
        p_page_size: NOTIFICATION_PAGE_SIZE,
        p_filter_types: filterTypesArray,
        p_filter_read_status: filterReadStatus,
      });

      if (rpcError) throw rpcError;

      // Handle the new database function response format
      if (data && data.notifications) {
        setNotificationsList(data.notifications || []);
        setTotalNotificationsCount(data.pagination?.total_count || 0);
      } else {
        setNotificationsList([]);
        setTotalNotificationsCount(0);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
      setError("Failed to load notifications. Please try again.");
      setNotificationsList([]);
      setTotalNotificationsCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) { // Ensure user.id is present before fetching
      fetchNotifications(currentPage, filters);
    }
  }, [user, currentPage, filters, fetchNotifications]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value,
    }));
    setCurrentPage(1);
  };

  const handleMarkAsRead = async (notificationId) => {
    if (!user || !user.id) return;
    const originalList = [...notificationsList];
    setNotificationsList(prevList =>
      prevList.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    try {
      const { error: rpcError } = await supabase.rpc('mark_notification_as_read', {
        p_notification_id: notificationId,
        p_user_id: user.id
      });
      if (rpcError) {
        console.error("Error marking notification as read:", rpcError);
        setError("Failed to update notification status.");
        setNotificationsList(originalList); // Revert optimistic update
      }
      // Optionally, refetch summary for DashboardLayout if unread count is managed there separately
      // supabase.rpc('get_unread_notifications_summary', { p_user_id: user.id }).then(...)
    } catch (e) {
      console.error("Client error marking notification as read:", e);
      setError("Failed to update notification status.");
      setNotificationsList(originalList); // Revert optimistic update
    }
  };

  // Notification type options for the filter dropdown
  // Ensure these values match your 'notification_type' enum/text in the database
  const notificationTypes = [
    { label: "All Types", value: "ALL" },
    { label: "Compliance Documents", value: "DOCUMENT_EXPIRY_COMPLIANCE" },
    { label: "Driver Licenses", value: "DOCUMENT_EXPIRY_DRIVER_LICENSE" },
    { label: "Driver Medical Cards", value: "DOCUMENT_EXPIRY_DRIVER_MEDICAL" },
    { label: "Deliveries", value: "DELIVERY_UPCOMING" },
    { label: "IFTA Deadlines", value: "IFTA_DEADLINE" },
    { label: "Load Assigned", value: "LOAD_ASSIGNED" },
    { label: "Load Updates", value: "LOAD_STATUS_UPDATE" },
    { label: "Maintenance Due", value: "MAINTENANCE_DUE" },
    { label: "System Alerts", value: "SYSTEM_ERROR" },
    { label: "General Reminders", value: "GENERAL_REMINDER" },
  ];

  const statusTypes = [
    { label: "All Statuses", value: "ALL" },
    { label: "Unread", value: "UNREAD" },
    { label: "Read", value: "READ" },
  ];

  return (
    <DashboardLayout pageTitle="Notifications">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Notifications</h1>
          </header>

          {/* Filter Bar Card - styled like CustomerFilters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="px-5 py-3 border-b border-blue-700 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700">
              <h3 className="font-medium flex items-center text-white text-md">
                <Filter size={18} className="mr-2 text-blue-100" />
                Filter Notifications
              </h3>
              <button
                onClick={() => fetchNotifications(currentPage, filters)}
                disabled={isLoading}
                title="Refresh notifications"
                className="p-1.5 text-blue-100 hover:text-white disabled:text-blue-300 rounded-md hover:bg-blue-500/50"
              >
                <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="p-4 md:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end bg-white">
              <div>
                <label htmlFor="notificationType" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  id="notificationType"
                  name="type"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="block w-full text-sm border-gray-500 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-1"
                >
                  {notificationTypes.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-gray-700 text-white">{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="notificationStatus" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  id="notificationStatus"
                  name="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full text-sm border-gray-500 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-1"
                >
                  {statusTypes.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-gray-700 text-white">{opt.label}</option>
                  ))}
                </select>
              </div>
              {/* Future: Add date range filter if needed */}
            </div>
          </div>

          {/* Notifications List Area - main container uses rounded-xl like CustomerTable card */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                <div className="flex">
                  <div className="py-1"><AlertCircle className="h-5 w-5 text-red-400 mr-3" /></div>
                  <div>
                    <p className="font-bold">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {isLoading && notificationsList.length === 0 ? (
              <ul className="divide-y divide-gray-200">
                {Array.from({ length: NOTIFICATION_PAGE_SIZE / 2 }).map((_, index) => <NotificationListItemSkeleton key={index} />)}
              </ul>
            ) : !isLoading && notificationsList.length === 0 ? (
              <div className="text-center py-16 px-6">
                <Bell size={56} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800">All caught up!</h3>
                <p className="text-md text-gray-500 mt-2">There are no notifications matching your current filters.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200"> {/* Added divide for consistency if items don't have own bottom border */}
                {notificationsList.map(notification => (
                  <NotificationListItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 flex items-center"
                >
                  <ChevronLeft size={16} className="mr-1.5" />
                  Previous
                </button>
                <span className="text-sm text-gray-700 whitespace-nowrap">
                  Page {currentPage} of {totalPages} <span className="hidden sm:inline">({totalNotificationsCount} notifications)</span>
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || isLoading}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 flex items-center"
                >
                  Next
                  <ChevronRight size={16} className="ml-1.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
    </DashboardLayout>
  );
} 