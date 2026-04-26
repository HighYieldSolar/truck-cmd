"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  DollarSign,
  Filter,
  Search,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  X
} from "lucide-react";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import { TableActionsDropdown } from "@/components/shared/TableActions";
import { useTranslation } from "@/context/LanguageContext";
import QuickBooksSyncBadge from "@/components/expenses/QuickBooksSyncBadge";
import { useQuickBooksSyncStatus } from "@/hooks/useQuickBooksSyncStatus";

// Invoice Filters Component
const InvoiceFilters = ({ filters, setFilters, onApplyFilters }) => {
  const { t } = useTranslation('invoices');

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      status: 'all',
      dateRange: 'all',
      search: '',
      sortBy: 'invoice_date',
      sortDirection: 'desc'
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const statusOptions = [
    { value: 'all', label: t('filters.allInvoices') },
    { value: 'paid', label: t('status.paid') },
    { value: 'pending', label: t('common:status.pending') },
    { value: 'overdue', label: t('status.overdue') },
    { value: 'draft', label: t('status.draft') },
    { value: 'sent', label: t('status.sent') }
  ];

  const dateRangeOptions = [
    { value: 'all', label: t('filters.allTime') },
    { value: 'last30', label: t('filters.last30') },
    { value: 'last90', label: t('filters.last90') },
    { value: 'thisMonth', label: t('filters.thisMonth') },
    { value: 'lastMonth', label: t('filters.lastMonth') },
    { value: 'thisYear', label: t('filters.thisYear') },
  ];

  const sortOptions = [
    { value: 'invoice_date', label: t('list.invoiceDate') },
    { value: 'due_date', label: t('list.dueDate') },
    { value: 'total', label: t('list.amount') },
    { value: 'status', label: t('list.status') },
    { value: 'customer', label: t('list.customer') }
  ];

  const inputBase =
    "w-full min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelBase = "block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1";

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.dateRange !== 'all' ||
    (filters.search && filters.search.length > 0);

  // Apply filters live as user changes them
  const handleLiveChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onApplyFilters(next);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 space-y-3">
      {/* Search row — primary affordance */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleLiveChange('search', e.target.value)}
          className={`${inputBase} pl-10`}
          placeholder={t('filters.searchPlaceholder')}
          aria-label={t('list.search')}
        />
      </div>

      {/* Filter dropdowns — 2-col mobile, 3-col desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="min-w-0">
          <label className={labelBase}>{t('list.status')}</label>
          <select
            name="status"
            value={filters.status}
            onChange={(e) => handleLiveChange('status', e.target.value)}
            className={inputBase}
          >
            <option value="all">{t('list.allStatuses')}</option>
            {statusOptions.filter(option => option.value !== 'all').map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label className={labelBase}>{t('list.dateRange')}</label>
          <select
            name="dateRange"
            value={filters.dateRange}
            onChange={(e) => handleLiveChange('dateRange', e.target.value)}
            className={inputBase}
          >
            <option value="all">{t('filters.allTime')}</option>
            {dateRangeOptions.filter(option => option.value !== 'all').map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="min-w-0 col-span-2 sm:col-span-1">
          <label className={labelBase}>{t('list.sortBy')}</label>
          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={(e) => handleLiveChange('sortBy', e.target.value)}
            className={inputBase}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <SlidersHorizontal className="h-3 w-3" />
            Filters active
          </span>
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <X className="h-4 w-4" />
            <span>{t('list.resetFilters')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default function InvoiceListComponent({
  invoices,
  handleViewInvoice,
  handleMarkAsPaid,
  handleDeleteInvoice,
  filters,
  setFilters,
  onApplyFilters,
  loading
}) {
  const { t } = useTranslation('invoices');

  // Get invoice IDs for sync status lookup
  const invoiceIds = useMemo(
    () => invoices.map(inv => inv.id),
    [invoices]
  );

  // QuickBooks sync status
  const {
    isConnected: isQBConnected,
    getSyncRecord,
    syncEntity: syncInvoiceToQB,
    isSyncing: isInvoiceSyncing
  } = useQuickBooksSyncStatus('invoice', invoiceIds);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      {/* Filters component */}
      <InvoiceFilters
        filters={filters}
        setFilters={setFilters}
        onApplyFilters={onApplyFilters}
      />

      {/* Invoice Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 mb-6">
        <div className="bg-blue-500 px-5 py-4 text-white">
          <h3 className="font-semibold flex items-center">
            <FileText size={18} className="mr-2" />
            {t('list.invoiceRecords')}
          </h3>
        </div>

        {/* Invoice List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('list.invoice')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('list.customer')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('list.invoiceDate')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('list.dueDate')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('list.amount')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('list.status')}
                </th>
                {isQBConnected && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QuickBooks
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('list.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isQBConnected ? 8 : 7} className="px-6 py-10 text-center">
                    <RefreshCw size={32} className="mx-auto text-blue-500 animate-spin" />
                    <p className="mt-2 text-gray-500">{t('list.loadingInvoices')}</p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={isQBConnected ? 8 : 7} className="px-6 py-12 text-center">
                    <div className="max-w-sm mx-auto">
                      <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{t('list.noInvoicesFound')}</h3>
                      <p className="text-gray-500 mb-4">{t('list.createFirstInvoice')}</p>
                      <Link
                        href="/dashboard/invoices/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus size={16} className="mr-2" />
                        {t('list.createInvoice')}
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <a
                        onClick={() => handleViewInvoice(invoice.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      >
                        {t('list.invoice')} #{invoice.invoice_number}
                      </a>
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {invoice.customer}
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {formatDate(invoice.invoice_date)}
                    </td>

                    <td className="px-6 py-4 text-gray-900">
                      {formatDate(invoice.due_date)}
                    </td>

                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {formatCurrency(invoice.total)}
                    </td>

                    <td className="px-6 py-4">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>

                    {isQBConnected && (
                      <td className="px-6 py-4">
                        <QuickBooksSyncBadge
                          syncRecord={getSyncRecord(invoice.id)}
                          isConnected={isQBConnected}
                          entityType="invoice"
                          entityId={invoice.id}
                          onSync={syncInvoiceToQB}
                          syncing={isInvoiceSyncing(invoice.id)}
                          compact={false}
                        />
                      </td>
                    )}

                    <td className="px-6 py-4 text-center">
                      <TableActionsDropdown
                        onView={() => handleViewInvoice(invoice.id)}
                        onDelete={() => handleDeleteInvoice(invoice)}
                        customActions={invoice.status !== 'paid' ? [
                          {
                            icon: DollarSign,
                            onClick: () => handleMarkAsPaid(invoice.id),
                            label: t('actions.markAsPaid'),
                            color: "green"
                          }
                        ] : []}
                        size="md"
                        buttonStyle="dots"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {invoices.length === 1 ? t('list.showingInvoices', { count: invoices.length }) : t('list.showingInvoicesPlural', { count: invoices.length })}
          </div>
          <div>
            {/* Pagination controls would go here */}
          </div>
        </div>
      </div>
    </>
  );
} 