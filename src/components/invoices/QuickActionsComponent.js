"use client";

import Link from "next/link";
import { Plus, DollarSign, FileText, BarChart2, Mail, Printer, Download } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function QuickActionsComponent({ onCreateInvoice, onExportData }) {
  const { t } = useTranslation('invoices');

  const actions = [
    {
      id: 'create',
      name: t('quickActions.createInvoice'),
      icon: <Plus className="h-5 w-5 text-blue-600" />,
      onClick: onCreateInvoice,
      href: '/dashboard/invoices/new'
    },
    {
      id: 'payment',
      name: t('quickActions.recordPayment'),
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      href: '/dashboard/invoices?filter=pending'
    },
    {
      id: 'draft',
      name: t('quickActions.draftInvoices'),
      icon: <FileText className="h-5 w-5 text-purple-600" />,
      href: '/dashboard/invoices?filter=draft'
    },
    {
      id: 'remind',
      name: t('quickActions.sendReminders'),
      icon: <Mail className="h-5 w-5 text-orange-600" />,
      href: '/dashboard/invoices?filter=overdue'
    },
    {
      id: 'reports',
      name: t('quickActions.invoiceReports'),
      icon: <BarChart2 className="h-5 w-5 text-indigo-600" />,
      href: '#'
    },
    {
      id: 'export',
      name: t('quickActions.exportInvoices'),
      icon: <Download className="h-5 w-5 text-cyan-600" />,
      onClick: onExportData
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-6">
      <div className="bg-blue-500 px-5 py-4 text-white">
        <h3 className="font-semibold flex items-center">
          <FileText size={18} className="mr-2" />
          {t('quickActions.title')}
        </h3>
      </div>
      <div className="p-4">
        {actions.map(action => (
          action.onClick ? (
            <button
              key={action.id}
              onClick={action.onClick}
              className="mb-3 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors bg-gray-50 hover:bg-blue-50 w-full"
            >
              <div className="flex items-center">
                <div className="rounded-md bg-white p-2 shadow-sm">
                  {action.icon}
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700">{action.name}</span>
              </div>
            </button>
          ) : (
            <Link
              key={action.id}
              href={action.href}
              className="mb-3 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors bg-gray-50 hover:bg-blue-50 w-full"
            >
              <div className="flex items-center">
                <div className="rounded-md bg-white p-2 shadow-sm">
                  {action.icon}
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700">{action.name}</span>
              </div>
            </Link>
          )
        ))}
        <div className="mt-2 pt-2 border-t border-gray-200 text-center">
          <Link
            href="/dashboard/invoices/new"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center w-full"
          >
            {t('quickActions.createNewInvoice')}
            <Plus size={14} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
} 