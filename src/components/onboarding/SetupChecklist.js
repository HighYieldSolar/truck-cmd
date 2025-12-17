"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, Circle, ChevronRight, Truck, Users, FileText,
  DollarSign, User, X, Sparkles, ArrowRight, Trophy
} from "lucide-react";

const checklistItems = [
  {
    id: 'truck',
    title: 'Add your first truck',
    description: 'Track mileage and manage your fleet',
    icon: <Truck size={18} />,
    href: '/dashboard/fleet/trucks?addNew=true',
    table: 'vehicles',
    color: 'blue'
  },
  {
    id: 'customer',
    title: 'Add a customer',
    description: 'Get ready to invoice clients',
    icon: <Users size={18} />,
    href: '/dashboard/customers?addNew=true',
    table: 'customers',
    color: 'green'
  },
  {
    id: 'load',
    title: 'Create your first load',
    description: 'Start tracking your hauls',
    icon: <FileText size={18} />,
    href: '/dashboard/dispatching?addNew=true',
    table: 'loads',
    color: 'purple'
  },
  {
    id: 'expense',
    title: 'Log an expense',
    description: 'Track your business costs',
    icon: <DollarSign size={18} />,
    href: '/dashboard/expenses?addNew=true',
    table: 'expenses',
    color: 'orange'
  },
  {
    id: 'profile',
    title: 'Complete your profile',
    description: 'Add phone & company name for invoices',
    icon: <User size={18} />,
    href: '/dashboard/settings/profile',
    checkFields: ['phone', 'company_name'], // Required for invoices
    color: 'indigo'
  }
];

export default function SetupChecklist({ userId }) {
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const checkProgress = async () => {
      try {
        // Check each table for existing records
        const checks = await Promise.all([
          // Check vehicles (trucks)
          supabase.from('vehicles').select('id').eq('user_id', userId).limit(1),
          // Check customers
          supabase.from('customers').select('id').eq('user_id', userId).limit(1),
          // Check loads
          supabase.from('loads').select('id').eq('user_id', userId).limit(1),
          // Check expenses
          supabase.from('expenses').select('id').eq('user_id', userId).limit(1),
          // Check user profile - get key business fields
          supabase.from('users').select('phone, company_name, address, city, state').eq('id', userId).single()
        ]);

        const completed = [];

        // Check each result
        if (checks[0].data?.length > 0) completed.push('truck');
        if (checks[1].data?.length > 0) completed.push('customer');
        if (checks[2].data?.length > 0) completed.push('load');
        if (checks[3].data?.length > 0) completed.push('expense');

        // Profile is complete if phone AND company name are filled (essential for invoices)
        const profile = checks[4].data;
        if (profile?.phone && profile?.company_name) {
          completed.push('profile');
        }

        setCompletedSteps(completed);

        // Check if user dismissed the checklist
        const { data: userData } = await supabase
          .from('users')
          .select('setup_checklist_dismissed')
          .eq('id', userId)
          .single();

        if (userData?.setup_checklist_dismissed) {
          setDismissed(true);
        }

        // Show celebration if all steps are complete
        if (completed.length === checklistItems.length) {
          setShowCelebration(true);
        }
      } catch (error) {
        console.error('Error checking setup progress:', error);
      } finally {
        setLoading(false);
      }
    };

    checkProgress();

    // Set up realtime subscription for progress updates
    const channel = supabase
      .channel(`setup-progress-${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vehicles', filter: `user_id=eq.${userId}` },
        () => checkProgress())
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'customers', filter: `user_id=eq.${userId}` },
        () => checkProgress())
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'loads', filter: `user_id=eq.${userId}` },
        () => checkProgress())
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses', filter: `user_id=eq.${userId}` },
        () => checkProgress())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[SetupChecklist] Realtime subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('[SetupChecklist] Realtime subscription error, falling back to polling');
        }
      });

    // Fallback: Check progress every 5 seconds in case realtime isn't working
    const pollInterval = setInterval(() => {
      checkProgress();
    }, 5000);

    // Also check when window regains focus (user might have just added something)
    const handleFocus = () => {
      checkProgress();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId]);

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
    handleDismiss();
  };

  const progressPercent = Math.round((completedSteps.length / checklistItems.length) * 100);
  const nextStep = checklistItems.find(item => !completedSteps.includes(item.id));

  // Don't show if loading, dismissed, or all complete
  if (loading || dismissed) return null;

  // Show celebration modal if all complete
  if (showCelebration) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 mb-6 text-white relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy size={28} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Setup Complete!</h3>
              <p className="text-green-100 mt-0.5">You're all set to run your trucking business with Truck Command</p>
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
    );
  }

  // Hide if all steps complete
  if (completedSteps.length === checklistItems.length) return null;

  return (
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
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Get Started with Truck Command</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Complete these steps to set up your business</p>
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
          <span className="text-gray-600 dark:text-gray-400">Your progress</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{progressPercent}% complete</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
          />
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isComplete
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : isNext
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}>
                {isComplete ? (
                  <CheckCircle size={18} />
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
                    {item.title}
                  </span>
                  {isNext && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                      Next
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
              </div>

              {/* Action Icon */}
              <div className={`flex-shrink-0 ${
                isComplete ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {isComplete ? (
                  <CheckCircle size={20} />
                ) : (
                  <ChevronRight size={20} />
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
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            {nextStep.icon}
            <span>{nextStep.title}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </motion.div>
  );
}
