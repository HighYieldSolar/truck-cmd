"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import InvoiceStatusBadge from "./InvoiceStatusBadge";

export default function OverdueInvoicesComponent({ invoices, onViewInvoice }) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate days overdue
  const getDaysOverdue = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((today - due) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-6">
      <div className="bg-blue-500 px-5 py-4 text-white">
        <h3 className="font-semibold flex items-center">
          <AlertCircle size={18} className="mr-2" />
          Overdue Invoices
        </h3>
      </div>
      <div className="p-4">
        {invoices.length === 0 ? (
          <div className="text-gray-500 text-center py-6">
            No overdue invoices
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {invoices.map((invoice) => {
              const daysOverdue = getDaysOverdue(invoice.due_date);
              return (
                <li
                  key={`overdue-invoice-${invoice.id}`}
                  className="border-b border-gray-200 pb-2 pt-2 last:border-b-0 last:pb-0"
                  onClick={() => onViewInvoice(invoice.id)}
                >
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="text-gray-900">
                      <div className="font-medium">
                        {invoice.customer}
                      </div>
                      <div className="text-sm text-gray-500">
                        Due: {formatDate(invoice.due_date)} ({daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue)
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
              href="/dashboard/invoices?filter=overdue"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center w-full"
            >
              View all overdue invoices
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 