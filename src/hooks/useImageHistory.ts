import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeneratedImage {
  id: string;
  prompt: string;
  image_url: string;
  file_path: string;
  generation_type: 'generate' | 'edit';
  model_used?: string;
  created_at: string;
}

export const useImageHistory = () => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchImages = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        // For guest users, show empty state
        setImages([]);
        setIsLoading(false);
        return;
      }

      // For authenticated users, fetch from database
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setImages((data || []) as GeneratedImage[]);
    } catch (error) {
      console.error('Error fetching image history:', error);
      toast({
        title: "Error loading images",
        description: "Failed to load your image history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (imageId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('generated-images')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      // Update local state
      setImages(prev => prev.filter(img => img.id !== imageId));

      toast({
        title: "Image deleted",
        description: "Image removed from your history",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error deleting image",
        description: error instanceof Error ? error.message : "Failed to delete image",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return {
    images,
    isLoading,
    refetch: fetchImages,
    deleteImage
  };
};