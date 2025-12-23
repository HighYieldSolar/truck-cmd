"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { KeyRound, AlertCircle, RefreshCw } from "lucide-react";
import { resetPassword } from "@/lib/supabaseAuth";
import { useTranslation } from "@/context/LanguageContext";

export default function ForgotPassword() {
  const { t } = useTranslation('auth');
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [userEmail, setUserEmail] = useState(email);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userEmail || !userEmail.includes('@')) {
      setError(t('forgotPassword.validEmail'));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Use our auth utility instead of direct Supabase calls
      const { error } = await resetPassword(userEmail, `${window.location.origin}/reset-password`);
      
      if (error) throw error;
      
      setIsSubmitted(true);
    } catch (error) {
      setError(error.message || t('forgotPassword.sendFailed'));
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
          {isSubmitted ? t('forgotPassword.checkEmail') : t('forgotPassword.title')}
        </h1>

        {!isSubmitted && (
          <p className="text-gray-600 mt-2 text-center">
            {t('forgotPassword.description')}
          </p>
        )}
        
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-md flex items-start w-full">
            <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {isSubmitted ? (
          <div className="mt-4 w-full">
            <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-md mb-6">
              <p className="text-center">
                {t('forgotPassword.emailSent')} <strong>{userEmail}</strong>.
                {t('forgotPassword.checkInbox')}
              </p>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
              <AlertCircle size={20} className="text-yellow-600 mr-2 flex-shrink-0 mt-1" />
              <p className="text-yellow-700 text-sm">
                {t('forgotPassword.checkSpam')}
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <Link
                href="/login"
                className="block w-full text-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
              >
                {t('forgotPassword.backToLogin')}
              </Link>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw size={18} className="animate-spin mr-2" />
                    {t('forgotPassword.sending')}
                  </span>
                ) : (
                  t('forgotPassword.resendEmail')
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6 w-full">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-left mb-1">
                {t('forgotPassword.emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder={t('forgotPassword.enterEmail')}
                className="w-full p-3 border rounded bg-white text-gray-900 focus:ring focus:ring-blue-300 focus:border-blue-300"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition flex items-center justify-center"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  {t('forgotPassword.sending')}
                </span>
              ) : (
                t('forgotPassword.sendInstructions')
              )}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-blue-500 hover:underline text-sm">
                {t('forgotPassword.returnToLogin')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}