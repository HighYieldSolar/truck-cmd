"use client";

import { Suspense } from "react";
import VerifyEmail from "@/components/auth/VerifyEmail";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Suspense fallback={<p className="text-center">Loading...</p>}>
        <VerifyEmail />
      </Suspense>
    </div>
  );
}