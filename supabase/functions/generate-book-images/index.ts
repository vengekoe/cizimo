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
  title: z.string().max(200),
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
    
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY yapılandırılmamış");
    }

    console.log(`Generating ${pages.length} images for theme: ${theme}`);

    const images: (string | null)[] = [];

    async function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function generateImageWithRetry(prompt: string, attempt = 1): Promise<string | null> {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${GOOGLE_AI_API_KEY}`;
      const body = JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ["IMAGE"]
        }
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini image gen failed (attempt ${attempt}):`, response.status, errorText);
        
        if (response.status === 429 && attempt < 3) {
          console.log(`Rate limited, waiting ${8 * attempt} seconds...`);
          await delay(8 * attempt * 1000);
          return generateImageWithRetry(prompt, attempt + 1);
        }
        
        console.error(`Failed after ${attempt} attempts, returning null`);
        return null;
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const inline = parts.find((p: any) => p.inlineData)?.inlineData;
      const base64 = inline?.data as string | undefined;
      const mime = inline?.mimeType as string | undefined;
      
      if (!base64) {
        console.error("Gemini görsel döndürmedi:", JSON.stringify(data).substring(0, 200));
        return null;
      }

      return `data:${mime || "image/png"};base64,${base64}`;
    }

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      // Limit description to 150 chars for prompt
      const shortDesc = page.description.length > 150 
        ? page.description.substring(0, 150) + "..." 
        : page.description;
      const prompt = `Create a vibrant children's book illustration suitable for ages 3-7. Character: ${page.character} ${page.emoji}. ${shortDesc}. Theme: ${theme}. Style: colorful, friendly, simple shapes, high-contrast, warm and inviting. IMPORTANT: Include the text "${page.title}" prominently at the top of the image in large, clear, child-friendly letters. Make sure the text is easy to read and visually appealing.`;
      console.log(`Generating image ${index + 1}/${pages.length}: ${prompt.substring(0, 80)}...`);
      const img = await generateImageWithRetry(prompt);
      images.push(img);
      await delay(500);
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
