// src/app/api/get-invoice-pdf/route.js
import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const { userId, invoiceId } = await request.json();
    
    if (!userId || !invoiceId) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Verify that this user has access to this invoice
    // First get the customer ID associated with this user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
      
    if (subError || !subscription?.stripe_customer_id) {
      console.error('Subscription not found for user:', userId);
      return NextResponse.json({ 
        error: 'Subscription not found' 
      }, { status: 404 });
    }
    
    // Get the invoice from Stripe
    const invoice = await stripe.invoices.retrieve(invoiceId);
    
    // Verify the invoice belongs to this customer
    if (invoice.customer !== subscription.stripe_customer_id) {
      return NextResponse.json({ 
        error: 'Access denied: Invoice does not belong to this user' 
      }, { status: 403 });
    }
    
    // Get the invoice PDF URL - use hosted invoice URL if available
    const invoiceUrl = invoice.hosted_invoice_url || invoice.invoice_pdf;
    
    if (!invoiceUrl) {
      return NextResponse.json({ 
        error: 'Invoice PDF not available' 
      }, { status: 404 });
    }
    
    // Return the URL for the invoice PDF
    return NextResponse.json({ url: invoiceUrl });
    
  } catch (error) {
    console.error('Error retrieving invoice PDF:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to retrieve invoice PDF' 
    }, { status: 500 });
  }
}