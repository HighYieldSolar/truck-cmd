"use client";

import { useSubscription } from "@/context/SubscriptionContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const ProtectedRoute = ({ children }) => {
  const { isSubscriptionActive, loading } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      const isProtected =
        pathname.startsWith("/dashboard/dispatching") ||
        pathname.startsWith("/dashboard/mileage") ||
        pathname.startsWith("/dashboard/invoices") ||
        pathname.startsWith("/dashboard/expenses") ||
        pathname.startsWith("/dashboard/customers") ||
        pathname.startsWith("/dashboard/fleet") ||
        pathname.startsWith("/dashboard/compliance") ||
        pathname.startsWith("/dashboard/ifta") ||
        pathname.startsWith("/dashboard/fuel");

      if (isProtected && !isSubscriptionActive()) {
        router.push("/dashboard/billing");
      }
    }
  }, [isSubscriptionActive, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;