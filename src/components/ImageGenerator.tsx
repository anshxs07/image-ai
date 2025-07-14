import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, Sparkles, Edit3, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ImageGenerator = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [model, setModel] = useState('dall-e-3');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('standard');
  const { toast } = useToast();

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey.trim());
      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved locally.",
      });
    }
  };

  const generateImage = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your OpenAI API key first.",
        variant: "destructive",
      });
      return;
    }

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
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          n: 1,
          size: size,
          quality: quality,
          response_format: 'url',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImage(data.data[0].url);
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
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your OpenAI API key first.",
        variant: "destructive",
      });
      return;
    }

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
      formData.append('model', 'dall-e-2'); // Only DALL-E 2 supports editing
      formData.append('n', '1');
      formData.append('size', '1024x1024');
      formData.append('response_format', 'url');

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to edit image');
      }

      const data = await response.json();
      setGeneratedImage(data.data[0].url);
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          AI Image Generator
        </h1>
        <p className="text-muted-foreground text-lg">
          Create and edit images using OpenAI's powerful AI models
        </p>
      </div>

      {/* Security Warning */}
      <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <strong>Security Notice:</strong> Your API key will be stored in your browser's local storage. 
          For production applications, consider using a backend service to protect your API keys.
        </AlertDescription>
      </Alert>

      {/* API Key Input */}
      <Card>
        <CardHeader>
          <CardTitle>OpenAI API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <div className="flex space-x-2">
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={saveApiKey} variant="outline">
                Save
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Get your API key from{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

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
                disabled={isGenerating}
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
                disabled={isGenerating}
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
  );
};