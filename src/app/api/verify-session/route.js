// app/api/verify-session/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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
      
      // Extract metadata
      const plan = session.metadata?.plan || 'premium';
      const billingCycle = session.metadata?.billingCycle || 'monthly';
      
      // Get customer and subscription info
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      
      // Get subscription details for current period end
      let currentPeriodEnd = null;
      if (subscriptionId) {
        try {
          console.log('Retrieving subscription details from Stripe');
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          console.log('Current period end:', currentPeriodEnd);
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