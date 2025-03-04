"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, AlertCircle, Mail } from "lucide-react";

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") || "your email";
  
  // In a real app, you would verify the token with your API
  const isVerifying = token ? true : false;
  const isVerified = false; // This would come from API response
  
  return (
    <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md">
      <div className="flex flex-col items-center">
        <Image src="/images/TC.png" alt="Truck Command Logo" width={80} height={80} />
        
        <div className="mt-6 w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
          <Mail size={40} className="text-blue-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mt-6 text-center">
          {isVerifying 
            ? "Verifying Your Email" 
            : "Check Your Email"}
        </h1>
        
        <div className="mt-4 text-center">
          {isVerifying ? (
            <div>
              <p className="text-gray-600 mb-4">
                We&apos;re verifying your email address with the provided token...
              </p>
              
              {isVerified ? (
                <div className="flex flex-col items-center mt-6">
                  <CheckCircle size={48} className="text-green-500 mb-4" />
                  <p className="text-gray-700 mb-4">Your email has been successfully verified!</p>
                  <Link 
                    href="/login" 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    Login to Your Account
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center mt-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-600">This may take a moment...</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                We&apos;ve sent a verification link to <strong>{email}</strong>.
                Please check your inbox and click on the link to verify your account.
              </p>
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
                <AlertCircle size={20} className="text-yellow-600 mr-2 flex-shrink-0 mt-1" />
                <p className="text-yellow-700 text-sm">
                  If you don&apos;t see the email in your inbox, please check your spam folder.
                </p>
              </div>
              
              <div className="mt-6 space-y-4">
                <Link
                  href="/login"
                  className="block w-full text-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                >
                  Back to Login
                </Link>
                
                <button
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Resend Verification Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}