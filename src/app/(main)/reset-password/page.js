"use client";

import { Suspense } from "react";
import ResetPassword from "@/components/auth/ResetPassword";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Suspense fallback={<p className="text-center">Loading...</p>}>
        <ResetPassword />
      </Suspense>
    </div>
  );
}