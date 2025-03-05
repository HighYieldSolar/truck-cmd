"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, AlertCircle, Mail, RefreshCw } from "lucide-react";

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const email = searchParams.get("email") || "your email";
  
  const [isVerifying, setIsVerifying] = useState(token ? true : false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    // If we have a token, verify it immediately when component mounts
    if (token && type === 'signup') {
      verifyToken();
    }
  }, [token, type]);

  // Countdown timer effect for redirecting after verification
  useEffect(() => {
    let countdownInterval;
    
    if (isVerified && redirectCountdown > 0) {
      countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
    } else if (isVerified && redirectCountdown <= 0) {
      // When countdown reaches zero, redirect to dashboard
      router.push('/dashboard');
    }
    
    return () => clearInterval(countdownInterval);
  }, [isVerified, redirectCountdown, router]);

  const verifyToken = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call Supabase auth API to verify token
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      if (error) {
        throw error;
      }

      setIsVerified(true);
    } catch (error) {
      console.error('Error verifying email:', error);
      setError(error.message || 'There was an error verifying your email. Please try again.');
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setError(null);
    setResendSuccess(false);

    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        throw error;
      }

      setResendSuccess(true);
    } catch (error) {
      console.error('Error resending verification email:', error);
      setError(error.message || 'There was an error sending the verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Attempt auto sign-in after verification
  const handleAutoSignIn = async () => {
    try {
      // Note: this would require the user's password, which we don't have here
      // Instead, you might need to modify your auth flow to either:
      // 1. Pass credentials securely between verification and login
      // 2. Use a temporary token system for auto-login after verification
      // 3. Have users set up their password during verification
      
      // For now, we'll just redirect to dashboard and let the auth check 
      // redirect to login if needed
      router.push('/dashboard');
    } catch (error) {
      console.error('Error signing in after verification:', error);
      // Fall back to login page if auto sign-in fails
      router.push('/login');
    }
  };

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
        
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-md flex items-start">
            <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="mt-4 text-center">
          {isVerifying ? (
            <div>
              <p className="text-gray-600 mb-4">
                We&apos;re verifying your email address...
              </p>
              
              {loading ? (
                <div className="flex flex-col items-center mt-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-600">This may take a moment...</p>
                </div>
              ) : isVerified ? (
                <div className="flex flex-col items-center mt-6">
                  <CheckCircle size={48} className="text-green-500 mb-4" />
                  <p className="text-gray-700 mb-4">Your email has been successfully verified!</p>
                  <p className="text-gray-600 mb-4">Redirecting to dashboard in {redirectCountdown} seconds...</p>
                  <div className="flex space-x-4">
                    <button 
                      onClick={handleAutoSignIn}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Go to Dashboard Now
                    </button>
                    <Link 
                      href="/login" 
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                    >
                      Go to Login
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center mt-6">
                  <AlertCircle size={48} className="text-red-500 mb-4" />
                  <p className="text-gray-700 mb-4">We couldn&apos;t verify your email address.</p>
                  <p className="text-gray-600 mb-4">The verification link may have expired or is invalid.</p>
                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center justify-center"
                    >
                      {resendLoading ? (
                        <>
                          <RefreshCw size={18} className="animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        "Resend Verification Email"
                      )}
                    </button>
                    <Link 
                      href="/login" 
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                We&apos;ve sent a verification link to <strong>{email}</strong>.
                Please check your inbox and click on the link to verify your account.
              </p>
              
              {resendSuccess && (
                <div className="mt-4 mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
                  <CheckCircle size={20} className="text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700 text-sm">
                    Verification email has been resent! Please check your inbox.
                  </p>
                </div>
              )}
              
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
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center justify-center"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Email"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}