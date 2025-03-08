"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InvoiceDetail from "@/components/invoices/InvoiceDetail";
import { RefreshCw } from "lucide-react";

export default function InvoiceDetailPage({ params }) {
  const invoiceId = params.id;
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
        console.error('Error getting user:', error);
        setLoading(false);
      }
    }
    
    getUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <DashboardLayout activePage="invoices">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
        <InvoiceDetail invoiceId={invoiceId} />
      </main>
    </DashboardLayout>
  );
}