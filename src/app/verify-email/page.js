"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Function to verify OTP code
  const verifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    setLoading(false);

    if (error) {
      setMessage("Invalid code. Please try again.");
    } else {
      setMessage("Verification successful! Redirecting...");
      setTimeout(() => {
        router.push("/dashboard"); // ✅ Redirect to dashboard after verification
      }, 2000);
    }
  };

  // ✅ Function to resend OTP code
  const resendCode = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resend({
      email,
      type: "signup",
    });

    setLoading(false);

    if (error) {
      setMessage("Error resending code. Please try again.");
    } else {
      setMessage("Verification code resent! Check your inbox.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {/* ✅ Logo */}
        <div className="flex justify-center mb-4">
          <Image src="/images/TC.png" alt="Truck Command Logo" width={100} height={100} />
        </div>

        <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
        <p className="text-gray-600 mt-2">
          A **6-digit verification code** has been sent to:  
          <strong> {email}</strong>.  
          Enter the code below to continue.
        </p>

        {/* Verification Code Input */}
        <form onSubmit={verifyCode} className="mt-4 space-y-4">
          <input
            type="text"
            maxLength="6"
            pattern="[0-9]*"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full p-3 border rounded bg-gray-100 text-gray-900 text-center text-xl tracking-widest"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        {message && <p className="text-green-500 mt-4">{message}</p>}

        {/* Resend Code Button */}
        <p className="text-gray-600 mt-4">
          Didn't receive the code?  
          <button
            onClick={resendCode}
            className="text-blue-500 hover:underline ml-1"
            disabled={loading}
          >
            Resend Code
          </button>
        </p>

        {/* Login Option */}
        <p className="text-gray-600 mt-6">
          Already verified?{" "}
          <a href="/login" className="text-blue-500 hover:underline">Login Here</a>
        </p>
      </div>
    </div>
  );
}
