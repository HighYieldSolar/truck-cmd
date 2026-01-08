"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSubscription } from "@/context/SubscriptionContext";
import { NotificationListItem, NotificationListItemSkeleton } from "@/components/notifications/NotificationListItem";
import { OperationMessage, EmptyState } from "@/components/ui/OperationMessage";
import { usePagination, Pagination, SimplePagination } from "@/hooks/usePagination";
import { getUserFriendlyError } from "@/lib/utils/errorMessages";
import {
  Bell, Filter, AlertCircle, ChevronLeft, ChevronRight,
  RefreshCw, CheckCircle, Trash2, Settings, Search,
  AlertTriangle, Clock, FileText, X, BellOff
} from "lucide-react";

const NOTIFICATION_PAGE_SIZE = 10;

// Notification type options for the filter dropdown
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
  { label: "Invoices Overdue", value: "INVOICE_OVERDUE" },
  { label: "Payments Received", value: "PAYMENT_RECEIVED" },
  { label: "Fuel Reminders", value: "FUEL_REMINDER" },
  { label: "System Alerts", value: "SYSTEM_ERROR" },
  { label: "General Reminders", value: "GENERAL_REMINDER" },
];

const statusTypes = [
  { label: "All Statuses", value: "ALL" },
  { label: "Unread", value: "UNREAD" },
  { label: "Read", value: "READ" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useSubscription();

  const [notificationsList, setNotificationsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operationMessage, setOperationMessage] = useState(null);

  const [totalNotificationsCount, setTotalNotificationsCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    critical: 0
  });

  const [filters, setFilters] = useState({
    type: "ALL",
    status: "ALL",
    search: ""
  });

  // Filter notifications client-side for search
  const filteredNotifications = useMemo(() => {
    if (!filters.search) return notificationsList;
    const searchLower = filters.search.toLowerCase();
    return notificationsList.filter(n =>
      (n.title && n.title.toLowerCase().includes(searchLower)) ||
      (n.message && n.message.toLowerCase().includes(searchLower))
    );
  }, [notificationsList, filters.search]);

  // Pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    hasNextPage,
    hasPrevPage,
    showingText,
    pageNumbers,
    totalItems
  } = usePagination(filteredNotifications, { itemsPerPage: NOTIFICATION_PAGE_SIZE });

  const fetchNotifications = useCallback(async (currentFilters) => {
    if (!user || !user.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      let notifications = [];

      // Try RPC function first, fallback to direct table query
      try {
        // Fix status filter logic
        let filterReadStatus = null;
        if (currentFilters.status === "UNREAD") filterReadStatus = false;
        if (currentFilters.status === "READ") filterReadStatus = true;

        let filterTypesArray = null;
        if (currentFilters.type !== "ALL") {
          filterTypesArray = [currentFilters.type];
        }

        const { data, error: rpcError } = await supabase.rpc('get_all_notifications', {
          p_user_id: user.id,
          p_page_number: 1,
          p_page_size: 1000,
          p_filter_types: filterTypesArray,
          p_filter_read_status: filterReadStatus,
        });

        if (rpcError) throw rpcError;

        // Handle different response formats
        if (data) {
          if (Array.isArray(data)) {
            notifications = data;
          } else if (data.notifications && Array.isArray(data.notifications)) {
            notifications = data.notifications;
          } else if (typeof data === 'object') {
            const items = Object.values(data).filter(item =>
              item && typeof item === 'object' && item.id
            );
            if (items.length > 0) notifications = items;
          }
        }
      } catch (rpcErr) {
        // Fallback: Query notifications table directly
        let query = supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Apply filters
        if (currentFilters.status === "UNREAD") {
          query = query.eq('is_read', false);
        } else if (currentFilters.status === "READ") {
          query = query.eq('is_read', true);
        }

        if (currentFilters.type !== "ALL") {
          query = query.eq('notification_type', currentFilters.type);
        }

        const { data: directData, error: directError } = await query;

        if (directError) throw directError;
        notifications = directData || [];
      }

      setNotificationsList(notifications);
      setTotalNotificationsCount(notifications.length);

      // Calculate stats
      const unreadCount = notifications.filter(n => !n.is_read).length;
      const criticalCount = notifications.filter(n =>
        n.urgency === 'CRITICAL' || n.urgency === 'HIGH'
      ).length;

      setStats({
        total: notifications.length,
        unread: unreadCount,
        read: notifications.length - unreadCount,
        critical: criticalCount
      });
    } catch (e) {
      setError(getUserFriendlyError(e));
      setNotificationsList([]);
      setTotalNotificationsCount(0);
      setStats({ total: 0, unread: 0, read: 0, critical: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      fetchNotifications(filters);
    }
  }, [user, fetchNotifications]);

  // Refetch when filters change (except search which is client-side)
  useEffect(() => {
    if (user?.id) {
      fetchNotifications(filters);
    }
  }, [filters.type, filters.status]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Refetch notifications on any change
          fetchNotifications(filters);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, fetchNotifications, filters]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: "ALL",
      status: "ALL",
      search: ""
    });
  };

  const handleMarkAsRead = async (notificationId) => {
    if (!user || !user.id) return;
    const originalList = [...notificationsList];

    // Optimistic update
    setNotificationsList(prevList =>
      prevList.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setStats(prev => ({
      ...prev,
      unread: Math.max(0, prev.unread - 1),
      read: prev.read + 1
    }));

    try {
      // Use direct update instead of RPC (RPC has schema mismatch)
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    } catch (e) {
      setOperationMessage({ type: 'error', text: getUserFriendlyError(e) });
      setNotificationsList(originalList); // Revert optimistic update
      // Recalculate stats
      const unreadCount = originalList.filter(n => !n.is_read).length;
      setStats(prev => ({
        ...prev,
        unread: unreadCount,
        read: originalList.length - unreadCount
      }));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || !user.id) return;
    const originalList = [...notificationsList];
    const originalStats = { ...stats };

    // Optimistic update
    setNotificationsList(prevList =>
      prevList.map(n => ({ ...n, is_read: true }))
    );
    setStats(prev => ({
      ...prev,
      unread: 0,
      read: prev.total
    }));

    try {
      // Use direct update instead of RPC (RPC has schema mismatch)
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      setOperationMessage({ type: 'success', text: 'All notifications marked as read.' });
    } catch (e) {
      setOperationMessage({ type: 'error', text: getUserFriendlyError(e) });
      setNotificationsList(originalList);
      setStats(originalStats);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!user || !user.id) return;
    const originalList = [...notificationsList];
    const notificationToDelete = originalList.find(n => n.id === notificationId);

    // Optimistic update
    setNotificationsList(prevList => prevList.filter(n => n.id !== notificationId));
    setStats(prev => ({
      ...prev,
      total: prev.total - 1,
      unread: notificationToDelete?.is_read ? prev.unread : prev.unread - 1,
      read: notificationToDelete?.is_read ? prev.read - 1 : prev.read,
      critical: (notificationToDelete?.urgency === 'CRITICAL' || notificationToDelete?.urgency === 'HIGH')
        ? prev.critical - 1 : prev.critical
    }));

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      setOperationMessage({ type: 'success', text: 'Notification deleted.' });
    } catch (e) {
      setOperationMessage({ type: 'error', text: getUserFriendlyError(e) });
      setNotificationsList(originalList);
      // Recalculate stats
      const unreadCount = originalList.filter(n => !n.is_read).length;
      const criticalCount = originalList.filter(n =>
        n.urgency === 'CRITICAL' || n.urgency === 'HIGH'
      ).length;
      setStats({
        total: originalList.length,
        unread: unreadCount,
        read: originalList.length - unreadCount,
        critical: criticalCount
      });
    }
  };

  const handleDeleteAllRead = async () => {
    if (!user || !user.id) return;
    const originalList = [...notificationsList];
    const readNotifications = originalList.filter(n => n.is_read);

    if (readNotifications.length === 0) {
      setOperationMessage({ type: 'info', text: 'No read notifications to delete.' });
      return;
    }

    // Optimistic update
    setNotificationsList(prevList => prevList.filter(n => !n.is_read));
    setStats(prev => ({
      ...prev,
      total: prev.unread,
      read: 0,
      critical: prev.critical // May need recalculation
    }));

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true);

      if (deleteError) {
        throw deleteError;
      }

      setOperationMessage({ type: 'success', text: `${readNotifications.length} read notifications deleted.` });
    } catch (e) {
      setOperationMessage({ type: 'error', text: getUserFriendlyError(e) });
      setNotificationsList(originalList);
      // Recalculate stats
      const unreadCount = originalList.filter(n => !n.is_read).length;
      const criticalCount = originalList.filter(n =>
        n.urgency === 'CRITICAL' || n.urgency === 'HIGH'
      ).length;
      setStats({
        total: originalList.length,
        unread: unreadCount,
        read: originalList.length - unreadCount,
        critical: criticalCount
      });
    }
  };

  // Stat Card Component
  const StatCard = ({ icon: Icon, iconBgClass, iconColorClass, label, value, borderColor = "border-blue-500" }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 border-l-4 ${borderColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconBgClass}`}>
          <Icon className={`h-6 w-6 ${iconColorClass}`} />
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout pageTitle="Notifications">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left: Title & Description */}
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Bell className="h-6 w-6" />
                  Notifications
                </h1>
                <p className="text-blue-100 mt-1">
                  Stay updated on compliance, deliveries, and important alerts
                </p>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {/* Mark All as Read */}
                {stats.unread > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Mark All Read
                  </button>
                )}

                {/* Delete All Read */}
                {stats.read > 0 && (
                  <button
                    onClick={handleDeleteAllRead}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-white border border-white/30 rounded-lg font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    Clear Read
                  </button>
                )}

                {/* Notification Settings */}
                <Link
                  href="/dashboard/settings/notifications"
                  className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-white border border-white/30 rounded-lg font-medium hover:bg-blue-500/30 transition-colors"
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Settings
                </Link>
              </div>
            </div>
          </div>

          {/* Operation Message */}
          <OperationMessage
            message={operationMessage}
            onDismiss={() => setOperationMessage(null)}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Bell}
              iconBgClass="bg-blue-100 dark:bg-blue-900/30"
              iconColorClass="text-blue-600 dark:text-blue-400"
              label="Total"
              value={stats.total}
              borderColor="border-blue-500"
            />
            <StatCard
              icon={BellOff}
              iconBgClass="bg-amber-100 dark:bg-amber-900/30"
              iconColorClass="text-amber-600 dark:text-amber-400"
              label="Unread"
              value={stats.unread}
              borderColor="border-amber-500"
            />
            <StatCard
              icon={CheckCircle}
              iconBgClass="bg-emerald-100 dark:bg-emerald-900/30"
              iconColorClass="text-emerald-600 dark:text-emerald-400"
              label="Read"
              value={stats.read}
              borderColor="border-emerald-500"
            />
            <StatCard
              icon={AlertTriangle}
              iconBgClass="bg-red-100 dark:bg-red-900/30"
              iconColorClass="text-red-600 dark:text-red-400"
              label="Critical"
              value={stats.critical}
              borderColor="border-red-500"
            />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Categories Filter */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-blue-500" />
                    Quick Filters
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  {statusTypes.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => handleFilterChange('status', status.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.status === status.value
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {status.label}
                      {status.value === 'UNREAD' && stats.unread > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          {stats.unread}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Types */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Categories
                  </h3>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto space-y-1">
                  {notificationTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleFilterChange('type', type.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.type === type.value
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="xl:col-span-3 space-y-6">
              {/* Filter Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col xl:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {/* Refresh Button */}
                    <button
                      onClick={() => fetchNotifications(filters)}
                      disabled={isLoading}
                      className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      title="Refresh"
                    >
                      <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Clear Filters */}
                    {(filters.type !== 'ALL' || filters.status !== 'ALL' || filters.search) && (
                      <button
                        onClick={clearFilters}
                        className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Clear Filters"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 text-red-700 dark:text-red-300">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Error</p>
                        <p className="text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {isLoading && notificationsList.length === 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <NotificationListItemSkeleton key={index} />
                    ))}
                  </div>
                ) : !isLoading && paginatedData.length === 0 ? (
                  <EmptyState
                    icon={Bell}
                    title="All caught up!"
                    description={
                      filters.type !== 'ALL' || filters.status !== 'ALL' || filters.search
                        ? "No notifications match your current filters."
                        : "You don't have any notifications yet. We'll notify you about important events."
                    }
                    action={
                      (filters.type !== 'ALL' || filters.status !== 'ALL' || filters.search)
                        ? { label: 'Clear Filters', onClick: clearFilters }
                        : undefined
                    }
                  />
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedData.map(notification => (
                      <NotificationListItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDelete={handleDeleteNotification}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                    {/* Desktop Pagination */}
                    <div className="hidden sm:block">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageNumbers={pageNumbers}
                        onPageChange={goToPage}
                        hasNextPage={hasNextPage}
                        hasPrevPage={hasPrevPage}
                        showingText={showingText}
                      />
                    </div>
                    {/* Mobile Pagination */}
                    <div className="sm:hidden">
                      <SimplePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={goToPage}
                        hasNextPage={hasNextPage}
                        hasPrevPage={hasPrevPage}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
