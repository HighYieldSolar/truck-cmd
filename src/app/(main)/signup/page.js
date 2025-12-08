"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import {
  Eye, EyeOff, CheckCircle, X, Truck, DollarSign,
  FileText, Fuel, Calculator, Shield, ArrowRight, Check,
  Zap, Clock
} from "lucide-react";
import { motion } from "framer-motion";

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [validEmail, setValidEmail] = useState(false);
  const [phone, setPhone] = useState("");
  const [validPhone, setValidPhone] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [step, setStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [processingOAuth, setProcessingOAuth] = useState(false);

  // Handle OAuth tokens in URL hash (from Google redirect)
  useEffect(() => {
    const handleHashTokens = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        setProcessingOAuth(true);
        try {
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken) {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('Session error:', sessionError);
              setError('Failed to complete sign in. Please try again.');
              setProcessingOAuth(false);
              window.history.replaceState(null, '', window.location.pathname);
              return;
            }

            if (data.session) {
              window.history.replaceState(null, '', window.location.pathname);
              router.push('/dashboard');
              return;
            }
          }
        } catch (err) {
          console.error('OAuth processing error:', err);
          setError('Authentication error. Please try again.');
        }
        setProcessingOAuth(false);
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    handleHashTokens();
  }, [router]);

  // Validate Email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = re.test(email);
    setValidEmail(isValid);
    setEmail(email);
  };

  // Validate Phone Number
  const validatePhone = (phone) => {
    const cleanedPhone = phone.replace(/\D/g, '');
    const re = /^\d{10}$/;
    const isValid = re.test(cleanedPhone);
    setValidPhone(isValid);
    setPhone(phone);
  };

  // Check if passwords match
  const checkPasswordMatch = (confirmPwd) => {
    setConfirmPassword(confirmPwd);
    setPasswordsMatch(password === confirmPwd);
  };

  // Form validation
  const isFormValid = () => {
    return (
      validEmail &&
      validPhone &&
      fullName.trim() !== "" &&
      businessName.trim() !== "" &&
      password.length >= 8 &&
      passwordsMatch &&
      termsAccepted
    );
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (!validEmail) {
      setError("Please enter a valid email address");
      return;
    }
    setStep(2);
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

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError("Please complete all required fields correctly.");
      return;
    }

    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const cleanedPhone = phone.replace(/\D/g, '');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
            phone: cleanedPhone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setError("This email is already registered. Please use a different email or login.");
          return;
        }
        throw error;
      }

      setFormSubmitted(true);
      setMessage("Account created successfully! Please check your email for the verification code.");

      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 3000);

    } catch (error) {
      setError(error.message || "An error occurred during signup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: <FileText size={20} />, text: "Professional Invoicing" },
    { icon: <Truck size={20} />, text: "Load Management" },
    { icon: <Calculator size={20} />, text: "IFTA Calculator" },
    { icon: <Fuel size={20} />, text: "Fuel Tracking" },
    { icon: <DollarSign size={20} />, text: "Expense Tracking" },
    { icon: <Shield size={20} />, text: "Compliance Tracking" },
  ];

  return (
    <div className="bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="pt-8 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center justify-center">

            {/* Left Side - Value Proposition (hidden on mobile) */}
            <div className="hidden lg:block lg:w-5/12 text-left">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap size={16} />
                Start your 7-day free trial
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-6">
                Simplify Your Trucking Business{" "}
                <span className="text-blue-600">Today</span>
              </h1>

              <p className="text-lg text-gray-600 mb-8">
                Join truckers who manage their loads, expenses, and IFTA reporting in one simple platform.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3 text-gray-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {feature.icon}
                    </div>
                    <span className="text-sm font-medium">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-green-600" />
                  <span>Bank-level security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" />
                  <span>Setup in 5 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                {/* Logo */}
                <div className="flex flex-col items-center mb-6">
                  <Image src="/images/TC.png" alt="Truck Command Logo" width={60} height={60} />
                  <h2 className="text-2xl font-bold text-gray-900 text-center mt-3">Create Your Account</h2>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 flex items-center text-sm">
                    <X size={16} className="mr-2 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {processingOAuth ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Completing sign in with Google...</p>
                  </div>
                ) : formSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Account Created!</h3>
                    <p className="text-gray-600 mb-6">
                      Please check your email for the verification code to complete your registration.
                    </p>
                    <p className="text-sm text-gray-500">Redirecting you shortly...</p>
                  </motion.div>
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
                        <span className="px-4 bg-white text-gray-500">or sign up with email</span>
                      </div>
                    </div>

                    {/* Multi-step Form */}
                    <form className="space-y-4">
                      {step === 1 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div>
                            <label className="block text-gray-700 font-medium mb-1 text-sm">Email Address</label>
                            <input
                              type="email"
                              placeholder="you@company.com"
                              value={email}
                              onChange={(e) => validateEmail(e.target.value)}
                              className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                email
                                  ? validEmail
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-red-300 bg-red-50'
                                  : 'border-gray-300'
                              }`}
                              required
                            />
                            {email && !validEmail && (
                              <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
                            )}
                          </div>

                          <button
                            onClick={handleContinue}
                            disabled={loading || !validEmail}
                            className={`w-full py-3 rounded-lg mt-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                              loading || !validEmail
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            Continue
                            <ArrowRight size={18} />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-4"
                        >
                          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg flex items-center text-sm">
                            <Check size={16} className="mr-2" />
                            <span>Email: <strong>{email}</strong></span>
                            <button
                              type="button"
                              onClick={() => setStep(1)}
                              className="ml-auto text-blue-600 hover:underline text-xs"
                            >
                              Change
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-gray-700 font-medium mb-1 text-sm">Full Name</label>
                              <input
                                type="text"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 font-medium mb-1 text-sm">Phone</label>
                              <input
                                type="tel"
                                placeholder="(555) 123-4567"
                                value={phone}
                                onChange={(e) => validatePhone(e.target.value)}
                                className={`w-full px-3 py-2.5 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 ${
                                  phone
                                    ? validPhone
                                      ? 'border-green-300 bg-green-50'
                                      : 'border-red-300 bg-red-50'
                                    : 'border-gray-300'
                                }`}
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-1 text-sm">Business Name</label>
                            <input
                              type="text"
                              placeholder="Your Trucking Company"
                              value={businessName}
                              onChange={(e) => setBusinessName(e.target.value)}
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-1 text-sm">Password</label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Min. 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            {password && password.length < 8 && (
                              <p className="text-red-500 text-xs mt-1">Password must be at least 8 characters</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-gray-700 font-medium mb-1 text-sm">Confirm Password</label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => checkPasswordMatch(e.target.value)}
                                className={`w-full px-3 py-2.5 border rounded-lg text-gray-900 pr-10 focus:ring-2 focus:ring-blue-500 ${
                                  confirmPassword && !passwordsMatch ? 'border-red-300' : 'border-gray-300'
                                }`}
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
                            {confirmPassword && !passwordsMatch && (
                              <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                            )}
                          </div>

                          <div className="flex items-start">
                            <input
                              type="checkbox"
                              id="terms"
                              checked={termsAccepted}
                              onChange={() => setTermsAccepted(!termsAccepted)}
                              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                              I agree to the{" "}
                              <Link href="/terms" target="_blank" className="text-blue-600 hover:underline">Terms of Service</Link>
                              {" "}and{" "}
                              <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</Link>
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={handleSignup}
                            className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                              loading || !isFormValid()
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                            disabled={loading || !isFormValid()}
                          >
                            {loading ? (
                              <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Account...
                              </>
                            ) : (
                              <>
                                Start Free Trial
                                <ArrowRight size={18} />
                              </>
                            )}
                          </button>
                        </motion.div>
                      )}
                    </form>

                    <p className="text-center text-gray-600 mt-6 text-sm">
                      Already have an account?{" "}
                      <Link href="/login" className="text-blue-600 font-medium hover:underline">
                        Log in
                      </Link>
                    </p>
                  </>
                )}
              </div>

              {/* Bottom trust text */}
              <p className="text-center text-gray-500 text-xs mt-4">
                No credit card required • Cancel anytime
              </p>
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
