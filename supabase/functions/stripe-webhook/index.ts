import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      throw new Error("Missing webhook signature or secret");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err });
      return new Response(`Webhook signature verification failed`, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, supabaseClient);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice, supabaseClient);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabaseClient);
        break;
      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSubscriptionChange(subscription: Stripe.Subscription, supabaseClient: any) {
  logStep("Handling subscription change", { subscriptionId: subscription.id, status: subscription.status });

  const customerId = subscription.customer as string;
  const customer = await getStripeCustomer(customerId);
  
  if (!customer?.email) {
    logStep("No customer email found", { customerId });
    return;
  }

  const isActive = subscription.status === 'active';
  let subscriptionTier = null;
  let subscriptionEnd = null;

  if (isActive) {
    const priceId = subscription.items.data[0].price.id;
    subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    
    // Map price IDs to subscription tiers
    switch (priceId) {
      case "price_1RtOe1R5hjXkJqtZ6BM47HkI":
        subscriptionTier = "Pro";
        break;
      case "price_1RtOedR5hjXkJqtZNiUKd7bk":
        subscriptionTier = "Pro Plus";
        break;
      default:
        subscriptionTier = "Unknown";
    }
  }

  // Update subscriber record
  const { error } = await supabaseClient.from("subscribers").upsert({
    email: customer.email,
    stripe_customer_id: customerId,
    subscribed: isActive,
    subscription_tier: subscriptionTier,
    subscription_end: subscriptionEnd,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'email' });

  if (error) {
    logStep("Error updating subscriber", { error: error.message });
  } else {
    logStep("Subscriber updated successfully", { 
      email: customer.email, 
      subscribed: isActive, 
      tier: subscriptionTier 
    });
  }

  // Reset usage tracking for new billing period
  if (isActive && subscription.status === 'active') {
    await resetUsageTracking(customer.email, supabaseClient);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, supabaseClient: any) {
  logStep("Handling payment succeeded", { invoiceId: invoice.id });
  
  const customerId = invoice.customer as string;
  const customer = await getStripeCustomer(customerId);
  
  if (customer?.email) {
    // Reset usage for new billing period
    await resetUsageTracking(customer.email, supabaseClient);
    logStep("Usage reset for successful payment", { email: customer.email });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabaseClient: any) {
  logStep("Handling payment failed", { invoiceId: invoice.id });
  // You can add logic here to handle failed payments
  // For example, send notifications or update subscription status
}

async function getStripeCustomer(customerId: string) {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
  });
  
  try {
    return await stripe.customers.retrieve(customerId);
  } catch (error) {
    logStep("Error retrieving Stripe customer", { customerId, error });
    return null;
  }
}

async function resetUsageTracking(email: string, supabaseClient: any) {
  const currentPeriodStart = new Date();
  const currentPeriodEnd = new Date();
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

  const { error } = await supabaseClient
    .from('usage_tracking')
    .upsert({
      email: email,
      generation_count: 0,
      edit_count: 0,
      total_usage: 0,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    }, { 
      onConflict: 'email',
      ignoreDuplicates: false 
    });

  if (error) {
    logStep("Error resetting usage tracking", { email, error: error.message });
  } else {
    logStep("Usage tracking reset successfully", { email });
  }
}