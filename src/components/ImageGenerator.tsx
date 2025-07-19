import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, Sparkles, Edit3, History, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useImageStorage } from "@/hooks/useImageStorage";
import { useImageHistory } from "@/hooks/useImageHistory";
import { ImageGallery } from "@/components/ImageGallery";
import { Link } from "react-router-dom";

export const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [model, setModel] = useState('dall-e-3');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('standard');
  const { toast } = useToast();
  const { saveImage, isUploading } = useImageStorage();
  const { refetch: refetchImages } = useImageHistory();

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for image generation.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt,
          model,
          size,
          quality,
          n: 1
        }
      });

      if (error) throw error;

      const imageUrl = data.data[0].url;
      setGeneratedImage(imageUrl);
      
      // Save to storage and database
      try {
        await saveImage({
          imageDataUrl: imageUrl,
          prompt,
          generationType: 'generate',
          modelUsed: model
        });
        // Refresh the gallery after successful save
        await refetchImages();
      } catch (saveError) {
        console.error('Error saving image:', saveError);
        // Still show success for generation even if save fails
      }
      
      toast({
        title: "Success",
        description: "Image generated successfully!",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (4MB limit for DALL-E 2)
      if (file.size > 4 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 4MB for image editing.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const editImage = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select an image to edit.",
        variant: "destructive",
      });
      return;
    }

    if (!editPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for image editing.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('prompt', editPrompt);
      formData.append('model', 'dall-e-2');
      formData.append('size', '1024x1024');
      formData.append('n', '1');

      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: formData
      });

      if (error) throw error;

      const imageUrl = data.data[0].url;
      setGeneratedImage(imageUrl);
      
      // Save to storage and database
      try {
        await saveImage({
          imageDataUrl: imageUrl,
          prompt: editPrompt,
          generationType: 'edit',
          modelUsed: 'dall-e-2'
        });
        // Refresh the gallery after successful save
        await refetchImages();
      } catch (saveError) {
        console.error('Error saving image:', saveError);
        // Still show success for editing even if save fails
      }
      
      toast({
        title: "Success",
        description: "Image edited successfully!",
      });
    } catch (error) {
      console.error('Error editing image:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to edit image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with History Link */}
      <div className="flex items-center justify-between mb-8">
        <div className="text-center flex-1 space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            AI Image Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Create and edit images using OpenAI's powerful AI models
          </p>
        </div>
        <Link to="/history">
          <Button variant="outline" className="gap-2">
            <History className="w-4 h-4" />
            View History
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Generator Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Interface */}
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Image
              </TabsTrigger>
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Edit Image
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Generate New Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Prompt</Label>
                    <Textarea
                      id="prompt"
                      placeholder="A futuristic cityscape with flying cars and neon lights..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
                          <SelectItem value="dall-e-2">DALL-E 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="size">Size</Label>
                      <Select value={size} onValueChange={setSize}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1024x1024">1024x1024 (Square)</SelectItem>
                          <SelectItem value="1792x1024">1792x1024 (Landscape)</SelectItem>
                          <SelectItem value="1024x1792">1024x1792 (Portrait)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quality">Quality</Label>
                      <Select value={quality} onValueChange={setQuality}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="hd">HD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={generateImage} 
                    disabled={isGenerating || isUploading}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate Image'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="edit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Existing Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageFile">Upload Image</Label>
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="imageFile" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (MAX. 4MB)</p>
                        </div>
                        <input
                          id="imageFile"
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editPrompt">Edit Prompt</Label>
                    <Textarea
                      id="editPrompt"
                      placeholder="Add a sunset background..."
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={editImage} 
                    disabled={isGenerating || isUploading}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Edit3 className="mr-2 h-4 w-4" />
                    )}
                    {isGenerating ? 'Editing...' : 'Edit Image'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Generated Image Display */}
          {generatedImage && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <img 
                    src={generatedImage} 
                    alt="Generated" 
                    className="max-w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
                <div className="mt-4 flex justify-center">
                  <Button asChild variant="outline">
                    <a href={generatedImage} download="generated-image.png">
                      Download Image
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Gallery Widget Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Recent Images
              </CardTitle>
              <Link to="/history">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <ImageGallery variant="widget" maxItems={6} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};