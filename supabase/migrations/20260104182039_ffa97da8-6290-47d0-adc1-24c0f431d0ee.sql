-- 1) Drop RLS policies that depend on user_id columns
DROP POLICY IF EXISTS "select_own_usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "update_own_usage_secure" ON public.usage_tracking;
DROP POLICY IF EXISTS "insert_usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- 2) Drop foreign key constraints that reference auth.users
ALTER TABLE public.usage_tracking DROP CONSTRAINT IF EXISTS usage_tracking_user_id_fkey;
ALTER TABLE public.subscribers DROP CONSTRAINT IF EXISTS subscribers_user_id_fkey;
ALTER TABLE public.generated_images DROP CONSTRAINT IF EXISTS generated_images_user_id_fkey;

-- 3) Convert user_id columns to text to support Clerk user IDs
ALTER TABLE public.generated_images ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.usage_tracking ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.subscribers ALTER COLUMN user_id TYPE text USING user_id::text;

-- 4) Recreate RLS policies for usage_tracking
CREATE POLICY "insert_usage" ON public.usage_tracking
FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "select_own_usage" ON public.usage_tracking
FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "update_own_usage_secure" ON public.usage_tracking
FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

-- 5) Recreate RLS policies for subscribers
CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE TO authenticated, anon USING (true) WITH CHECK (true);

-- 6) Add indexes for lookups
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON public.generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_email_period ON public.usage_tracking(email, current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);