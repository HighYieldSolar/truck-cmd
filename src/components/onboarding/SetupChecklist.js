"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, ChevronRight, Truck, FileText, User, X, Sparkles, ArrowRight, Trophy, Clock
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import CelebrationModal, { useCelebration } from "./CelebrationModal";

// Reduced to 4 key items focused on value
const checklistItems = [
  {
    id: 'load',
    icon: <FileText size={18} />,
    href: '/dashboard/dispatching?addNew=true',
    table: 'loads',
    color: 'blue',
    weight: 40, // Most important action
    celebrationType: 'first_load',
    estimatedTime: '2 min'
  },
  {
    id: 'invoice',
    icon: <FileText size={18} />,
    href: '/dashboard/invoices/new',
    table: 'invoices',
    color: 'green',
    weight: 30,
    celebrationType: 'first_invoice',
    estimatedTime: '1 min'
  },
  {
    id: 'truck',
    icon: <Truck size={18} />,
    href: '/dashboard/fleet/trucks?addNew=true',
    table: 'vehicles',
    color: 'indigo',
    weight: 20,
    celebrationType: 'first_truck',
    estimatedTime: '1 min'
  },
  {
    id: 'profile',
    icon: <User size={18} />,
    href: '/dashboard/settings/profile',
    checkFields: ['phone', 'company_name'],
    color: 'purple',
    weight: 10,
    celebrationType: 'profile_complete',
    estimatedTime: '2 min'
  }
];

// Zeigarnik effect: Start progress at 20% to encourage completion
const INITIAL_PROGRESS = 20;

export default function SetupChecklist({ userId }) {
  const { t } = useTranslation('onboarding');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [previousCompleted, setPreviousCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Celebration hook
  const { celebration, celebrate, closeCelebration, CelebrationModalProps } = useCelebration();

  const checkProgress = useCallback(async () => {
    if (!userId) return;

    try {
      const checks = await Promise.all([
        supabase.from('loads').select('id').eq('user_id', userId).limit(1),
        supabase.from('invoices').select('id').eq('user_id', userId).limit(1),
        supabase.from('vehicles').select('id').eq('user_id', userId).limit(1),
        supabase.from('users').select('phone, company_name, setup_checklist_dismissed').eq('id', userId).single()
      ]);

      const completed = [];

      if (checks[0].data?.length > 0) completed.push('load');
      if (checks[1].data?.length > 0) completed.push('invoice');
      if (checks[2].data?.length > 0) completed.push('truck');

      const userData = checks[3].data;
      if (userData?.phone && userData?.company_name) {
        completed.push('profile');
      }

      // Check if user dismissed the checklist FIRST
      const isDismissed = userData?.setup_checklist_dismissed === true;
      if (isDismissed) {
        setDismissed(true);
      }

      // Check for newly completed items to trigger celebration
      const newlyCompleted = completed.filter(id => !previousCompleted.includes(id));
      if (newlyCompleted.length > 0 && previousCompleted.length > 0) {
        const newItem = checklistItems.find(item => item.id === newlyCompleted[0]);
        if (newItem?.celebrationType) {
          celebrate(newItem.celebrationType);
        }
      }

      setPreviousCompleted(completed);
      setCompletedSteps(completed);

      // Only show celebration if all steps complete AND not dismissed
      if (completed.length === checklistItems.length && !isDismissed) {
        setShowCelebration(true);
      }
    } catch (error) {
      console.error('Error checking setup progress:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, previousCompleted, celebrate]);

  useEffect(() => {
    if (!userId) return;

    checkProgress();

    // Set up realtime subscription for progress updates
    const channel = supabase
      .channel(`setup-progress-${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vehicles', filter: `user_id=eq.${userId}` },
        () => checkProgress())
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'loads', filter: `user_id=eq.${userId}` },
        () => checkProgress())
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'invoices', filter: `user_id=eq.${userId}` },
        () => checkProgress())
      .subscribe();

    // Fallback polling every 10 seconds
    const pollInterval = setInterval(checkProgress, 10000);

    // Check when window regains focus
    const handleFocus = () => checkProgress();
    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId, checkProgress]);

  const handleDismiss = async () => {
    setDismissed(true);
    try {
      await supabase
        .from('users')
        .update({ setup_checklist_dismissed: true })
        .eq('id', userId);
    } catch (error) {
      console.error('Error dismissing checklist:', error);
    }
  };

  const handleCelebrationDismiss = async () => {
    setShowCelebration(false);
    setDismissed(true);
    celebrate('checklist_complete');

    // Persist dismissal to database so it never comes back
    try {
      await supabase
        .from('users')
        .update({ setup_checklist_dismissed: true })
        .eq('id', userId);
    } catch (error) {
      console.error('Error dismissing celebration:', error);
    }
  };

  // Calculate weighted progress with Zeigarnik effect
  const totalWeight = checklistItems.reduce((sum, item) => sum + item.weight, 0);
  const completedWeight = checklistItems
    .filter(item => completedSteps.includes(item.id))
    .reduce((sum, item) => sum + item.weight, 0);

  // Start at 20%, scale remaining 80% based on completion
  const progressPercent = Math.round(INITIAL_PROGRESS + ((completedWeight / totalWeight) * (100 - INITIAL_PROGRESS)));

  const nextStep = checklistItems.find(item => !completedSteps.includes(item.id));
  const remainingTime = checklistItems
    .filter(item => !completedSteps.includes(item.id))
    .reduce((sum, item) => sum + parseInt(item.estimatedTime), 0);

  // Don't show if loading or dismissed
  if (loading || dismissed) return null;

  // Show celebration modal when all complete
  if (showCelebration) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 mb-6 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <Trophy size={28} className="text-yellow-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{t('setupChecklist.celebration.title')}</h3>
                <p className="text-green-100 mt-0.5">{t('setupChecklist.celebration.message')}</p>
              </div>
            </div>
            <button
              onClick={handleCelebrationDismiss}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </motion.div>
        <CelebrationModal {...CelebrationModalProps} />
      </>
    );
  }

  // Hide if all steps complete
  if (completedSteps.length === checklistItems.length) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {t('setupChecklist.title')}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock size={14} />
                <span>{remainingTime} min remaining</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">{t('setupChecklist.yourProgress')}</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {progressPercent}% Complete
            </span>
          </div>
          <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: `${INITIAL_PROGRESS}%` }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full relative"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </motion.div>
          </div>
        </div>

        {/* Checklist Items */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {checklistItems.map((item, index) => {
            const isComplete = completedSteps.includes(item.id);
            const isNext = nextStep?.id === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                  isComplete
                    ? 'bg-gray-50/50 dark:bg-gray-800/30'
                    : isNext
                      ? 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {/* Status Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isComplete
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : isNext
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                }`}>
                  {isComplete ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      <CheckCircle size={18} />
                    </motion.div>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`${
                      isComplete
                        ? 'text-gray-500 dark:text-gray-400 line-through'
                        : 'text-gray-900 dark:text-gray-100 font-medium'
                    }`}>
                      {t(`setupChecklist.items.${item.id}.title`)}
                    </span>
                    {isNext && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium animate-pulse">
                        {t('setupChecklist.next')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {t(`setupChecklist.items.${item.id}.description`)}
                  </p>
                </div>

                {/* Time estimate or check */}
                <div className="flex-shrink-0 text-right">
                  {isComplete ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400">
                      <span className="text-xs">{item.estimatedTime}</span>
                      <ChevronRight size={18} />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Action for Next Step */}
        {nextStep && (
          <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
            <Link
              href={nextStep.href}
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow"
            >
              {nextStep.icon}
              <span>{t(`setupChecklist.items.${nextStep.id}.title`)}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </motion.div>

      {/* Celebration Modal */}
      <CelebrationModal {...CelebrationModalProps} />

      {/* CSS for shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
}
