"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, Mail, User, Lock, Truck, Users, Briefcase, ArrowRight, Check } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

// Password strength calculator
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: 'gray' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const strengths = [
    { label: 'Too weak', color: 'red' },
    { label: 'Weak', color: 'orange' },
    { label: 'Fair', color: 'yellow' },
    { label: 'Good', color: 'blue' },
    { label: 'Strong', color: 'green' }
  ];

  return { score: Math.min(score, 4), ...strengths[Math.min(score, 4)] };
};

const ROLE_OPTIONS = [
  {
    id: 'owner-operator',
    icon: <Truck size={20} />,
    title: 'Owner-Operator',
    description: 'I run my own truck'
  },
  {
    id: 'fleet-manager',
    icon: <Users size={20} />,
    title: 'Fleet Manager',
    description: 'I manage multiple trucks'
  },
  {
    id: 'dispatcher',
    icon: <Briefcase size={20} />,
    title: 'Dispatcher',
    description: 'I coordinate loads'
  }
];

export default function SignupForm() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Multi-step state
  const [step, setStep] = useState(1);

  // Step 1: Credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Profile
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);

  // UI state
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [processingOAuth, setProcessingOAuth] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Handle OAuth tokens in URL hash (from Google redirect)
  useEffect(() => {
    const handleHashTokens = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        // SECURITY: Clear the hash from URL immediately
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        window.history.replaceState(null, '', window.location.pathname + window.location.search);

        setProcessingOAuth(true);
        try {
          if (accessToken) {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              setError('Failed to complete sign up. Please try again.');
              setProcessingOAuth(false);
              return;
            }

            if (data.session) {
              const user = data.session.user;

              // Check if this is an existing user (created_at is more than 1 minute old)
              const createdAt = new Date(user.created_at);
              const now = new Date();
              const timeDiffMs = now - createdAt;
              const isExistingUser = timeDiffMs > 60000; // More than 1 minute old = existing user

              if (isExistingUser) {
                // Existing user trying to sign up - redirect to dashboard instead
                router.push('/dashboard');
                return;
              }

              // New user from OAuth - redirect to welcome
              router.push('/welcome?new=true');
              return;
            }
          }
        } catch (err) {
          setError('Authentication error. Please try again.');
        }
        setProcessingOAuth(false);
      }

      // Check for error in query params
      const errorParam = searchParams?.get('error');
      if (errorParam) {
        if (errorParam === 'no_account') {
          // User tried to log in with Google but doesn't have an account
          const emailParam = searchParams?.get('email');
          if (emailParam) {
            setEmail(emailParam);
          }
          setError("This email doesn't have an account yet. Please sign up first to get started.");
        } else {
          setError('An error occurred during sign up. Please try again.');
        }
      }
    };

    handleHashTokens();
  }, [router, searchParams]);

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/welcome?new=true`
        }
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message || "Failed to sign up with Google");
      setGoogleLoading(false);
    }
  };

  const validateStep1 = () => {
    if (!email || !email.includes('@')) {
      setError(t('signup.validEmail'));
      return false;
    }
    if (password.length < 8) {
      setError(t('signup.passwordMinLength'));
      return false;
    }
    return true;
  };

  // Check if email already exists in users table
  const checkEmailExists = async (emailToCheck) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', emailToCheck.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        console.error('Error checking email:', error);
        return false; // Allow signup attempt if check fails
      }

      return !!data; // Returns true if email exists
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateStep1()) {
      return;
    }

    // Check if email already exists
    setCheckingEmail(true);
    try {
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        setError("An account with this email already exists. Please log in instead.");
        setCheckingEmail(false);
        return;
      }
    } catch (error) {
      // If check fails, allow signup attempt
      console.error('Email check failed:', error);
    }
    setCheckingEmail(false);

    setStep(2);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t('signup.nameRequired'));
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            name: name.trim(),
            operator_type: role || 'owner-operator',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      // Check if user already exists
      if (data?.user?.identities?.length === 0) {
        setError("An account with this email already exists. Please log in instead.");
        setStep(1);
        return;
      }

      // Signup successful - redirect immediately to welcome page
      // The email verification banner will show in the dashboard
      router.push(`/welcome?new=true&email=${encodeURIComponent(email)}`);

    } catch (error) {
      setError(error.message || t('signup.signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSkipRole = () => {
    setRole('owner-operator'); // Default role
    handleSignup({ preventDefault: () => {} });
  };

  // Show processing state for OAuth
  if (processingOAuth) {
    return (
      <div className="w-full text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign up...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`w-8 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`w-8 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Email & Password */}
        {step === 1 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleStep1Submit}
            className="space-y-4"
          >
            {/* Google Sign Up Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
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
                <span className="px-4 bg-white text-gray-500">or continue with email</span>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-gray-800 font-medium mb-1">
                {t('signup.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('signup.enterEmail')}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-gray-800 font-medium mb-1">
                {t('signup.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('signup.enterPassword')}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < passwordStrength.score
                            ? passwordStrength.color === 'red' ? 'bg-red-500'
                            : passwordStrength.color === 'orange' ? 'bg-orange-500'
                            : passwordStrength.color === 'yellow' ? 'bg-yellow-500'
                            : passwordStrength.color === 'blue' ? 'bg-blue-500'
                            : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.color === 'red' ? 'text-red-600'
                    : passwordStrength.color === 'orange' ? 'text-orange-600'
                    : passwordStrength.color === 'yellow' ? 'text-yellow-600'
                    : passwordStrength.color === 'blue' ? 'text-blue-600'
                    : 'text-green-600'
                  }`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
              {!password && (
                <p className="text-xs text-gray-500 mt-1">
                  {t('signup.passwordMinLength')}
                </p>
              )}
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={checkingEmail}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {checkingEmail ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center">
              {t('signup.agreeToTerms')}{" "}
              <Link href="/terms" className="text-blue-500 hover:underline">
                {t('signup.termsOfService')}
              </Link>{" "}
              {t('signup.and')}{" "}
              <Link href="/privacy" className="text-blue-500 hover:underline">
                {t('signup.privacyPolicy')}
              </Link>
            </p>
          </motion.form>
        )}

        {/* Step 2: Name & Role */}
        {step === 2 && (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleSignup}
            className="space-y-4"
          >
            {/* Back button */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mb-2"
            >
              <ArrowRight size={14} className="rotate-180" />
              Back
            </button>

            {/* Name Input */}
            <div>
              <label className="block text-gray-800 font-medium mb-1">
                {t('signup.fullName')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('signup.enterName')}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-gray-800 font-medium mb-2">
                What's your role? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="space-y-2">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setRole(option.id)}
                    className={`w-full p-3 border-2 rounded-lg text-left flex items-center gap-3 transition-all ${
                      role === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      role === option.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{option.title}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                    {role === option.id && (
                      <Check size={20} className="text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('signup.creatingAccount')}
                </>
              ) : (
                <>
                  Start Free Trial
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Skip link */}
            {!role && (
              <button
                type="button"
                onClick={handleSkipRole}
                disabled={loading || !name.trim()}
                className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 disabled:opacity-50"
              >
                Skip for now
              </button>
            )}

            {/* Trial Info */}
            <p className="text-xs text-gray-500 text-center">
              {t('signup.trialInfo')}
            </p>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Login Link */}
      <p className="text-sm text-center mt-6 text-gray-700">
        {t('signup.alreadyHaveAccount')}{" "}
        <Link href="/login" className="text-blue-500 hover:underline font-medium">
          {t('signup.logIn')}
        </Link>
      </p>
    </div>
  );
}
