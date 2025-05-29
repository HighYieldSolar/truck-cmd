"use client";

import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Create the context
const SubscriptionContext = createContext();

// Custom hook to use the subscription context
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// Create a provider component
export function SubscriptionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [subscription, setSubscription] = useState({
    status: 'loading', // loading, trial, active, expired, none
    plan: null,
    trialEndsAt: null,
    currentPeriodEndsAt: null
  });
  const refreshTimeoutRef = useRef(null);
  const initialLoadRef = useRef(false);
  const isCheckingRef = useRef(false);

  // Add mounted state check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user and subscription data
  const checkUserAndSubscription = async () => {
    // Prevent multiple simultaneous calls
    if (isCheckingRef.current) {
      console.log("Already checking subscription, skipping...");
      return;
    }

    try {
      isCheckingRef.current = true;
      setLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setUser(null);
        setSubscription({
          status: 'none',
          plan: null,
          trialEndsAt: null,
          currentPeriodEndsAt: null
        });
        setLoading(false);
        return;
      }

      setUser(user);

      // Check for subscription
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        // Log the error but continue 
        console.error('Error fetching subscription:', subError);
      }

      if (subscriptionData) {
        console.log("Found subscription data:", subscriptionData);

        // Subscription exists - set data
        setSubscription({
          status: subscriptionData.status,
          plan: subscriptionData.plan,
          trialEndsAt: subscriptionData.trial_ends_at,
          currentPeriodEndsAt: subscriptionData.current_period_ends_at,
          stripeCustomerId: subscriptionData.stripe_customer_id,
          stripeSubscriptionId: subscriptionData.stripe_subscription_id,
          billingCycle: subscriptionData.billing_cycle,
          amount: subscriptionData.amount
        });
      } else {
        console.log("No subscription found, creating trial subscription");

        // No subscription record found - create a trial subscription
        const createdAt = new Date(user.created_at || Date.now());
        const trialEndDate = new Date(createdAt);
        trialEndDate.setDate(trialEndDate.getDate() + 7);

        // Create subscription record in the database
        try {
          await supabase
            .from('subscriptions')
            .insert([{
              user_id: user.id,
              status: 'trial',
              plan: null,
              trial_ends_at: trialEndDate.toISOString(),
              created_at: new Date().toISOString()
            }]);

          setSubscription({
            status: 'trial',
            plan: null,
            trialEndsAt: trialEndDate.toISOString(),
            currentPeriodEndsAt: null
          });
        } catch (insertError) {
          console.error('Error creating trial subscription:', insertError);
          // Set default trial data anyway
          setSubscription({
            status: 'trial',
            plan: null,
            trialEndsAt: trialEndDate.toISOString(),
            currentPeriodEndsAt: null
          });
        }
      }
    } catch (error) {
      console.error('Error in subscription context:', error);
      // Set fallback state
      setSubscription({
        status: 'error',
        plan: null,
        trialEndsAt: null,
        currentPeriodEndsAt: null
      });
    } finally {
      setLoading(false);
      isCheckingRef.current = false;
    }
  };

  // Initial load effect - only run once when mounted
  useEffect(() => {
    if (!mounted || initialLoadRef.current) return;

    initialLoadRef.current = true;
    checkUserAndSubscription();

    // Set up subscription to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          // Reset the checking flag and re-check
          isCheckingRef.current = false;
          setTimeout(() => {
            checkUserAndSubscription();
          }, 100); // Small delay to prevent race conditions
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSubscription({
            status: 'none',
            plan: null,
            trialEndsAt: null,
            currentPeriodEndsAt: null
          });
          initialLoadRef.current = false;
          isCheckingRef.current = false;
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [mounted]);

  // Set up realtime subscription to database changes (with debouncing)
  useEffect(() => {
    if (!user || !mounted) return;

    const subscriptionsChannel = supabase
      .channel('subscriptions-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log("Subscription data changed:", payload);

          // Clear any existing timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }

          // Debounce the refresh to prevent rapid successive updates
          refreshTimeoutRef.current = setTimeout(() => {
            // Only refresh if not currently checking
            if (!isCheckingRef.current) {
              // Only refresh if the change is from an external source
              const currentTime = Date.now();
              const payloadTime = new Date(payload.new?.updated_at || payload.old?.updated_at).getTime();

              // If the change happened more than 5 seconds ago, it's likely from webhook
              // Or if the status changed to 'active', always refresh to show the new subscription
              const isStatusChangeToActive = payload.new?.status === 'active' && payload.old?.status !== 'active';
              const isExternalChange = currentTime - payloadTime > 5000;

              if (isExternalChange || isStatusChangeToActive) {
                console.log("External subscription change or activation detected, refreshing...", {
                  isStatusChangeToActive,
                  isExternalChange,
                  timeDiff: currentTime - payloadTime
                });
                checkUserAndSubscription();
              } else {
                console.log("Recent subscription change detected, likely from current session, skipping refresh", {
                  timeDiff: currentTime - payloadTime
                });
              }
            }
          }, 2000); // Increased to 2 seconds for more stability
        })
      .subscribe();

    // Clean up subscriptions
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      supabase.removeChannel(subscriptionsChannel);
    };
  }, [user, mounted]);

  // Check if trial is active and valid
  const isTrialActive = () => {
    if (subscription.status !== 'trial') return false;
    if (!subscription.trialEndsAt) return false;

    const now = new Date();
    const trialEndDate = new Date(subscription.trialEndsAt);
    return trialEndDate > now;
  };

  // Check if subscription is active and valid
  const isSubscriptionActive = () => {
    if (subscription.status !== 'active') return false;
    if (!subscription.currentPeriodEndsAt) return true; // If no end date, assume indefinite

    const now = new Date();
    const endDate = new Date(subscription.currentPeriodEndsAt);
    return endDate > now;
  };

  // Function to update subscription status
  const updateSubscription = async (newData) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          ...newData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state immediately
      setSubscription(prev => ({
        ...prev,
        ...newData
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to calculate days left in trial
  const getDaysLeftInTrial = () => {
    if (!isTrialActive()) return 0;

    const now = new Date();
    const trialEndDate = new Date(subscription.trialEndsAt);
    const diffTime = trialEndDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  // Manually refresh subscription data (with rate limiting)
  const refreshSubscription = () => {
    if (isCheckingRef.current) return; // Prevent multiple calls

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Debounce the refresh
    refreshTimeoutRef.current = setTimeout(() => {
      console.log("Manual refresh triggered");
      checkUserAndSubscription();
    }, 500);
  };

  // Don't render children until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  // Provide the context value
  const value = {
    user,
    subscription,
    loading,
    isTrialActive,
    isSubscriptionActive,
    getDaysLeftInTrial,
    updateSubscription,
    refreshSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}