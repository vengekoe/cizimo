import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const pageSchema = z.object({
  character: z.string().max(200),
  emoji: z.string().max(50),
  description: z.string().max(2000),
});

const requestSchema = z.object({
  pages: z.array(pageSchema).min(1, "At least one page is required").max(20, "Maximum 20 pages allowed"),
  theme: z.string().min(1, "Theme cannot be empty").max(500, "Theme must be less than 500 characters"),
  imageModel: z.enum(["dall-e-3", "gpt-image-1"]).optional().default("dall-e-3"),
});

interface PageResult {
  pageIndex: number;
  success: boolean;
  image: string | null;
  attempts: number;
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request received, parsing...");
    const { pages, theme, imageModel } = requestSchema.parse(body);
    console.log(`Validated: ${pages.length} pages, theme length: ${theme.length}, model: ${imageModel}`);
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log(`Generating ${pages.length} images using OpenAI gpt-image-1`);

    const MAX_RETRIES = 3;
    const BASE_DELAY = 2000;
    const MAX_DELAY = 30000;
    
    const results: PageResult[] = [];

    async function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function getBackoffDelay(attempt: number): number {
      const exponentialDelay = BASE_DELAY * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000;
      return Math.min(exponentialDelay + jitter, MAX_DELAY);
    }

    async function generateImageWithRetry(
      prompt: string, 
      pageIndex: number,
      attempt = 1
    ): Promise<PageResult> {
      try {
        const modelToUse = imageModel === "gpt-image-1" ? "gpt-image-1" : "dall-e-3";
        const sizeToUse = modelToUse === "dall-e-3" ? "1792x1024" : "1536x1024";
        
        console.log(`[Page ${pageIndex + 1}] Calling OpenAI ${modelToUse} (attempt ${attempt}/${MAX_RETRIES})...`);
        
        const requestBody: Record<string, unknown> = {
          model: modelToUse,
          prompt: prompt,
          n: 1,
          size: sizeToUse,
        };
        
        if (modelToUse === "dall-e-3") {
          requestBody.quality = "standard";
          requestBody.style = "vivid";
          requestBody.response_format = "b64_json";
        } else {
          requestBody.quality = "medium";
        }
        
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorText = JSON.stringify(errorData);
          console.error(`[Page ${pageIndex + 1}] OpenAI API error (attempt ${attempt}):`, response.status, errorText);
          
          if (response.status === 429) {
            if (attempt < MAX_RETRIES) {
              const backoffDelay = getBackoffDelay(attempt) * 2;
              console.log(`[Page ${pageIndex + 1}] Rate limited, waiting ${Math.round(backoffDelay / 1000)}s...`);
              await delay(backoffDelay);
              return generateImageWithRetry(prompt, pageIndex, attempt + 1);
            }
            return { pageIndex, success: false, image: null, attempts: attempt, error: "Rate limit aşıldı" };
          }
          
          if (attempt < MAX_RETRIES) {
            const backoffDelay = getBackoffDelay(attempt);
            await delay(backoffDelay);
            return generateImageWithRetry(prompt, pageIndex, attempt + 1);
          }
          return { pageIndex, success: false, image: null, attempts: attempt, error: `API hatası: ${response.status}` };
        }

        const data = await response.json();
        
        // OpenAI returns b64_json for gpt-image-1
        const imageData = data.data?.[0];
        
        if (imageData?.b64_json) {
          console.log(`[Page ${pageIndex + 1}] ✓ Image generated successfully (attempt ${attempt})`);
          return {
            pageIndex,
            success: true,
            image: `data:image/png;base64,${imageData.b64_json}`,
            attempts: attempt
          };
        } else if (imageData?.url) {
          // Fallback to URL if available
          console.log(`[Page ${pageIndex + 1}] ✓ Image URL received (attempt ${attempt})`);
          return {
            pageIndex,
            success: true,
            image: imageData.url,
            attempts: attempt
          };
        }
        
        console.error(`[Page ${pageIndex + 1}] No image data in response (attempt ${attempt})`);
        if (attempt < MAX_RETRIES) {
          const backoffDelay = getBackoffDelay(attempt);
          await delay(backoffDelay);
          return generateImageWithRetry(prompt, pageIndex, attempt + 1);
        }
        
        return { pageIndex, success: false, image: null, attempts: attempt, error: "Görsel yanıtta bulunamadı" };
        
      } catch (error) {
        console.error(`[Page ${pageIndex + 1}] Error (attempt ${attempt}):`, error);
        
        if (attempt < MAX_RETRIES) {
          const backoffDelay = getBackoffDelay(attempt);
          await delay(backoffDelay);
          return generateImageWithRetry(prompt, pageIndex, attempt + 1);
        }
        
        return {
          pageIndex,
          success: false,
          image: null,
          attempts: attempt,
          error: error instanceof Error ? error.message : "Bilinmeyen hata"
        };
      }
    }

    // Generate all images sequentially to avoid rate limits
    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      const shortDesc = page.description.length > 200 
        ? page.description.substring(0, 200) + "..." 
        : page.description;
      
      const prompt = `Create a vibrant, high-quality children's book illustration suitable for ages 3-7. 
CRITICAL: No text, no letters, no words, no captions anywhere in the image - pure illustration only.
Character: ${page.character} ${page.emoji}
Scene: ${shortDesc}
Theme: ${theme}
Style: Colorful, friendly, simple shapes, high-contrast, warm and inviting, professional children's book quality, whimsical and magical atmosphere.
The illustration should be in landscape orientation filling the entire frame edge-to-edge with no borders.`;
      
      console.log(`\n=== Generating image ${index + 1}/${pages.length}: ${page.character} ===`);
      const result = await generateImageWithRetry(prompt, index);
      results.push(result);
      
      // Delay between requests to avoid rate limiting
      if (index < pages.length - 1) {
        await delay(2000);
      }
    }

    // Build summary
    const successCount = results.filter(r => r.success).length;
    const failedPages = results.filter(r => !r.success);
    
    console.log(`\n=== Generation Summary ===`);
    console.log(`Total: ${pages.length}, Success: ${successCount}, Failed: ${failedPages.length}`);
    
    if (failedPages.length > 0) {
      console.log(`Failed pages:`);
      failedPages.forEach(f => {
        console.log(`  - Page ${f.pageIndex + 1}: ${f.error} (${f.attempts} attempts)`);
      });
    }

    return new Response(JSON.stringify({ 
      images: results.map(r => r.image),
      summary: {
        total: pages.length,
        success: successCount,
        failed: failedPages.length,
        failedPages: failedPages.map(f => ({
          pageIndex: f.pageIndex,
          pageNumber: f.pageIndex + 1,
          error: f.error,
          attempts: f.attempts
        }))
      }
    }), {
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
