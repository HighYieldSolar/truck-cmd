// src/app/api/create-portal-session/route.js
import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const { 
      userId, 
      returnUrl, 
      mode = null // Optional parameter to specify portal mode
    } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Get subscription data from database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .single();
      
    if (subError || !subscription?.stripe_customer_id) {
      console.error('Subscription not found for user:', userId);
      return NextResponse.json({ 
        error: 'Subscription not found' 
      }, { status: 404 });
    }

    // Configure portal session based on mode
    const configuration = {
      customer: subscription.stripe_customer_id,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_URL}/dashboard/billing`,
    };
    
    // Add optional configuration based on requested mode
    if (mode) {
      // Add flow_data for specific actions
      configuration.flow_data = {
        type: "flow",
        flow: '',
      };
      
      switch (mode) {
        case 'update_payment_method':
          configuration.flow_data.flow = 'updating_payment_methods';
          break;
        case 'add_payment_method':
          configuration.flow_data.flow = 'add_payment_method';
          break;
        case 'update_subscription':
          configuration.flow_data.flow = 'updating_subscription';
          // Can specify subscription items if needed
          if (subscription.stripe_subscription_id) {
            configuration.flow_data.subscription = subscription.stripe_subscription_id;
          }
          break;
        case 'cancel_subscription':
          configuration.flow_data.flow = 'canceling_subscription';
          if (subscription.stripe_subscription_id) {
            configuration.flow_data.subscription = subscription.stripe_subscription_id;
          }
          break;
        default:
          // If mode isn't recognized, exclude flow_data
          delete configuration.flow_data;
      }
    }
    
    console.log('Creating portal session with config:', JSON.stringify(configuration, null, 2));

    // Create a Stripe billing portal session
    const session = await stripe.billingPortal.sessions.create(configuration);

    // Return the URL for the portal
    return NextResponse.json({ url: session.url });
    
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create portal session' 
    }, { status: 500 });
  }
}