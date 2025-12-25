"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

/**
 * Legacy billing page - redirects to the secure Stripe Checkout flow
 * This page previously handled raw card data which is a PCI violation.
 * All billing is now handled through Stripe's secure checkout.
 */
export default function BillingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the proper upgrade page with Stripe Checkout
    router.replace("/dashboard/upgrade");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <RefreshCw size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Redirecting to billing...</p>
      </div>
    </div>
  );
}