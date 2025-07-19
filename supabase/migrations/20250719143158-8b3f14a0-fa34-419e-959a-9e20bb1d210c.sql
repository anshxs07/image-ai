-- Update storage policies to allow guest uploads for demo purposes
-- First, check if policies exist and drop them if they do
DROP POLICY IF EXISTS "Users can upload their own generated images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view uploaded images" ON storage.objects;

-- Create new policies for the generated-images bucket
CREATE POLICY "Anyone can upload to generated-images bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'generated-images');

CREATE POLICY "Anyone can view generated-images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-images');

CREATE POLICY "Users can delete their own generated images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);