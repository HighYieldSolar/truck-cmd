"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ChevronLeft, FileText, RefreshCw } from "lucide-react";
import Link from "next/link";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import { duplicateInvoice } from "@/lib/services/invoiceService";
import { useTranslation } from "@/context/LanguageContext";

export default function NewInvoicePage() {
  const { t } = useTranslation('invoices');
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicate');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);

        // Get current user
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (!user) {
          window.location.href = '/login';
          return;
        }

        setUser(user);

        // If duplicating an existing invoice, get its data
        if (duplicateId) {
          try {
            const duplicateData = await duplicateInvoice(duplicateId, {
              user_id: user.id,
            });

            if (duplicateData) {
              setInitialData(duplicateData);
            }
          } catch (duplicateError) {
            // Failed to duplicate invoice, continue with blank form
          }
        }

        setLoading(false);
      } catch (error) {
        // Initialization failed
        setLoading(false);
      }
    }

    initialize();
  }, [duplicateId]);

  if (loading) {
    return (
      <DashboardLayout activePage="invoices">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-center min-h-[60vh]">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="invoices">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center">
              <Link
                href="/dashboard/invoices"
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
                    {duplicateId ? t('newPage.duplicateInvoice') : t('newPage.createNewInvoice')}
                  </h1>
                  <p className="text-blue-100">
                    {duplicateId ? t('newPage.duplicateDescription') : t('newPage.createDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <InvoiceForm
            userId={user.id}
            initialData={initialData}
            isDuplicating={!!duplicateId}
          />
        </div>
      </main>
    </DashboardLayout>
  );
}