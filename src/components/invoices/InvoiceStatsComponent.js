"use client";

import { FileText, CheckCircle, Clock, AlertCircle, PenTool } from "lucide-react";

export default function InvoiceStatsComponent({ stats, formatCurrency }) {
  // Format currency if not provided externally
  const formatCurrencyFn = formatCurrency || ((amount) => {
    return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Total Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrencyFn(stats.total)}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl">
            <FileText size={20} className="text-blue-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">All invoices ({stats.paid + stats.pending + stats.overdue + stats.draftCount})</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.paid}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-xl">
            <CheckCircle size={20} className="text-green-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">Completed invoices</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-orange-500 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-xl">
            <Clock size={20} className="text-orange-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">Awaiting payment</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Overdue</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdue}</p>
          </div>
          <div className="bg-red-100 p-3 rounded-xl">
            <AlertCircle size={20} className="text-red-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">Past due date</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Draft</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.draftCount}</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-xl">
            <PenTool size={20} className="text-purple-600" />
          </div>
        </div>
        <div className="px-4 py-2 bg-gray-50">
          <span className="text-xs text-gray-500">Not yet sent</span>
        </div>
      </div>
    </div>
  );
} 