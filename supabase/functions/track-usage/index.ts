import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRACK-USAGE] ${step}${detailsStr}`);
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
    logStep("Function started");

    const { action } = await req.json(); // 'generate' or 'edit'
    if (!action) throw new Error("Action is required");
    logStep("Action received", { action });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    // Decode Clerk JWT token to get user info
    const token = authHeader.replace("Bearer ", "");
    let userEmail: string;
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userEmail = payload.email;
      userId = payload.sub || payload.user_id;
      if (!userEmail) throw new Error("Email not found in token");
    } catch (error) {
      throw new Error("Invalid token or email not available");
    }
    logStep("User authenticated", { userId, email: userEmail });

    // Get current usage for this user
    const { data: existingUsage, error: usageError } = await supabaseClient
      .from("usage_tracking")
      .select("*")
      .eq("email", userEmail)
      .gte("current_period_end", new Date().toISOString())
      .single();

    let currentUsage = existingUsage;
    
    if (!currentUsage || usageError) {
      // Create new usage record for current period
      const currentPeriodStart = new Date();
      currentPeriodStart.setDate(1); // First day of current month
      currentPeriodStart.setHours(0, 0, 0, 0);
      
      const currentPeriodEnd = new Date(currentPeriodStart);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      const { data: newUsage, error: insertError } = await supabaseClient
        .from("usage_tracking")
        .insert({
          user_id: userId,
          email: userEmail,
          generation_count: 0,
          edit_count: 0,
          total_usage: 0,
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString()
        })
        .select()
        .single();

      if (insertError) throw new Error(`Failed to create usage record: ${insertError.message}`);
      currentUsage = newUsage;
      logStep("Created new usage record", { usage: currentUsage });
    }

    // Check subscription tier and limits
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", userEmail)
      .single();

    let limit = 5; // Free plan default
    if (subscription && subscription.subscribed) {
      switch (subscription.subscription_tier) {
        case "Pro":
          limit = 25;
          break;
        case "Pro Plus":
          limit = 500;
          break;
        default:
          limit = 5;
      }
    }

    // Check if user has reached limit
    if (currentUsage.total_usage >= limit) {
      logStep("Usage limit reached", { current: currentUsage.total_usage, limit });
      return new Response(JSON.stringify({ 
        error: "Usage limit reached for current billing period",
        current_usage: currentUsage.total_usage,
        limit: limit,
        subscription_tier: subscription?.subscription_tier || "Free"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    // Update usage
    const updates: any = {
      total_usage: currentUsage.total_usage + 1,
      updated_at: new Date().toISOString()
    };

    if (action === 'generate') {
      updates.generation_count = currentUsage.generation_count + 1;
    } else if (action === 'edit') {
      updates.edit_count = currentUsage.edit_count + 1;
    }

    const { data: updatedUsage, error: updateError } = await supabaseClient
      .from("usage_tracking")
      .update(updates)
      .eq("id", currentUsage.id)
      .select()
      .single();

    if (updateError) throw new Error(`Failed to update usage: ${updateError.message}`);
    
    logStep("Usage updated successfully", { 
      newUsage: updatedUsage.total_usage, 
      limit, 
      remaining: limit - updatedUsage.total_usage 
    });

    return new Response(JSON.stringify({
      success: true,
      usage: updatedUsage,
      limit: limit,
      remaining: limit - updatedUsage.total_usage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in track-usage", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});