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
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Convert base64 to blob
      const base64Data = imageDataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}-${generationType}.png`;

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

      // Save metadata to database
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

      if (dbError) throw dbError;

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