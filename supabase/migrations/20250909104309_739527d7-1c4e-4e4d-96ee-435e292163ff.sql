-- Fix RLS policies for subscribers and usage_tracking tables to prevent unauthorized updates

-- Drop existing permissive UPDATE policies
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_usage" ON public.usage_tracking;

-- Create secure UPDATE policy for subscribers table
-- Users can only update their own subscription records
CREATE POLICY "update_own_subscription" ON public.subscribers
  FOR UPDATE 
  USING ((user_id = auth.uid()) OR (email = auth.email()))
  WITH CHECK ((user_id = auth.uid()) OR (email = auth.email()));

-- Create secure UPDATE policy for usage_tracking table  
-- Users can only update their own usage records
CREATE POLICY "update_own_usage_secure" ON public.usage_tracking
  FOR UPDATE 
  USING ((user_id = auth.uid()) OR (email = auth.email()))
  WITH CHECK ((user_id = auth.uid()) OR (email = auth.email()));

-- Note: Service role operations will bypass RLS policies automatically,
-- so Stripe webhooks and system functions will continue to work properly