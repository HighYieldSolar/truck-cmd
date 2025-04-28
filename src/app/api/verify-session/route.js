// src/app/api/verify-session/route.js
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
      
      // Return the verification result
      return NextResponse.json({
        valid: true,
        userId,
        customerId,
        subscriptionId,
        plan,
        billingCycle,
        currentPeriodEnd,
        // Determine pricing based on plan and cycle
        monthlyPrice: 
          plan === 'basic' ? 19 : 
          plan === 'premium' ? 39 : 
          plan === 'fleet' ? 69 : 39,
        yearlyPrice: 
          plan === 'basic' ? 16 : 
          plan === 'premium' ? 33 : 
          plan === 'fleet' ? 55 : 33,
        yearlyTotal: 
          plan === 'basic' ? 192 : 
          plan === 'premium' ? 396 : 
          plan === 'fleet' ? 660 : 396,
      });
    } catch (stripeError) {
      console.error('Stripe error during session verification:', stripeError);
      return NextResponse.json({ 
        valid: false, 
        error: stripeError.message || 'Failed to verify with Stripe'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json({ 
      valid: false, 
      error: error.message || 'Failed to verify session'
    }, { status: 500 });
  }
}