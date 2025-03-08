"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import InvoiceDetail from "@/components/invoices/InvoiceDetail";

export default function InvoiceDetailPage({ params }) {
  const invoiceId = params.id;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (!user) {
          window.location.href = '/login';
          return;
        }
        
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    }
    
    getUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar activePage="invoices" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <InvoiceDetail invoiceId={invoiceId} />
        </main>
      </div>
    </div>
  );
}