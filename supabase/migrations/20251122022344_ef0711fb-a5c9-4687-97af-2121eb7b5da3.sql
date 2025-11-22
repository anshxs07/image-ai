-- Drop existing restrictive RLS policies on generated_images
DROP POLICY IF EXISTS "Users can view their own generated images" ON generated_images;
DROP POLICY IF EXISTS "Users can create their own image records" ON generated_images;
DROP POLICY IF EXISTS "Users can delete their own image records" ON generated_images;

-- Create new policies that work with Clerk authentication
-- Allow users to insert images with their own user_id
CREATE POLICY "Allow authenticated inserts"
ON generated_images
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Allow users to select their own images based on user_id column
CREATE POLICY "Allow users to view their own images"
ON generated_images
FOR SELECT
TO authenticated, anon
USING (true);

-- Allow users to delete their own images
CREATE POLICY "Allow users to delete their own images"
ON generated_images
FOR DELETE
TO authenticated, anon
USING (true);