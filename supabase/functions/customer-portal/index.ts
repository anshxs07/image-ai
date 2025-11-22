import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    // Decode Clerk JWT token to get user info
    const token = authHeader.replace("Bearer ", "");
    let userEmail: string;
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      logStep("Token payload", payload);
      
      // Get user ID from token
      userId = payload.sub || payload.user_id || payload.id;
      
      if (!userId) {
        throw new Error("User ID not found in token");
      }
      
      // Fetch user email from Clerk API
      const clerkSecretKey = Deno.env.get('CLERK_SECRET_KEY');
      if (!clerkSecretKey) {
        throw new Error('CLERK_SECRET_KEY not configured');
      }
      
      const userResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${clerkSecretKey}`,
        },
      });
      
      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user from Clerk: ${userResponse.status}`);
      }
      
      const userData = await userResponse.json();
      userEmail = userData.email_addresses?.[0]?.email_address;
      
      if (!userEmail) {
        throw new Error('Email not found in Clerk user data');
      }
    } catch (error) {
      logStep("Token decode error", { error: error.message });
      throw new Error(`Invalid token or email not available: ${error.message}`);
    }
    logStep("User authenticated", { email: userEmail });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const origin = req.headers.get("origin") || "http://localhost:8080";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/`,
    });
    logStep("Customer portal session created", { sessionId: portalSession.id, url: portalSession.url });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});