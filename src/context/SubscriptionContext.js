"use client";

import { createContext, useState, useContext, useEffect } from 'react';
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
  const [subscription, setSubscription] = useState({
    status: 'loading', // loading, trial, active, expired, none
    plan: null,
    trialEndsAt: null,
    currentPeriodEndsAt: null
  });

  // Load user and subscription data
  useEffect(() => {
    const checkUserAndSubscription = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
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
          // Subscription exists - set data
          setSubscription({
            status: subscriptionData.status,
            plan: subscriptionData.plan,
            trialEndsAt: subscriptionData.trial_ends_at,
            currentPeriodEndsAt: subscriptionData.current_period_ends_at
          });
        } else {
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
      }
    };
    
    checkUserAndSubscription();
    
    // Set up subscription to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          checkUserAndSubscription();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSubscription({
            status: 'none',
            plan: null,
            trialEndsAt: null,
            currentPeriodEndsAt: null
          });
        }
      }
    );
    
    // Set up subscription to database changes
    const subscriptionsChannel = supabase
      .channel('subscriptions-changes')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'subscriptions', filter: user ? `user_id=eq.${user.id}` : undefined },
          (payload) => {
            // Refresh subscription data when changes occur
            checkUserAndSubscription();
          })
      .subscribe();
    
    // Clean up subscriptions
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
      supabase.removeChannel(subscriptionsChannel);
    };
  }, []);
  
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
      
      // Update local state
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

  // Provide the context value
  const value = {
    user,
    subscription,
    loading,
    isTrialActive,
    isSubscriptionActive,
    getDaysLeftInTrial,
    updateSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}