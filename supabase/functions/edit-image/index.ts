import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const mimeType = image.type;

    // Use GPT-4 Vision to analyze and generate new image based on prompt
    const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and create a detailed prompt that incorporates the following edit request: "${prompt}". Create a comprehensive description that maintains the original image's key elements while applying the requested changes.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      }),
    });

    if (!visionResponse.ok) {
      const error = await visionResponse.json();
      throw new Error(error.error?.message || "Failed to analyze image");
    }

    const visionData = await visionResponse.json();
    const enhancedPrompt = visionData.choices[0].message.content;

    // Generate new image using the enhanced prompt
    const generateResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard"
      }),
    });

    if (!generateResponse.ok) {
      const error = await generateResponse.json();
      throw new Error(error.error?.message || "Failed to generate image");
    }

    const data = await generateResponse.json();

    return new Response(JSON.stringify(data), {
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