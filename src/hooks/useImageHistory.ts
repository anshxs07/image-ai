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
        // For guest users, fetch recent images from storage
        try {
          const { data: storageData, error: storageError } = await supabase.storage
            .from('generated-images')
            .list('', {
              limit: 50,
              sortBy: { column: 'created_at', order: 'desc' }
            });

          if (storageError) throw storageError;

          // Convert storage files to image format
          const guestImages: GeneratedImage[] = (storageData || []).map((file) => {
            const { data: urlData } = supabase.storage
              .from('generated-images')
              .getPublicUrl(file.name);
            
            return {
              id: file.id || file.name,
              prompt: 'Generated image', // Default since we can't get prompt from storage
              image_url: urlData.publicUrl,
              file_path: file.name,
              generation_type: file.name.includes('-edit') ? 'edit' : 'generate' as 'generate' | 'edit',
              model_used: undefined,
              created_at: file.created_at || new Date().toISOString(),
            };
          });

          setImages(guestImages);
        } catch (storageError) {
          console.error('Error fetching storage images:', storageError);
          setImages([]);
        }
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