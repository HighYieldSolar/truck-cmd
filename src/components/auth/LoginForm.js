"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, Mail, Lock } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function LoginForm() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("password"); // "password" or "magic"

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      // Supabase auth errors are user-friendly, but provide fallback for edge cases
      setError(error.message || t('login.loginFailed'));
    } else {
      router.push("/dashboard");
    }
  };

  const handleMagicLinkLogin = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError(t('login.validEmail'));
      return;
    }

    setError(null);
    setMagicLinkLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }

      setMagicLinkSent(true);
    } catch (error) {
      // Supabase auth errors are user-friendly, but provide fallback for edge cases
      setError(error.message || t('login.magicLinkFailed'));
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const toggleLoginMethod = () => {
    setLoginMethod(loginMethod === "password" ? "magic" : "password");
    setError(null);
  };

  if (magicLinkSent) {
    return (
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">{t('login.checkEmail')}</h3>
        <p className="text-gray-600 mb-6">
          {t('login.magicLinkSent')} <strong>{email}</strong>.
          {t('login.clickLinkToSignIn')}
        </p>
        <button
          onClick={() => setMagicLinkSent(false)}
          className="text-blue-600 hover:underline font-medium"
        >
          {t('login.backToLogin')}
        </button>
      </div>
    );
  }

  return (
    <>
      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      <div className="flex justify-center space-x-4 mb-6">
        <button
          type="button"
          onClick={() => setLoginMethod("password")}
          className={`flex-1 py-2 px-4 text-center rounded-md ${
            loginMethod === "password"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <Lock size={16} className="inline mr-2" />
          {t('login.passwordMethod')}
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod("magic")}
          className={`flex-1 py-2 px-4 text-center rounded-md ${
            loginMethod === "magic"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <Mail size={16} className="inline mr-2" />
          {t('login.emailLogin')}
        </button>
      </div>

      {/* Password Login Form */}
      {loginMethod === "password" && (
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-gray-800 font-medium mb-1">{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring focus:ring-blue-300 focus:border-blue-300"
              placeholder={t('login.enterEmail')}
              required
            />
          </div>

          {/* Password Input with Show/Hide */}
          <div>
            <label className="block text-gray-800 font-medium mb-1">{t('login.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 pr-10 focus:ring focus:ring-blue-300 focus:border-blue-300"
                placeholder={t('login.enterPassword')}
                required
              />
              {/* Show/Hide Password Button with Icons - fixed z-index */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900 z-10"
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-center">
            <Link href="/forgot-password" className="text-sm text-blue-500 hover:underline">
              {t('login.forgotPassword')}
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('login.loggingIn')}
              </div>
            ) : (
              t('login.loginButton')
            )}
          </button>
        </form>
      )}

      {/* Magic Link Login Form */}
      {loginMethod === "magic" && (
        <form onSubmit={handleMagicLinkLogin} className="space-y-4">
          <div>
            <label className="block text-gray-800 font-medium mb-1">{t('login.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring focus:ring-blue-300 focus:border-blue-300"
              placeholder={t('login.enterEmail')}
              required
            />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              {t('login.magicLinkInfo')}
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition"
            disabled={magicLinkLoading}
          >
            {magicLinkLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('login.sendingMagicLink')}
              </div>
            ) : (
              t('login.sendMagicLink')
            )}
          </button>
        </form>
      )}

      {/* Signup Link */}
      <p className="text-sm text-center mt-6 text-gray-700">
        {t('login.noAccount')}{" "}
        <Link href="/signup" className="text-blue-500 hover:underline">
          {t('login.signUp')}
        </Link>
      </p>
    </>
  );
}