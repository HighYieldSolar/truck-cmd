// app/api/create-checkout-session/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request) {
  try {
    // Log incoming request data
    const body = await request.json();
    console.log('Request body:', body);
    
    // Check for required fields
    if (!body.userId || !body.plan || !body.billingCycle) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: { received: body } 
      }, { status: 400 });
    }
    
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized with key ending in:', process.env.STRIPE_SECRET_KEY.slice(-4));
    
    // Create pricing data based on plan and billing cycle
    const { userId, plan, billingCycle } = body;
    
    // Map plan and billing cycle to price IDs
    // You'll need to replace these with your actual Stripe price IDs
    const priceIds = {
      basic: {
        monthly: 'prod_S2ao3TQzEFN4J2', // Replace with your price ID
        yearly: 'prod_S2ao9Baw2RXAqp'   // Replace with your price ID
      },
      premium: {
        monthly: 'prod_S2ap0sT94fhgjW', // Replace with your price ID
        yearly: 'prod_S2aqXfxxVSxJUd'   // Replace with your price ID
      },
      fleet: {
        monthly: 'prod_S2aqBXiqXkCbfZ', // Replace with your price ID
        yearly: 'prod_S2aqnrpoWbXu08'   // Replace with your price ID
      }
    };
    
    // If price IDs aren't configured yet, use test mode
    const testMode = true; // Set to false once you have real price IDs
    
    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: body.email, // Add this if available
      client_reference_id: userId,
      payment_method_types: ['card'],
      line_items: [
        testMode ? 
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan (${billingCycle})`,
            },
            unit_amount: plan === 'basic' ? 1900 : plan === 'premium' ? 3900 : 6900, // Amount in cents
            recurring: {
              interval: billingCycle === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        } :
        {
          price: priceIds[plan][billingCycle],
          quantity: 1,
        }
      ],
      mode: 'subscription',
      success_url: `${body.returnUrl || process.env.NEXT_PUBLIC_URL + '/dashboard/billing'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${body.returnUrl || process.env.NEXT_PUBLIC_URL + '/dashboard/billing'}/cancel`,
      metadata: {
        userId,
        plan,
        billingCycle
      }
    });

    console.log('Session created:', session.id);
    
    // Return success with URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
      details: JSON.stringify(error)
    }, { status: 500 });
  }
}