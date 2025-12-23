// src/components/dispatching/LoadCard.js
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  MapPin,
  Calendar,
  ArrowRight,
  Truck,
  DollarSign,
  CheckCircle,
  Users,
  Package,
  AlertCircle,
  Phone,
  MessageSquare,
  Navigation
} from "lucide-react";
import StatusBadge from './StatusBadge';
import { formatDateForDisplayMMDDYYYY } from "@/lib/utils/dateUtils";
import TableActions from "@/components/shared/TableActions";
import { useTranslation } from "@/context/LanguageContext";

export default function LoadCard({ load, onSelect, onEdit, onDelete }) {
  const { t } = useTranslation('dispatching');
  const [driverPhone, setDriverPhone] = useState(null);

  // Fetch driver phone number if driver is assigned
  useEffect(() => {
    const fetchDriverPhone = async () => {
      const driverId = load.driver_id || load.driverId;
      if (!driverId) {
        setDriverPhone(null);
        return;
      }

      try {
        const { data } = await supabase
          .from('drivers')
          .select('phone, name')
          .eq('id', driverId)
          .single();

        if (data?.phone) {
          setDriverPhone(data);
        }
      } catch (err) {
        // Silently fail
      }
    };

    fetchDriverPhone();
  }, [load.driver_id, load.driverId]);

  // Quick action handlers
  const handleCall = (e) => {
    e.stopPropagation();
    if (driverPhone?.phone) {
      const phone = driverPhone.phone.replace(/\D/g, '');
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleMessage = (e) => {
    e.stopPropagation();
    if (driverPhone?.phone) {
      const phone = driverPhone.phone.replace(/\D/g, '');
      const message = encodeURIComponent(
        `Hi ${driverPhone.name || 'Driver'}, this is about Load #${load.loadNumber || load.load_number}.`
      );
      window.open(`sms:${phone}?body=${message}`, '_self');
    }
  };

  const handleDirections = (e) => {
    e.stopPropagation();
    const address = load.destination || load.origin;
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return '$' + parseFloat(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <Package size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 min-w-0">
              <button
                onClick={() => onSelect(load)}
                className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block"
              >
                #{load.loadNumber || load.load_number}
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {load.customer}
              </div>
            </div>
          </div>
          <StatusBadge status={load.status} size="sm" />
        </div>
      </div>

      {/* Route Information */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <MapPin size={14} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
          <span className="ml-1 flex-1 truncate">{load.origin}</span>
          <ArrowRight size={14} className="mx-2 text-gray-400 dark:text-gray-500" />
          <MapPin size={14} className="text-red-500 dark:text-red-400 flex-shrink-0" />
          <span className="ml-1 flex-1 truncate text-right">{load.destination}</span>
        </div>
      </div>

      {/* Card Body - Details Grid */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Pickup Date */}
          <div className="flex items-center">
            <Calendar size={14} className="text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('loadCard.pickup')}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatDate(load.pickupDate || load.pickup_date)}
              </div>
            </div>
          </div>

          {/* Delivery Date */}
          <div className="flex items-center">
            <Calendar size={14} className="text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('loadCard.delivery')}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatDate(load.deliveryDate || load.delivery_date)}
              </div>
            </div>
          </div>

          {/* Driver */}
          <div className="flex items-center">
            <Users size={14} className="text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('loadCard.driver')}</div>
              <div className={`text-sm font-medium ${load.driver ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                {load.driver || t('loadCard.unassigned')}
              </div>
            </div>
          </div>

          {/* Rate */}
          <div className="flex items-center">
            <DollarSign size={14} className="text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('loadCard.rate')}</div>
              <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency(load.rate)}
              </div>
            </div>
          </div>
        </div>

        {/* Truck Info */}
        {(load.truckInfo || load.truck_info) && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 flex items-center">
            <Truck size={14} className="text-gray-400 dark:text-gray-500 mr-2" />
            <span className="truncate">{load.truckInfo || load.truck_info}</span>
          </div>
        )}

        {/* Completion Info */}
        {load.status === "Completed" && load.completedAt && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
            <CheckCircle size={14} className="mr-2" />
            {t('loadCard.completedOn')} {formatDateForDisplayMMDDYYYY(load.completedAt)}
          </div>
        )}

        {/* Delayed Status */}
        {load.status === "Delayed" && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-orange-600 dark:text-orange-400 flex items-center">
            <AlertCircle size={14} className="mr-2" />
            {t('loadCard.delayedMessage')}
          </div>
        )}
      </div>

      {/* Card Footer - Actions */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center">
          {load.status === "Completed" ? (
            <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded-full">
              <CheckCircle size={12} className="mr-1" />
              {t('statusLabels.completed')}
            </span>
          ) : load.status === "Cancelled" ? (
            <span className="inline-flex items-center text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 px-2 py-1 rounded-full">
              {t('statusLabels.cancelled')}
            </span>
          ) : (
            <Link
              href={`/dashboard/dispatching/complete/${load.id}`}
              className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <CheckCircle size={14} className="mr-1" />
              {t('loadCard.markComplete')}
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {/* Quick Actions */}
          <button
            onClick={handleCall}
            disabled={!driverPhone?.phone}
            className={`p-2 rounded-lg transition-colors ${
              driverPhone?.phone
                ? 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/40'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
            title={driverPhone?.phone ? `${t('loadCard.callDriver')} ${driverPhone.name || t('loadCard.driver')}` : t('loadCard.noDriverPhone')}
          >
            <Phone size={16} />
          </button>
          <button
            onClick={handleMessage}
            disabled={!driverPhone?.phone}
            className={`p-2 rounded-lg transition-colors ${
              driverPhone?.phone
                ? 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
            title={driverPhone?.phone ? `${t('loadCard.messageDriver')} ${driverPhone.name || t('loadCard.driver')}` : t('loadCard.noDriverPhone')}
          >
            <MessageSquare size={16} />
          </button>
          <button
            onClick={handleDirections}
            disabled={!load.destination && !load.origin}
            className={`p-2 rounded-lg transition-colors ${
              load.destination || load.origin
                ? 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
            title={t('loadCard.getDirections')}
          >
            <Navigation size={16} />
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1"></div>
          <TableActions
            onView={() => onSelect(load)}
            onDelete={() => onDelete(load)}
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for the card
export function LoadCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-pulse">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
            <div className="ml-3">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-600 rounded"></div>
      </div>
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded mr-2"></div>
              <div>
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex space-x-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
