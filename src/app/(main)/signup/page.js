"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import SignupForm from "@/components/auth/SignupForm";
import { useTranslation } from "@/context/LanguageContext";
import { Truck, Shield, Zap, CheckCircle } from "lucide-react";

function SignupPageContent() {
  const { t } = useTranslation('auth');

  return (
    <div className="bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="pt-8 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center justify-center">

            {/* Left Side - Welcome Message (hidden on mobile) */}
            <div className="hidden lg:block lg:w-5/12 text-left">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Truck size={16} />
                Start your free trial
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-6">
                Join{" "}
                <span className="text-blue-600">Truck Command</span>
              </h1>

              <p className="text-lg text-gray-600 mb-8">
                Simplify your trucking business with powerful tools for load management, invoicing, expense tracking, and IFTA compliance.
              </p>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield size={20} className="text-green-600" />
                  </div>
                  <span className="text-sm font-medium">30-day free trial, no credit card needed</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap size={20} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Get started in under 2 minutes</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CheckCircle size={20} className="text-purple-600" />
                  </div>
                  <span className="text-sm font-medium">Join thousands of truckers saving time</span>
                </div>
              </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                {/* Logo */}
                <div className="flex flex-col items-center mb-6">
                  <Image src="/images/TC.png" alt="Truck Command Logo" width={60} height={60} />
                  <h2 className="text-2xl font-bold text-gray-900 text-center mt-3">
                    {t('signup.title')}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {t('signup.subtitle')}
                  </p>
                </div>

                {/* Signup Form */}
                <SignupForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignupFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupPageContent />
    </Suspense>
  );
}
