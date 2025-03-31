// /api/webhook.js
const crypto = require('crypto');

// Your webhook secret from Truck Command
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET; // Set this in Vercel environment variables

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the signature from headers
  const signature = req.headers['truck-command-signature'];
  
  if (!signature) {
    console.error('No signature found in request');
    return res.status(400).json({ error: 'No signature' });
  }

  // Get the raw body
  const rawBody = JSON.stringify(req.body);
  
  // Verify the signature
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = hmac.update(rawBody).digest('hex');
  
  // Use a constant-time comparison to prevent timing attacks
  let signatureValid = false;
  try {
    signatureValid = crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch (err) {
    console.error('Error comparing signatures', err);
    signatureValid = false;
  }

  if (!signatureValid) {
    console.error('Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Get the event data
  const event = req.body;

  // Process the event based on type
  try {
    switch (event.type) {
      case 'billing.alert.triggered':
        await handleBillingAlert(event);
        break;
      case 'billing_portal.configuration.created':
        await handlePortalConfigCreated(event);
        break;
      case 'billing_portal.configuration.updated':
        await handlePortalConfigUpdated(event);
        break;
      case 'billing_portal.session.created':
        await handlePortalSessionCreated(event);
        break;
      case 'checkout.session.async_payment_failed':
        await handleCheckoutPaymentFailed(event);
        break;
      case 'checkout.session.async_payment_succeeded':
        await handleCheckoutPaymentSucceeded(event);
        break;
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;
      case 'checkout.session.expired':
        await handleCheckoutExpired(event);
        break;
      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing webhook event: ${err.message}`);
    // We still return 200 so the webhook isn't retried
    // You might want to log this error to a monitoring service
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
}

// Event handler functions
async function handleBillingAlert(event) {
  console.log('Billing alert triggered:', event.data);
  // Add your business logic here
}

async function handlePortalConfigCreated(event) {
  console.log('Portal configuration created:', event.data);
  // Add your business logic here
}

async function handlePortalConfigUpdated(event) {
  console.log('Portal configuration updated:', event.data);
  // Add your business logic here
}

async function handlePortalSessionCreated(event) {
  console.log('Portal session created:', event.data);
  // Add your business logic here
}

async function handleCheckoutPaymentFailed(event) {
  console.log('Checkout payment failed:', event.data);
  // Add your business logic here
  // Consider sending notifications to the customer or support team
}

async function handleCheckoutPaymentSucceeded(event) {
  console.log('Checkout payment succeeded:', event.data);
  // Add your business logic here
}

async function handleCheckoutCompleted(event) {
  console.log('Checkout completed:', event.data);
  // Add your business logic here
  // Usually involves provisioning access to your product
  
  const checkoutSession = event.data.object;
  const customerId = checkoutSession.customer;
  const subscriptionId = checkoutSession.subscription;
  
  // Update your database with new subscription info
  // await updateCustomerSubscription(customerId, subscriptionId);
  
  // Example: Send welcome email
  // await sendWelcomeEmail(checkoutSession.customer_email);
}

async function handleCheckoutExpired(event) {
  console.log('Checkout expired:', event.data);
  // Add your business logic here
}