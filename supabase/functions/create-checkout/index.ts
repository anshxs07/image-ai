import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { plan } = await req.json();
    if (!plan) throw new Error("Plan is required");
    logStep("Plan received", { plan });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    // For Clerk integration, we'll decode the token differently
    // For now, we'll extract email from the token payload
    let user_email: string;
    try {
      // Decode Clerk JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      user_email = payload.email;
      if (!user_email) throw new Error("Email not found in token");
    } catch (error) {
      throw new Error("Invalid token or email not available");
    }
    logStep("User authenticated", { email: user_email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    const customers = await stripe.customers.list({ email: user_email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("Creating new customer");
    }

    // Define price IDs for each plan
    const planPricing = {
      pro: { priceId: "price_1RtOe1R5hjXkJqtZ6BM47HkI", name: "Pro Plan - 25 generations/edits per month" },
      proplus: { priceId: "price_1RtOedR5hjXkJqtZNiUKd7bk", name: "Pro Plus Plan - 500 generations/edits per month" }
    };

    const selectedPlan = planPricing[plan as keyof typeof planPricing];
    if (!selectedPlan) throw new Error("Invalid plan selected");

    logStep("Creating checkout session", { plan, priceId: selectedPlan.priceId });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user_email,
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        user_email: user_email,
        plan: plan
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});