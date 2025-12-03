"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import { getInvoiceById } from "@/lib/services/invoiceService";
import { ChevronLeft, FileText, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function EditInvoicePage({ params }) {
  const { id: invoiceId } = use(params);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          window.location.href = '/login';
          return;
        }

        setUser(user);

        // Fetch the invoice
        const invoice = await getInvoiceById(invoiceId);

        if (!invoice) {
          setError('Invoice not found');
          setLoading(false);
          return;
        }

        // Check if user owns this invoice
        if (invoice.user_id !== user.id) {
          setError('You do not have permission to edit this invoice');
          setLoading(false);
          return;
        }

        // Transform the invoice data to match InvoiceForm expected format
        const formattedInvoice = {
          id: invoice.id,
          invoice_number: invoice.invoice_number || '',
          customer: invoice.customer || '',
          customer_email: invoice.customer_email || '',
          customer_address: invoice.customer_address || '',
          invoice_date: invoice.invoice_date
            ? new Date(invoice.invoice_date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          due_date: invoice.due_date
            ? new Date(invoice.due_date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          status: invoice.status || 'Draft',
          payment_terms: invoice.payment_terms || 'Net 15',
          po_number: invoice.po_number || '',
          subtotal: invoice.subtotal || 0,
          tax_rate: invoice.tax_rate || 0,
          tax_amount: invoice.tax_amount || 0,
          total: invoice.total || 0,
          notes: invoice.notes || '',
          terms: invoice.terms || 'Payment is due within 15 days of invoice date.',
          load_id: invoice.load_id || '',
          items: invoice.items && invoice.items.length > 0
            ? invoice.items.map(item => ({
                id: item.id,
                description: item.description || '',
                quantity: item.quantity || 1,
                unit_price: item.unit_price || 0
              }))
            : [{ description: '', quantity: 1, unit_price: 0 }]
        };

        setInvoiceData(formattedInvoice);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing edit page:', err);
        setError(err.message || 'Failed to load invoice');
        setLoading(false);
      }
    }

    initialize();
  }, [invoiceId]);

  if (loading) {
    return (
      <DashboardLayout activePage="invoices">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <RefreshCw size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading invoice...</p>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activePage="invoices">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Unable to Load Invoice
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <div className="flex gap-3">
                  <Link
                    href="/dashboard/invoices"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors inline-flex items-center"
                  >
                    <ChevronLeft size={16} className="mr-2" />
                    Back to Invoices
                  </Link>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="invoices">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-700 dark:to-amber-600 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center">
              <Link
                href={`/dashboard/invoices/${invoiceId}`}
                className="mr-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <ChevronLeft size={20} className="text-white" />
              </Link>
              <div className="flex items-center">
                <div className="p-3 bg-white/20 rounded-xl mr-4">
                  <FileText size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Edit Invoice
                  </h1>
                  <p className="text-amber-100">
                    {invoiceData?.invoice_number} - {invoiceData?.customer}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200">Editing Invoice</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  You&apos;re editing an existing invoice. Changes will update the invoice and any line items.
                  The invoice number cannot be changed.
                </p>
              </div>
            </div>
          </div>

          <InvoiceForm
            userId={user.id}
            initialData={invoiceData}
            isDuplicating={false}
          />
        </div>
      </main>
    </DashboardLayout>
  );
}
