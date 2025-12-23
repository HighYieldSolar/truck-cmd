"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle, Info, FileText, AlertTriangle, Trash2,
  CalendarClock, TruckIcon, ServerCrash, Bell, Wrench,
  User, CreditCard, Package, Clock, AlertCircle, Fuel
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export function NotificationListItem({ notification, onMarkAsRead, onDelete }) {
  const router = useRouter();
  const { t } = useTranslation('common');

  const getIcon = () => {
    let iconDetails = {
      icon: <Info size={16} />,
      bgColor: "bg-gray-100 dark:bg-gray-700",
      textColor: "text-gray-500 dark:text-gray-400"
    };

    switch (notification.notification_type) {
      case 'DELIVERY_UPCOMING':
        iconDetails = {
          icon: <TruckIcon size={16} />,
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          textColor: "text-blue-600 dark:text-blue-400"
        };
        break;
      case 'DOCUMENT_EXPIRY_COMPLIANCE':
        iconDetails = {
          icon: <FileText size={16} />,
          bgColor: "bg-red-100 dark:bg-red-900/30",
          textColor: "text-red-600 dark:text-red-400"
        };
        break;
      case 'DOCUMENT_EXPIRY_DRIVER_LICENSE':
      case 'DOCUMENT_EXPIRY_DRIVER_MEDICAL':
        iconDetails = {
          icon: <User size={16} />,
          bgColor: "bg-orange-100 dark:bg-orange-900/30",
          textColor: "text-orange-600 dark:text-orange-400"
        };
        break;
      case 'IFTA_DEADLINE':
        iconDetails = {
          icon: <CalendarClock size={16} />,
          bgColor: "bg-purple-100 dark:bg-purple-900/30",
          textColor: "text-purple-600 dark:text-purple-400"
        };
        break;
      case 'LOAD_ASSIGNED':
        iconDetails = {
          icon: <Package size={16} />,
          bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
          textColor: "text-indigo-600 dark:text-indigo-400"
        };
        break;
      case 'LOAD_STATUS_UPDATE':
        iconDetails = {
          icon: <TruckIcon size={16} />,
          bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
          textColor: "text-cyan-600 dark:text-cyan-400"
        };
        break;
      case 'MAINTENANCE_DUE':
        iconDetails = {
          icon: <Wrench size={16} />,
          bgColor: "bg-amber-100 dark:bg-amber-900/30",
          textColor: "text-amber-600 dark:text-amber-400"
        };
        break;
      case 'SYSTEM_ERROR':
        iconDetails = {
          icon: <ServerCrash size={16} />,
          bgColor: "bg-red-100 dark:bg-red-900/30",
          textColor: "text-red-700 dark:text-red-400"
        };
        break;
      case 'GENERAL_REMINDER':
        iconDetails = {
          icon: <Bell size={16} />,
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          textColor: "text-blue-600 dark:text-blue-400"
        };
        break;
      case 'INVOICE_OVERDUE':
      case 'PAYMENT_RECEIVED':
        iconDetails = {
          icon: <CreditCard size={16} />,
          bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
          textColor: "text-emerald-600 dark:text-emerald-400"
        };
        break;
      case 'FUEL_REMINDER':
        iconDetails = {
          icon: <Fuel size={16} />,
          bgColor: "bg-orange-100 dark:bg-orange-900/30",
          textColor: "text-orange-600 dark:text-orange-400"
        };
        break;
      default:
        // Default based on urgency
        if (notification.urgency === 'HIGH' || notification.urgency === 'CRITICAL') {
          iconDetails = {
            icon: <AlertTriangle size={16} />,
            bgColor: "bg-red-100 dark:bg-red-900/30",
            textColor: "text-red-600 dark:text-red-400"
          };
        } else if (notification.urgency === 'MEDIUM') {
          iconDetails = {
            icon: <AlertCircle size={16} />,
            bgColor: "bg-amber-100 dark:bg-amber-900/30",
            textColor: "text-amber-600 dark:text-amber-400"
          };
        } else if (notification.urgency === 'LOW') {
          iconDetails = {
            icon: <Info size={16} />,
            bgColor: "bg-green-100 dark:bg-green-900/30",
            textColor: "text-green-600 dark:text-green-400"
          };
        }
        break;
    }

    return (
      <div className={`p-2 rounded-lg ${iconDetails.bgColor} ${iconDetails.textColor}`}>
        {iconDetails.icon}
      </div>
    );
  };

  const getUrgencyBadge = () => {
    if (!notification.urgency || notification.urgency === 'NORMAL' || notification.urgency === 'LOW') {
      return null;
    }

    const badges = {
      CRITICAL: {
        text: t('notifications.urgency.critical'),
        className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      },
      HIGH: {
        text: t('notifications.urgency.highPriority'),
        className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
      },
      MEDIUM: {
        text: t('notifications.urgency.medium'),
        className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      }
    };

    const badge = badges[notification.urgency];
    if (!badge) return null;

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const handleClick = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.link_to) {
      router.push(notification.link_to);
    }
  };

  const handleMarkAsReadClick = (e) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor((now - date) / (1000 * 60));
      return minutes <= 1 ? t('notifications.time.justNow') : t('notifications.time.minutesAgo', { count: minutes });
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return hours === 1 ? t('notifications.time.hourAgo') : t('notifications.time.hoursAgo', { count: hours });
    } else if (diffInHours < 48) {
      return t('notifications.time.yesterday');
    } else {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      onClick={handleClick}
      className={`px-3 py-2.5 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
        !notification.is_read
          ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-3 border-blue-500'
          : 'bg-white dark:bg-gray-800 border-l-3 border-transparent'
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-1.5 mb-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className={`text-sm font-semibold break-words leading-tight ${
                !notification.is_read
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {notification.link_to ? (
                  <Link
                    href={notification.link_to}
                    className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!notification.is_read && onMarkAsRead) {
                        onMarkAsRead(notification.id);
                      }
                    }}
                  >
                    {notification.title}
                  </Link>
                ) : (
                  notification.title
                )}
              </h4>
              {getUrgencyBadge()}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {!notification.is_read && (
                <button
                  onClick={handleMarkAsReadClick}
                  className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  title={t('notifications.markAsRead')}
                >
                  <CheckCircle size={16} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                  title={t('notifications.deleteNotification')}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Message */}
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 break-words line-clamp-2">
            {notification.message}
          </p>

          {/* Footer - Metadata */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-0.5">
              <Clock size={10} />
              {formatDate(notification.created_at)}
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              {formatTime(notification.created_at)}
            </span>
            {notification.due_date && (
              <>
                <span>·</span>
                <span className={`font-medium flex items-center gap-0.5 ${
                  new Date(notification.due_date) < new Date()
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  <CalendarClock size={10} />
                  {t('notifications.due')} {new Date(notification.due_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationListItemSkeleton() {
  return (
    <div className="px-3 py-2.5 bg-white dark:bg-gray-800 animate-pulse">
      <div className="flex items-start space-x-3">
        {/* Icon skeleton */}
        <div className="rounded-lg bg-gray-200 dark:bg-gray-700 h-8 w-8 flex-shrink-0"></div>

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header row */}
          <div className="flex justify-between items-start">
            <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>

          {/* Message line */}
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>

          {/* Footer */}
          <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}

export default NotificationListItem;
