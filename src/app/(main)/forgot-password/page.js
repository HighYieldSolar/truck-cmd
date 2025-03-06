// src/app/(main)/forgot-password/page.js
"use client";

import { Suspense } from "react";
import ForgotPassword from "@/components/auth/ForgotPassword";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Suspense fallback={<p className="text-center">Loading...</p>}>
        <ForgotPassword />
      </Suspense>
    </div>
  );
}