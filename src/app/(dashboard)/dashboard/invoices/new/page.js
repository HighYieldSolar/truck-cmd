"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import { ChevronLeft } from "lucide-react";
import { createInvoice } from "@/lib/services/invoiceService";
import InvoiceForm from "@/components/invoices/InvoiceForm";

export default function NewInvoicePage() {
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
        <header className="flex items-center justify-between p-4 bg-white shadow-sm">
          <div className="flex items-center">
            <Link 
              href="/dashboard/invoices" 
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Create New Invoice</h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          <InvoiceForm userId={user.id} />
        </main>
      </div>
    </div>
  );
}