"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, AlertCircle, Mail, RefreshCw, ArrowRight } from "lucide-react";

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  
  // References for code input fields
  const inputRefs = useRef([]);

  // Setup input refs when component mounts
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

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

  const handleCodeChange = (index, value) => {
    // Update the code array
    const newCode = [...verificationCode];
    
    // Only accept numeric inputs
    if (value === '' || /^[0-9]$/.test(value)) {
      newCode[index] = value;
      setVerificationCode(newCode);
      
      // Auto-focus next input if a digit was entered
      if (value !== '' && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace key
    if (e.key === 'Backspace') {
      if (verificationCode[index] === '' && index > 0) {
        // If current field is empty and backspace is pressed, focus previous field
        inputRefs.current[index - 1].focus();
      }
    }
  };
  
  const handlePaste = (e) => {
    e.preventDefault();
    
    // Get pasted content and remove any non-numeric characters
    const pastedText = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    
    if (pastedText) {
      // Create a new array with the pasted digits
      const newCode = [...verificationCode];
      for (let i = 0; i < pastedText.length; i++) {
        if (i < 6) {
          newCode[i] = pastedText[i];
        }
      }
      
      setVerificationCode(newCode);
      
      // Focus the next empty field or the last field
      const nextEmptyIndex = newCode.findIndex(digit => digit === '');
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex].focus();
      } else {
        inputRefs.current[5].focus();
      }
    }
  };

  const verifyCode = async () => {
    // Check if code is complete
    if (verificationCode.some(digit => digit === '')) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }
    
    setIsVerifying(true);
    setLoading(true);
    setError(null);

    try {
      // Combine the code digits
      const code = verificationCode.join('');
      
      // Call Supabase auth API to verify the OTP code
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup'
      });

      if (error) {
        throw error;
      }

      setIsVerified(true);
      
      // After successful verification, redirect countdown starts
    } catch (error) {
      console.error('Error verifying code:', error);
      setError(error.message || 'Invalid verification code. Please try again.');
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Email address is missing. Please go back to the signup page.');
      return;
    }
    
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
      // Reset code fields
      setVerificationCode(['', '', '', '', '', '']);
      
      // Focus the first input field
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (error) {
      console.error('Error resending verification code:', error);
      setError(error.message || 'There was an error sending the verification code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Navigate to dashboard after verification
  const goToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md">
      <div className="flex flex-col items-center">
        <Image src="/images/TC.png" alt="Truck Command Logo" width={80} height={80} />
        
        <div className="mt-6 w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
          <Mail size={40} className="text-blue-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mt-6 text-center">
          {isVerified 
            ? "Email Verified!"
            : "Verify Your Email"}
        </h1>
        
        {!isVerified && (
          <p className="text-gray-600 mt-2 text-center">
            We&apos;ve sent a verification code to<br/>
            <strong className="text-gray-800">{email || 'your email'}</strong>
          </p>
        )}
        
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-md flex items-start w-full">
            <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {resendSuccess && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-600 p-3 rounded-md flex items-start w-full">
            <CheckCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>A new verification code has been sent to your email.</p>
          </div>
        )}
        
        {isVerified ? (
          <div className="flex flex-col items-center mt-6 w-full">
            <CheckCircle size={48} className="text-green-500 mb-4" />
            <p className="text-gray-700 mb-4">Your email has been successfully verified!</p>
            <p className="text-gray-600 mb-6">Redirecting to dashboard in {redirectCountdown} seconds...</p>
            <button 
              onClick={goToDashboard}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
            >
              Go to Dashboard Now <ArrowRight size={18} className="ml-2" />
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Enter 6-digit verification code
              </label>
              <div className="flex justify-between gap-2 mb-4">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={verificationCode[index]}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-md bg-white focus:border-blue-500 focus:ring focus:ring-blue-200 focus:outline-none"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex flex-col w-full mt-2">
              <button
                onClick={verifyCode}
                disabled={loading || verificationCode.some(digit => digit === '')}
                className={`w-full px-4 py-3 rounded-md transition ${
                  loading || verificationCode.some(digit => digit === '')
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw size={18} className="animate-spin mr-2" />
                    Verifying...
                  </span>
                ) : (
                  "Verify Email"
                )}
              </button>
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
                <AlertCircle size={20} className="text-yellow-600 mr-2 flex-shrink-0 mt-1" />
                <p className="text-yellow-700 text-sm">
                  If you don&apos;t see the email in your inbox, please check your spam folder.
                </p>
              </div>
              
              <div className="text-center mt-6">
                <p className="text-gray-600 text-sm mb-2">Didn&apos;t receive the code?</p>
                <button
                  onClick={handleResendCode}
                  disabled={resendLoading}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  {resendLoading ? (
                    <span className="flex items-center justify-center">
                      <RefreshCw size={16} className="animate-spin mr-2" />
                      Sending...
                    </span>
                  ) : (
                    "Resend Code"
                  )}
                </button>
              </div>
              
              <div className="mt-6 border-t border-gray-200 pt-4">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-800 flex justify-center"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}