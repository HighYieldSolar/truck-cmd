import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId'
      }, { status: 400 });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get subscription data from database to find Stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription found'
      }, { status: 404 });
    }

    try {
      // Fetch invoices from Stripe
      const invoices = await stripe.invoices.list({
        customer: subscription.stripe_customer_id,
        limit: 50, // Get up to 50 recent invoices
        expand: ['data.subscription']
      });

      // Format invoice data for frontend
      const formattedInvoices = invoices.data.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        amount_paid: invoice.amount_paid,
        total: invoice.total,
        status: invoice.status,
        created: invoice.created * 1000, // Convert to JS timestamp
        currency: invoice.currency,
        description: invoice.description ||
          (invoice.lines.data[0]?.description) ||
          `${invoice.subscription ? 'Subscription' : 'Payment'}`,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        period_start: invoice.period_start ? invoice.period_start * 1000 : null,
        period_end: invoice.period_end ? invoice.period_end * 1000 : null,
        subscription_id: invoice.subscription
      }));

      return NextResponse.json({
        success: true,
        invoices: formattedInvoices
      });

    } catch (stripeError) {
      console.error('Stripe error fetching invoices:', stripeError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch billing history from Stripe'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error fetching billing history:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch billing history'
    }, { status: 500 });
  }
} 