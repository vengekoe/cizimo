import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const pageSchema = z.object({
  character: z.string().max(100),
  emoji: z.string().max(10),
  description: z.string().max(500),
});

const requestSchema = z.object({
  pages: z.array(pageSchema).min(1, "At least one page is required").max(20, "Maximum 20 pages allowed"),
  theme: z.string().min(1, "Theme cannot be empty").max(500, "Theme must be less than 500 characters"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request received, parsing...");
    const { pages, theme } = requestSchema.parse(body);
    console.log(`Validated: ${pages.length} pages, theme length: ${theme.length}`);
    
    // Use Lovable AI Gateway for image generation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY yapılandırılmamış");
    }

    console.log(`Generating ${pages.length} high-resolution images using Lovable AI Gateway for theme: ${theme}`);

    const images: (string | null)[] = [];

    async function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function generateImageWithRetry(prompt: string, attempt = 1): Promise<string | null> {
      try {
        console.log(`Calling Lovable AI Gateway (attempt ${attempt})...`);
        
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [{
              role: "user",
              content: prompt
            }],
            modalities: ["image", "text"]
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Image gen failed (attempt ${attempt}):`, response.status, errorText);
          
          if (response.status === 429 && attempt < 3) {
            console.log(`Rate limited, waiting ${15 * attempt} seconds...`);
            await delay(15 * attempt * 1000);
            return generateImageWithRetry(prompt, attempt + 1);
          }
          
          if (response.status === 402) {
            throw new Error("API kredileri yetersiz.");
          }
          
          if (attempt < 3) {
            console.log(`Retrying (attempt ${attempt + 1})...`);
            await delay(5000 * attempt);
            return generateImageWithRetry(prompt, attempt + 1);
          }
          
          console.error(`Failed after ${attempt} attempts, returning null`);
          return null;
        }

        const data = await response.json();
        console.log("Lovable AI response received");
        
        // Extract base64 image from Lovable AI response
        const imageData = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (imageData) {
          console.log("Image generated successfully");
          return imageData;
        }
        
        console.error(`No image data in response (attempt ${attempt})`);
        if (attempt < 3) {
          await delay(3000 * attempt);
          return generateImageWithRetry(prompt, attempt + 1);
        }
        
        return null;
      } catch (error) {
        console.error(`Error generating image (attempt ${attempt}):`, error);
        if (attempt < 3) {
          await delay(5000 * attempt);
          return generateImageWithRetry(prompt, attempt + 1);
        }
        return null;
      }
    }

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      // Limit description to 150 chars for prompt
      const shortDesc = page.description.length > 150 
        ? page.description.substring(0, 150) + "..." 
        : page.description;
      
      const prompt = `Create a vibrant, high-quality children's book illustration suitable for ages 3-7. 
CRITICAL: No text, no letters, no words, no captions anywhere in the image - pure illustration only.
Character: ${page.character} ${page.emoji}
Scene: ${shortDesc}
Theme: ${theme}
Style: Colorful, friendly, simple shapes, high-contrast, warm and inviting, professional children's book quality.
The illustration should be in landscape orientation (16:9 aspect ratio), filling the entire frame edge-to-edge with no borders or margins.
Ultra high resolution.`;
      
      console.log(`Generating image ${index + 1}/${pages.length}: ${page.character}`);
      const img = await generateImageWithRetry(prompt);
      images.push(img);
      
      // Delay between requests to avoid rate limiting
      if (index < pages.length - 1) {
        await delay(2000);
      }
    }

    console.log(`Successfully generated ${images.filter((img) => img !== null).length} images`);

    return new Response(JSON.stringify({ images }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Image generation error:", e);
    const isValidationError = e instanceof z.ZodError;
    return new Response(
      JSON.stringify({ 
        error: isValidationError 
          ? `Validation error: ${e.errors.map(err => err.message).join(', ')}`
          : e instanceof Error ? e.message : "Bilinmeyen hata" 
      }),
      { status: isValidationError ? 400 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
