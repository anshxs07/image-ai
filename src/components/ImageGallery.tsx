import { useState } from 'react';
import { Download, Trash2, Eye, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useImageHistory } from '@/hooks/useImageHistory';

interface ImageGalleryProps {
  variant?: 'full' | 'widget';
  maxItems?: number;
}

export const ImageGallery = ({ variant = 'full', maxItems }: ImageGalleryProps) => {
  const { images, isLoading, deleteImage } = useImageHistory();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const displayImages = maxItems ? images.slice(0, maxItems) : images;

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className={`grid gap-4 ${variant === 'widget' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {Array.from({ length: variant === 'widget' ? 3 : 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Tag className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No images yet</h3>
        <p className="text-muted-foreground">
          Generate your first AI image to see it here
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${variant === 'widget' ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
      {displayImages.map((image) => (
        <Card key={image.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <div className="relative aspect-square overflow-hidden">
              <img 
                src={image.image_url} 
                alt={image.prompt}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => setSelectedImage(image.image_url)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Generated Image</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <img 
                          src={image.image_url} 
                          alt={image.prompt}
                          className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                        />
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Prompt:</p>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            {image.prompt}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">
                              {image.generation_type}
                            </Badge>
                            {image.model_used && (
                              <Badge variant="secondary">
                                {image.model_used}
                              </Badge>
                            )}
                            <Badge variant="outline">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(image.created_at)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleDownload(image.image_url, image.prompt)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Image</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this image? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteImage(image.id, image.file_path)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
            
            <div className="p-3 space-y-2">
              <p className="text-sm font-medium line-clamp-2 leading-relaxed">
                {image.prompt}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(image.created_at)}
                </span>
                <Badge variant="outline" className="text-xs">
                  {image.generation_type}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};