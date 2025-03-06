"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { KeyRound, AlertCircle, CheckCircle, Mail } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export function ForgotPassword() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [userEmail, setUserEmail] = useState(email);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userEmail || !userEmail.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // In a real app, you would integrate with your authentication system
      // For example, with Supabase:
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error requesting password reset:", error);
      setError(error.message || "Failed to send password reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md">
      <div className="flex flex-col items-center">
        <Image src="/images/TC.png" alt="Truck Command Logo" width={80} height={80} />
        
        <div className="mt-6 w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
          <KeyRound size={40} className="text-blue-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mt-6 text-center">
          {isSubmitted ? "Check Your Email" : "Reset Your Password"}
        </h1>
        
        <div className="mt-4 text-center">
          {isSubmitted ? (
            <div>
              <p className="text-gray-600 mb-4">
                We&apos;ve sent a password reset link to <strong>{userEmail}</strong>.
                Please check your inbox and click on the link to reset your password.
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
                  onClick={handleSubmit}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Resend Reset Email
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Enter your email address below and we&apos;ll send you instructions to reset your password.
              </p>
              
              {error && (
                <div className="mt-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full p-3 border rounded bg-gray-200 text-gray-900 focus:ring focus:ring-blue-300"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Sending...
                    </>
                  ) : (
                    "Send Reset Instructions"
                  )}
                </button>
                
                <div className="text-center">
                  <Link href="/login" className="text-blue-500 hover:underline text-sm">
                    Return to Login
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}