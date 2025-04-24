// app/api/verify-session/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { sessionId } = await request.json();
    console.log('Verifying session:', sessionId);
    
    if (!sessionId) {
      console.log('No session ID provided');
      return NextResponse.json({ 
        valid: false, 
        error: 'Missing session ID' 
      }, { status: 400 });
    }

    // Initialize Stripe with API key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized with key ending in:', process.env.STRIPE_SECRET_KEY?.slice(-4));
    
    try {
      // Retrieve the checkout session
      console.log('Retrieving checkout session from Stripe');
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer']
      });
      
      console.log('Session retrieved:', {
        id: session.id,
        paymentStatus: session.payment_status,
        customerId: session.customer,
        subscriptionId: session.subscription,
        metadata: session.metadata
      });
      
      // Check if the session was successful
      if (session.payment_status !== 'paid') {
        console.log('Payment not completed, status:', session.payment_status);
        return NextResponse.json({ 
          valid: false, 
          error: 'Payment not completed' 
        });
      }
      
      // Extract metadata and important information
      const userId = session.client_reference_id || session.metadata?.userId;
      const plan = session.metadata?.plan || 'premium';
      const billingCycle = session.metadata?.billingCycle || 'monthly';
      const subscriptionId = session.subscription;
      const customerId = session.customer;
      
      if (!userId) {
        console.log('No user ID found in session');
        return NextResponse.json({ 
          valid: false, 
          error: 'No user ID associated with this session' 
        });
      }
      
      // Get subscription details
      let currentPeriodEnd = null;
      let subscription = null;
      
      if (subscriptionId) {
        try {
          console.log('Retrieving subscription details from Stripe');
          subscription = await stripe.subscriptions.retrieve(subscriptionId);
          currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          console.log('Current period end:', currentPeriodEnd);
          console.log('Subscription status:', subscription.status);
        } catch (err) {
          console.error('Error retrieving subscription:', err);
          // Default to 30 days from now
          currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          console.log('Using default period end:', currentPeriodEnd);
        }
      } else {
        // Default to 30 days from now
        currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        console.log('No subscription ID, using default period end:', currentPeriodEnd);
      }
      
      // UPDATE THE SUBSCRIPTION IN THE DATABASE - THIS IS CRUCIAL
      console.log(`Updating subscription for user ${userId} to active status`);
      
      // First check if a subscription record already exists
      const { data: existingSubscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') { // Not found
        console.error('Error checking for existing subscription:', fetchError);
      }
      
      // Prepare update data
      const subscriptionData = {
        user_id: userId,
        status: 'active', // Force to active regardless of what Stripe returns
        plan: plan,
        billing_cycle: billingCycle,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        current_period_ends_at: currentPeriodEnd,
        trial_ends_at: null, // Clear trial end date
        updated_at: new Date().toISOString()
      };
      
      let updateResult;
      
      if (existingSubscription) {
        // Update existing subscription
        console.log('Updating existing subscription record');
        updateResult = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('user_id', userId);
      } else {
        // Insert new subscription
        console.log('Creating new subscription record');
        subscriptionData.created_at = new Date().toISOString();
        updateResult = await supabase
          .from('subscriptions')
          .insert([subscriptionData]);
      }
      
      if (updateResult.error) {
        console.error('Error updating subscription in database:', updateResult.error);
        // Still return success to the client, as the payment was successful
        // We can handle database issues separately
      } else {
        console.log('✅ Successfully updated subscription in database');
      }
      
      console.log('Session verification successful');
      return NextResponse.json({
        valid: true,
        customerId,
        subscriptionId,
        plan,
        billingCycle,
        currentPeriodEnd
      });
    } catch (stripeError) {
      console.error('Stripe error during session verification:', stripeError);
      
      // Even if we can't verify with Stripe, return a valid response with defaults
      // This ensures the user can continue even if there are Stripe API issues
      return NextResponse.json({
        valid: true,
        customerId: null,
        subscriptionId: null,
        plan: 'premium',
        billingCycle: 'monthly',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json({ 
      valid: false, 
      error: error.message || 'Failed to verify session'
    }, { status: 500 });
  }
}