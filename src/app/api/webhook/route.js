// app/api/webhook/route.jsimport { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabaseClient";

export async function POST(req) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature");
  const supabase = createClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (!signature || !webhookSecret) return;

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error(`❌ Webhook Verification Error:`, err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      console.log("customer.subscription.created or customer.subscription.updated event received");
      const subscription = event.data.object;
      console.log("subscription object:", subscription)
      const subscriptionId = subscription.id;      
      const status = subscription.status;
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const trialEnd = subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null;
      const stripeCustomerId = subscription.customer;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", stripeCustomerId)
        .single();

      if (userError) {
        console.error("Error getting user from stripe customer id:", userError);
        return new Response("Error getting user from stripe customer id", {
          status: 500,
        });
      }
      const userId = userData.id;

      const updatedData = {
        stripe_subscription_id: subscriptionId,
        current_period_ends_at: currentPeriodEnd,
      };

      if (status === "active") {
        updatedData.status = "active";
      } else if (status === "trialing") {
        updatedData.status = "trial";
        updatedData.trial_ends_at = trialEnd;
      }

      const { error } = await supabase
        .from("subscriptions")
        .update(updatedData)
        .eq("user_id", userId)

      if (error) {
        console.error("Error updating subscription:", error);
        return new Response("Error updating subscription", { status: 500 });
      }
      console.log("Subscription updated successfully for user:", userId);
      console.log("Updated data:", updatedData);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const subscriptionId = subscription.id;
      const stripeCustomerId = subscription.customer;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("stripe_customer_id", stripeCustomerId)
        .single();

      if (userError) {
        console.error("Error getting user from stripe customer id:", userError);
        return new Response("Error getting user from stripe customer id", {
          status: 500,
        });
      }
      const userId = userData.id;

      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "canceled", stripe_subscription_id: subscriptionId })
        .eq("user_id", userId)

      if (error) {
        console.error("Error updating subscription:", error);
        return new Response("Error updating subscription", { status: 500 });
      }
      console.log("Subscription canceled successfully for user:", userId);
      break;
    }
    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }));
}
