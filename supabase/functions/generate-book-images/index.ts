import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getAccessToken } from "../_shared/google-auth.ts";

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
    
    // Check for service account first, then API key
    const accessToken = await getAccessToken();
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    
    if (!accessToken && !GOOGLE_AI_API_KEY) {
      throw new Error("No Gemini authentication available (neither service account nor API key)");
    }

    console.log(`Generating ${pages.length} images using Google Gemini API ${accessToken ? '(service account)' : '(API key)'} for theme: ${theme}`);

    const images: (string | null)[] = [];

    async function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function generateImageWithRetry(prompt: string, attempt = 1): Promise<string | null> {
      try {
        console.log(`Calling Google Gemini API (attempt ${attempt})...`);
        
        // Use Gemini 3 Pro Image model with service account authentication
        const model = "gemini-2.0-flash-preview-image-generation";
        let url: string;
        let headers: Record<string, string>;
        
        if (accessToken) {
          url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
          headers = {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          };
        } else {
          url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_AI_API_KEY}`;
          headers = {
            "Content-Type": "application/json",
          };
        }
        
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"]
            }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini API error (attempt ${attempt}):`, response.status, errorText);
          
          if (response.status === 429 && attempt < 3) {
            console.log(`Rate limited, waiting ${15 * attempt} seconds...`);
            await delay(15 * attempt * 1000);
            return generateImageWithRetry(prompt, attempt + 1);
          }
          
          if (response.status === 403) {
            throw new Error("API erişim izni yok. API anahtarını kontrol edin.");
          }
          
          if (attempt < 3) {
            console.log(`Retrying (attempt ${attempt + 1})...`);
            await delay(3000 * attempt);
            return generateImageWithRetry(prompt, attempt + 1);
          }
          
          console.error(`Failed after ${attempt} attempts, returning null`);
          return null;
        }

        const data = await response.json();
        console.log("Gemini API response received");
        
        // Extract base64 image from Gemini response
        const parts = data?.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
              console.log("Image generated successfully");
              return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
          }
        }
        
        console.error(`No image data in response (attempt ${attempt})`);
        if (attempt < 3) {
          await delay(2000 * attempt);
          return generateImageWithRetry(prompt, attempt + 1);
        }
        
        return null;
      } catch (error) {
        console.error(`Error generating image (attempt ${attempt}):`, error);
        if (attempt < 3) {
          await delay(3000 * attempt);
          return generateImageWithRetry(prompt, attempt + 1);
        }
        return null;
      }
    }

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      const shortDesc = page.description.length > 150 
        ? page.description.substring(0, 150) + "..." 
        : page.description;
      
      const prompt = `Create a vibrant, high-quality children's book illustration suitable for ages 3-7. 
CRITICAL: No text, no letters, no words, no captions anywhere in the image - pure illustration only.
Character: ${page.character} ${page.emoji}
Scene: ${shortDesc}
Theme: ${theme}
Style: Colorful, friendly, simple shapes, high-contrast, warm and inviting, professional children's book quality.
The illustration should be in landscape orientation (16:9 aspect ratio), filling the entire frame edge-to-edge with no borders or margins.`;
      
      console.log(`Generating image ${index + 1}/${pages.length}: ${page.character}`);
      const img = await generateImageWithRetry(prompt);
      images.push(img);
      
      // Small delay between requests
      if (index < pages.length - 1) {
        await delay(1000);
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
