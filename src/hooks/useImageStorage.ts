import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SaveImageParams {
  imageDataUrl: string;
  prompt: string;
  generationType: 'generate' | 'edit';
  modelUsed?: string;
}

export const useImageStorage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const saveImage = async ({ imageDataUrl, prompt, generationType, modelUsed }: SaveImageParams) => {
    setIsUploading(true);
    try {
      // Get current user - for now, we'll create a guest user ID since auth isn't implemented
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      let userId = user?.id;
      
      // If no authenticated user, create a guest session ID for demo purposes
      if (!userId) {
        userId = 'guest-' + Math.random().toString(36).substr(2, 9);
        console.log('No authenticated user, using guest ID:', userId);
      }

      let blob: Blob;
      
      // Handle both data URLs and regular URLs
      if (imageDataUrl.startsWith('data:')) {
        // Convert base64 data URL to blob
        const base64Data = imageDataUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'image/png' });
      } else {
        // Fetch image from URL and convert to blob
        const response = await fetch(imageDataUrl);
        blob = await response.blob();
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}-${generationType}.png`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-images')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(fileName);

      // Save metadata to database (only if authenticated user)
      if (user?.id) {
        const { error: dbError } = await supabase
          .from('generated_images')
          .insert({
            user_id: user.id,
            prompt,
            image_url: urlData.publicUrl,
            file_path: fileName,
            generation_type: generationType,
            model_used: modelUsed
          });

        if (dbError) {
          console.error('Database error:', dbError);
          // Don't throw for guest users, just log
        }
      } else {
        console.log('Guest user - image saved to storage but not to database');
      }

      toast({
        title: "Image saved successfully",
        description: "Your generated image has been saved to your history.",
      });

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error saving image:', error);
      toast({
        title: "Error saving image",
        description: error instanceof Error ? error.message : "Failed to save image",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { saveImage, isUploading };
};