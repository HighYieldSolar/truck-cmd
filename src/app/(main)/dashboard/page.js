"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import StatsOverview from "@/components/dashboard/StatsOverview";
import RecentInvoices from "@/components/dashboard/RecentInvoices";

export default function Dashboard() {
  const [stats, setStats] = useState({
    earnings: 12500,
    expenses: 3200,
    activeLoads: 8
  });
  
  const [recentInvoices, setRecentInvoices] = useState([
    { id: 1, number: '12345', amount: 1200 },
    { id: 2, number: '12346', amount: 950 },
    { id: 3, number: '12347', amount: 2100 }
  ]);
  
  // In a real app, you would fetch this data from your API/database
  useEffect(() => {
    // Example of how you might fetch data
    async function fetchDashboardData() {
      try {
        // Uncomment and adapt when ready to implement
        /*
        const { data: statsData, error: statsError } = await supabase
          .from('dashboard_stats')
          .select('*')
          .single();
          
        if (statsError) throw statsError;
        
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (invoicesError) throw invoicesError;
        
        setStats(statsData);
        setRecentInvoices(invoicesData);
        */
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    }
    
    // fetchDashboardData();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <DashboardSidebar activePage="dashboard" />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

        {/* Stats Overview */}
        <StatsOverview 
          earnings={stats.earnings}
          expenses={stats.expenses}
          activeLoads={stats.activeLoads}
        />

        {/* Recent Activity */}
        <RecentInvoices invoices={recentInvoices} />
      </div>
    </div>
  );
}