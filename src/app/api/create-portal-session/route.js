import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const { userId, returnUrl } = await request.json();
    
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
      return NextResponse.json({ 
        error: 'Subscription not found' 
      }, { status: 404 });
    }

    // Create a Stripe billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_URL}/dashboard/billing`,
    });

    // Return the URL for the portal
    return NextResponse.json({ url: session.url });
    
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create portal session' 
    }, { status: 500 });
  }
}