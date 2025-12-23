"use client";

import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import { useTranslation } from "@/context/LanguageContext";

export default function PaymentDueSoonComponent({ invoices, onViewInvoice }) {
  const { t } = useTranslation('invoices');

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-6">
      <div className="bg-blue-500 px-5 py-4 text-white">
        <h3 className="font-semibold flex items-center">
          <Calendar size={18} className="mr-2" />
          {t('sidebar.paymentsDueSoon')}
        </h3>
      </div>
      <div className="p-4">
        {invoices.length === 0 ? (
          <div className="text-gray-500 text-center py-6">
            {t('sidebar.noPaymentsDueSoon')}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {invoices.map((invoice) => {
              const dueDate = new Date(invoice.due_date);
              const today = new Date();
              const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

              return (
                <li
                  key={`due-soon-invoice-${invoice.id}`}
                  className="border-b border-gray-200 pb-2 pt-2 last:border-b-0 last:pb-0"
                  onClick={() => onViewInvoice(invoice.id)}
                >
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="text-gray-900">
                      <div className="font-medium">
                        {invoice.customer}
                      </div>
                      <div className="text-sm text-gray-500">
                        {daysUntilDue === 0 ? t('sidebar.dueToday') : t('sidebar.dueInDays', { days: daysUntilDue })} ({formatDate(invoice.due_date)})
                      </div>
                    </div>
                    <div className="flex items-center">
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {invoices.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-center">
            <Link
              href="/dashboard/invoices?filter=pending"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center w-full"
            >
              {t('sidebar.viewAllPending')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 