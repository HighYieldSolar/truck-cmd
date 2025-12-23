"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart2,
  PieChart,
  Calendar
} from "lucide-react";
import { getInvoiceStats } from "@/lib/services/invoiceService";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "@/context/LanguageContext";

/**
 * Invoice Statistics Dashboard Component
 * Displays summary metrics and charts for invoice data
 */
export default function InvoiceStatsDashboard({ period = "month" }) {
  const { t } = useTranslation('invoices');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    count: 0
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          // If running on client-side and no user, redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return;
        }
        
        setUser(user);
        
        // Fetch invoice statistics
        const invoiceStats = await getInvoiceStats(user.id);
        setStats(invoiceStats);
      } catch (err) {
        setError(t('statsDashboard.failedToLoad'));
      } finally {
        setLoading(false);
      }
    }
    
    loadStats();
  }, [period]);

  // Format currency
  const formatCurrency = (value) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Stat Card Component
  const StatCard = ({ title, value, icon, bgColor, textColor }) => {
    return (
      <div className={`${bgColor} rounded-lg shadow p-5`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-semibold ${textColor} mt-1`}>{value}</p>
          </div>
          <div className="rounded-md p-2 bg-white bg-opacity-30">
            {icon}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-pulse">
        {Array(4).fill(0).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded-full mb-2"></div>
                <div className="h-8 w-32 bg-gray-200 rounded-full"></div>
              </div>
              <div className="rounded-md p-2 h-10 w-10 bg-gray-200"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('statsDashboard.totalInvoices')}
          value={formatCurrency(stats.total)}
          icon={<DollarSign size={22} className="text-gray-600" />}
          bgColor="bg-white"
          textColor="text-gray-900"
        />
        <StatCard
          title={t('statsDashboard.paid')}
          value={formatCurrency(stats.paid)}
          icon={<CheckCircle size={22} className="text-green-600" />}
          bgColor="bg-green-50"
          textColor="text-green-700"
        />
        <StatCard
          title={t('statsDashboard.pending')}
          value={formatCurrency(stats.pending)}
          icon={<Clock size={22} className="text-yellow-600" />}
          bgColor="bg-yellow-50"
          textColor="text-yellow-700"
        />
        <StatCard
          title={t('statsDashboard.overdue')}
          value={formatCurrency(stats.overdue)}
          icon={<AlertCircle size={22} className="text-red-600" />}
          bgColor="bg-red-50"
          textColor="text-red-700"
        />
      </div>

      {/* Invoice Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('statsDashboard.invoiceStatus')}</h3>
          <div className="flex justify-between items-center">
            {/* Simplified visual representation of invoice distribution */}
            <div className="w-full h-8 rounded-full bg-gray-100 flex overflow-hidden">
              {stats.total > 0 && (
                <>
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(stats.paid / stats.total) * 100}%` }}
                    title={`${t('statsDashboard.paid')}: ${formatCurrency(stats.paid)}`}
                  ></div>
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                    title={`${t('statsDashboard.pending')}: ${formatCurrency(stats.pending)}`}
                  ></div>
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${(stats.overdue / stats.total) * 100}%` }}
                    title={`${t('statsDashboard.overdue')}: ${formatCurrency(stats.overdue)}`}
                  ></div>
                </>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
              <span className="text-sm text-gray-600">{t('statsDashboard.paid')} ({stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%)</span>
            </div>
            <div>
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
              <span className="text-sm text-gray-600">{t('statsDashboard.pending')} ({stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)</span>
            </div>
            <div>
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
              <span className="text-sm text-gray-600">{t('statsDashboard.overdue')} ({stats.total > 0 ? Math.round((stats.overdue / stats.total) * 100) : 0}%)</span>
            </div>
          </div>
        </div>

        {/* Invoice Aging Summary */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('statsDashboard.invoiceSummary')}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Calendar size={18} className="text-blue-600 mr-2" />
                <span className="text-gray-600">{t('statsDashboard.totalInvoicesLabel')}</span>
              </div>
              <span className="font-semibold">{stats.count}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <DollarSign size={18} className="text-green-600 mr-2" />
                <span className="text-gray-600">{t('statsDashboard.averageInvoiceValue')}</span>
              </div>
              <span className="font-semibold">
                {stats.count > 0
                  ? formatCurrency(stats.total / stats.count)
                  : formatCurrency(0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <CheckCircle size={18} className="text-green-600 mr-2" />
                <span className="text-gray-600">{t('statsDashboard.collectionRate')}</span>
              </div>
              <span className="font-semibold">
                {stats.total > 0
                  ? `${Math.round((stats.paid / stats.total) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <AlertCircle size={18} className="text-red-600 mr-2" />
                <span className="text-gray-600">{t('statsDashboard.outstandingBalance')}</span>
              </div>
              <span className="font-semibold text-red-600">
                {formatCurrency(stats.pending + stats.overdue)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}