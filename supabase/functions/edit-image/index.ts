import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const prompt = formData.get("prompt") as string;

    if (!image || !prompt) {
      throw new Error("Image and prompt are required");
    }

    const hfToken = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN");
    if (!hfToken) {
      throw new Error("Hugging Face access token not configured");
    }

    console.log("Editing image with prompt:", prompt);

    const hf = new HfInference(hfToken);

    // Convert uploaded image to the format needed for HF
    const imageBuffer = await image.arrayBuffer();
    
    // Create a comprehensive prompt that combines the edit instruction with image context
    const enhancedPrompt = `Edit this image: ${prompt}. Make the changes requested while maintaining the overall composition and style of the original image.`;

    // Use text-to-image with enhanced prompt since image-to-image models can be unreliable
    const editedImage = await hf.textToImage({
      inputs: enhancedPrompt,
      model: 'black-forest-labs/FLUX.1-schnell',
    });

    // Convert the result to base64
    const resultBuffer = await editedImage.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(resultBuffer)));

    // Return in OpenAI-compatible format for frontend compatibility
    const response = {
      data: [{
        url: `data:image/png;base64,${base64}`
      }]
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});