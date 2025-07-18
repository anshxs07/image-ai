import { ArrowLeft, Image as ImageIcon, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageGallery } from '@/components/ImageGallery';
import { useImageHistory } from '@/hooks/useImageHistory';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function History() {
  const { images, isLoading } = useImageHistory();
  const [filter, setFilter] = useState<'all' | 'generate' | 'edit'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const filteredImages = images
    .filter(image => filter === 'all' || image.generation_type === filter)
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const stats = {
    total: images.length,
    generated: images.filter(img => img.generation_type === 'generate').length,
    edited: images.filter(img => img.generation_type === 'edit').length
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Editor
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-primary" />
              Image History
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your AI-generated images
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Images</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <CardDescription>All generated images</CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Generated</CardTitle>
              <div className="w-4 h-4 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.generated}</div>
              <CardDescription>Created from text prompts</CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Edited</CardTitle>
              <div className="w-4 h-4 bg-blue-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.edited}</div>
              <CardDescription>Modified existing images</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filter} onValueChange={(value: 'all' | 'generate' | 'edit') => setFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Images</SelectItem>
                <SelectItem value="generate">Generated Only</SelectItem>
                <SelectItem value="edit">Edited Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest') => setSortBy(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="ml-auto text-sm text-muted-foreground flex items-center">
            Showing {filteredImages.length} of {stats.total} images
          </div>
        </div>

        {/* Gallery */}
        <div className="space-y-6">
          {filteredImages.length > 0 ? (
            <ImageGallery variant="full" />
          ) : !isLoading ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {filter === 'all' ? 'No images yet' : `No ${filter}ed images`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'all' 
                  ? 'Generate your first AI image to see it here'
                  : `Try adjusting your filter to see more images`
                }
              </p>
              <Link to="/">
                <Button>Start Creating</Button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}