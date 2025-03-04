// src/app/(dashboard)/layout.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkUser() {
      try {
        setLoading(true);
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          // If no authenticated user, redirect to login
          router.push('/login');
          return;
        }
        
        setUser(user);
      } catch (error) {
        console.error('Error checking authentication:', error);
        // If error, redirect to login
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}