"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, Shield,
  CheckCircle, Truck, Zap
} from "lucide-react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("password");
  const [processingOAuth, setProcessingOAuth] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Handle OAuth tokens in URL hash (from Google redirect)
  useEffect(() => {
    const handleHashTokens = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        // SECURITY: Clear the hash from URL immediately to prevent exposure in browser history
        // Store tokens in memory before clearing
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        // Clear hash from URL immediately (before any async operations)
        window.history.replaceState(null, '', window.location.pathname + window.location.search);

        setProcessingOAuth(true);
        try {
          if (accessToken) {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              setError('Failed to complete sign in. Please try again.');
              setProcessingOAuth(false);
              return;
            }

            if (data.session) {
              router.push('/dashboard');
              return;
            }
          }
        } catch (err) {
          setError('Authentication error. Please try again.');
        }
        setProcessingOAuth(false);
      }

      // Check for error in query params
      const errorParam = searchParams.get('error');
      if (errorParam) {
        if (errorParam === 'missing_params') {
          setError('Authentication incomplete. Please try again.');
        } else if (errorParam === 'auth_error') {
          setError('Authentication failed. Please try again.');
        } else {
          setError('An error occurred during sign in.');
        }
      }
    };

    handleHashTokens();
  }, [router, searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
        }
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message || "Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    setError(null);
    setMagicLinkLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
        }
      });

      if (error) {
        throw error;
      }

      setMagicLinkSent(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter the 6-digit code from your email");
      return;
    }

    setError(null);
    setVerifyingOtp(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email'
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        router.push('/dashboard');
      }
    } catch (error) {
      setError(error.message || "Invalid code. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="pt-8 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center justify-center">

            {/* Left Side - Welcome Message (hidden on mobile) */}
            <div className="hidden lg:block lg:w-5/12 text-left">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Truck size={16} />
                Welcome back
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-6">
                Log in to{" "}
                <span className="text-blue-600">Truck Command</span>
              </h1>

              <p className="text-lg text-gray-600 mb-8">
                Access your dashboard, manage loads, track expenses, and keep your trucking business running smoothly.
              </p>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield size={20} className="text-green-600" />
                  </div>
                  <span className="text-sm font-medium">Secure login with bank-level encryption</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap size={20} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Quick access with Google or magic link</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CheckCircle size={20} className="text-purple-600" />
                  </div>
                  <span className="text-sm font-medium">Your data synced across all devices</span>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                {/* Logo */}
                <div className="flex flex-col items-center mb-6">
                  <Image src="/images/TC.png" alt="Truck Command Logo" width={60} height={60} />
                  <h2 className="text-2xl font-bold text-gray-900 text-center mt-3">Welcome Back</h2>
                  <p className="text-gray-500 text-sm mt-1">Sign in to continue to your account</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                {processingOAuth ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Completing sign in...</p>
                  </div>
                ) : magicLinkSent ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Check your email</h3>
                    <p className="text-gray-600 mb-4">
                      We&apos;ve sent a magic link to <strong>{email}</strong>.
                    </p>

                    <p className="text-gray-500 text-sm mb-4">
                      Click the link in the email, or enter the 6-digit code below:
                    </p>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleOtpVerify} className="space-y-4">
                      <div>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="000000"
                          maxLength={6}
                          autoComplete="one-time-code"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={verifyingOtp || otpCode.length !== 6}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verifyingOtp ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Verifying...
                          </>
                        ) : (
                          <>
                            Verify Code
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setMagicLinkSent(false);
                          setOtpCode("");
                          setError(null);
                        }}
                        className="text-blue-600 hover:underline font-medium text-sm"
                      >
                        Back to login
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Google Sign In Button */}
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors mb-4"
                    >
                      {googleLoading ? (
                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      <span>Continue with Google</span>
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">or continue with</span>
                      </div>
                    </div>

                    {/* Login Method Tabs */}
                    <div className="flex justify-center gap-2 mb-6">
                      <button
                        type="button"
                        onClick={() => setLoginMethod("password")}
                        className={`flex-1 py-2.5 px-4 text-center rounded-lg text-sm font-medium transition-colors ${
                          loginMethod === "password"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <Lock size={14} className="inline mr-2" />
                        Password
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginMethod("magic")}
                        className={`flex-1 py-2.5 px-4 text-center rounded-lg text-sm font-medium transition-colors ${
                          loginMethod === "magic"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <Mail size={14} className="inline mr-2" />
                        Magic Link
                      </button>
                    </div>

                    {/* Password Login Form */}
                    {loginMethod === "password" && (
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <label className="block text-gray-700 font-medium mb-1 text-sm">Email</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="you@company.com"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 font-medium mb-1 text-sm">Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter your password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                            Forgot password?
                          </Link>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Signing in...
                            </>
                          ) : (
                            <>
                              Sign In
                              <ArrowRight size={18} />
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Magic Link Login Form */}
                    {loginMethod === "magic" && (
                      <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                        <div>
                          <label className="block text-gray-700 font-medium mb-1 text-sm">Email</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="you@company.com"
                            required
                          />
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            We&apos;ll send a magic link to your email that will let you sign in without a password.
                          </p>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          disabled={magicLinkLoading}
                        >
                          {magicLinkLoading ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sending...
                            </>
                          ) : (
                            <>
                              Send Magic Link
                              <Mail size={18} />
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    <p className="text-center text-gray-600 mt-6 text-sm">
                      Don&apos;t have an account?{" "}
                      <Link href="/signup" className="text-blue-600 font-medium hover:underline">
                        Sign up free
                      </Link>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
