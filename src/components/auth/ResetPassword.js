"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { KeyRound, CheckCircle, AlertCircle, EyeIcon, EyeOffIcon, RefreshCw } from "lucide-react";
import { updatePassword } from "@/lib/supabaseAuth";
import { useTranslation } from "@/context/LanguageContext";

export default function ResetPassword() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  
  // Check if we're already in the recovery flow
  useEffect(() => {
    // When the reset link is clicked, Supabase will add a recovery hash to the URL
    // You can check for this to ensure we're in the recovery flow
    const url = new URL(window.location.href);
    const hasRecoveryToken = url.hash.includes('type=recovery');
    
    if (!hasRecoveryToken) {
      // If no recovery token is found, we might want to redirect
      // or show a message indicating the link is invalid
      setError(t('resetPassword.invalidLink'));
    }
  }, []);
  
  // Countdown timer effect for redirecting after success
  useEffect(() => {
    let countdownInterval;
    
    if (success && redirectCountdown > 0) {
      countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
    } else if (success && redirectCountdown <= 0) {
      // When countdown reaches zero, redirect to login
      router.push('/login');
    }
    
    return () => clearInterval(countdownInterval);
  }, [success, redirectCountdown, router]);
  
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (confirmPassword) {
      setPasswordsMatch(e.target.value === confirmPassword);
    }
  };
  
  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setPasswordsMatch(password === e.target.value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || password.length < 8) {
      setError(t('resetPassword.minLength'));
      return;
    }

    if (!passwordsMatch) {
      setError(t('resetPassword.passwordsMatch'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use our auth utility for password update
      const { data, error } = await updatePassword(password);
      
      if (error) throw error;
      
      setSuccess(true);
    } catch (error) {
      setError(error.message || t('resetPassword.resetFailed'));
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <Image src="/images/TC.png" alt="Truck Command Logo" width={80} height={80} />
          
          <div className="mt-6 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={40} className="text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mt-6 text-center">
            {t('resetPassword.successTitle')}
          </h1>

          <p className="text-gray-600 text-center mt-4 mb-6">
            {t('resetPassword.successMessage')} {redirectCountdown} {t('resetPassword.seconds')}
          </p>

          <Link
            href="/login"
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {t('resetPassword.goToLogin')}
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md">
      <div className="flex flex-col items-center">
        <Image src="/images/TC.png" alt="Truck Command Logo" width={80} height={80} />
        
        <div className="mt-6 w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
          <KeyRound size={40} className="text-blue-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mt-6 text-center">
          {t('resetPassword.title')}
        </h1>

        <div className="w-full mt-4">
          <p className="text-gray-600 text-center mb-4">
            {t('resetPassword.description')}
          </p>
          
          {error && (
            <div className="mt-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-start">
              <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 text-left mb-1">
                {t('resetPassword.newPassword')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder={t('resetPassword.enterNewPassword')}
                  className="w-full p-3 border rounded bg-white text-gray-900 pr-10 focus:ring focus:ring-blue-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('resetPassword.passwordRequirements')}</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 text-left mb-1">
                {t('resetPassword.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder={t('resetPassword.confirmNewPassword')}
                  className={`w-full p-3 border rounded bg-white text-gray-900 pr-10 focus:ring focus:ring-blue-300 ${
                    confirmPassword && !passwordsMatch ? 'border-red-300' : ''
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-900"
                >
                  {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-red-500 text-sm mt-1">{t('resetPassword.passwordsMatch')}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  {t('resetPassword.resettingPassword')}
                </span>
              ) : (
                t('resetPassword.resetButton')
              )}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-blue-500 hover:underline text-sm">
                {t('resetPassword.returnToLogin')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}