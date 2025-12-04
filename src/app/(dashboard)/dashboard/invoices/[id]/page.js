"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InvoiceDetail from "@/components/invoices/InvoiceDetail";
import { RefreshCw } from "lucide-react";

export default function InvoiceDetailPage({ params }) {
  const { id: invoiceId } = use(params);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      try {
        // Get current user
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (!user) {
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
        setLoading(false);
      } catch (error) {
        // Auth error handled by redirect
        setLoading(false);
      }
    }
    
    getUser();
  }, []);

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
        <InvoiceDetail invoiceId={invoiceId} />
      </main>
    </DashboardLayout>
  );
}