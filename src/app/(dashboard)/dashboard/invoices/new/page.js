"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import { duplicateInvoice } from "@/lib/services/invoiceService";
import { RefreshCw } from "lucide-react";

export default function NewInvoicePage() {
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
              // Any additional overrides can go here
            });
            
            if (duplicateData) {
              setInitialData(duplicateData);
            }
          } catch (duplicateError) {
            console.error('Error duplicating invoice:', duplicateError);
            // Continue without initial data if duplication fails
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing:', error);
        setLoading(false);
      }
    }
    
    initialize();
  }, [duplicateId]);

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
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center">
            <Link
              href="/dashboard/invoices"
              className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {duplicateId ? 'Duplicate Invoice' : 'Create New Invoice'}
            </h1>
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