"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Mail, X, RefreshCw, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Non-blocking email verification banner that appears at the top of the dashboard
 * for users who haven't verified their email yet.
 */
export default function EmailVerificationBanner({ user }) {
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if email is already confirmed
    if (user.email_confirmed_at) {
      setIsVerified(true);
      return;
    }

    // Check localStorage for dismissal
    const dismissedKey = `email_banner_dismissed_${user.id}`;
    const wasDismissed = localStorage.getItem(dismissedKey);
    if (wasDismissed) {
      // Check if it's been more than 24 hours since dismissal
      const dismissedAt = new Date(wasDismissed);
      const hoursSinceDismiss = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) {
        setDismissed(true);
      } else {
        localStorage.removeItem(dismissedKey);
      }
    }

    // Listen for auth state changes (in case they verify in another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user?.email_confirmed_at) {
          setIsVerified(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [user]);

  const handleDismiss = () => {
    setDismissed(true);
    if (user?.id) {
      localStorage.setItem(`email_banner_dismissed_${user.id}`, new Date().toISOString());
    }
  };

  const handleResendEmail = async () => {
    if (!user?.email || resending) return;

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (error) {
      console.error('Error resending verification email:', error);
    } finally {
      setResending(false);
    }
  };

  // Don't show if verified, dismissed, or no user
  if (!user || isVerified || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail size={16} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Verify your email</span>
                  <span className="hidden sm:inline text-amber-700"> to unlock all features. Check your inbox for a verification link.</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {resent ? (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle size={14} />
                  Sent!
                </span>
              ) : (
                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 font-medium disabled:opacity-50"
                >
                  <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">{resending ? 'Sending...' : 'Resend'}</span>
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="p-1 text-amber-500 hover:text-amber-700 rounded"
                title="Dismiss for 24 hours"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
