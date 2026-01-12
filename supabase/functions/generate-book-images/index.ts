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

// Result type for each page generation
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
    const { pages, theme } = requestSchema.parse(body);
    console.log(`Validated: ${pages.length} pages, theme length: ${theme.length}`);
    
    // Check for service account first, then API key
    const accessToken = await getAccessToken();
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    
    if (!accessToken && !GOOGLE_AI_API_KEY) {
      throw new Error("No Gemini authentication available (neither service account nor API key)");
    }

    console.log(`Generating ${pages.length} images using Google Gemini API ${accessToken ? '(service account)' : '(API key)'} for theme: ${theme}`);

    const MAX_RETRIES = 5;
    const BASE_DELAY = 2000; // 2 seconds base delay
    const MAX_DELAY = 60000; // Maximum 60 seconds delay
    
    const results: PageResult[] = [];

    async function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Exponential backoff with jitter
    function getBackoffDelay(attempt: number): number {
      const exponentialDelay = BASE_DELAY * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000; // 0-1 second jitter
      return Math.min(exponentialDelay + jitter, MAX_DELAY);
    }

    async function generateImageWithRetry(
      prompt: string, 
      pageIndex: number,
      attempt = 1
    ): Promise<PageResult> {
      try {
        console.log(`[Page ${pageIndex + 1}] Calling Gemini API (attempt ${attempt}/${MAX_RETRIES})...`);
        
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
          console.error(`[Page ${pageIndex + 1}] Gemini API error (attempt ${attempt}):`, response.status, errorText);
          
          // Rate limit - use longer backoff
          if (response.status === 429) {
            if (attempt < MAX_RETRIES) {
              const backoffDelay = getBackoffDelay(attempt) * 2; // Double delay for rate limits
              console.log(`[Page ${pageIndex + 1}] Rate limited, waiting ${Math.round(backoffDelay / 1000)}s...`);
              await delay(backoffDelay);
              return generateImageWithRetry(prompt, pageIndex, attempt + 1);
            }
            return {
              pageIndex,
              success: false,
              image: null,
              attempts: attempt,
              error: "Rate limit aşıldı, maksimum deneme sayısına ulaşıldı"
            };
          }
          
          // Auth error - don't retry
          if (response.status === 403) {
            return {
              pageIndex,
              success: false,
              image: null,
              attempts: attempt,
              error: "API erişim izni yok"
            };
          }
          
          // Other errors - retry with backoff
          if (attempt < MAX_RETRIES) {
            const backoffDelay = getBackoffDelay(attempt);
            console.log(`[Page ${pageIndex + 1}] Retrying in ${Math.round(backoffDelay / 1000)}s...`);
            await delay(backoffDelay);
            return generateImageWithRetry(prompt, pageIndex, attempt + 1);
          }
          
          return {
            pageIndex,
            success: false,
            image: null,
            attempts: attempt,
            error: `API hatası: ${response.status}`
          };
        }

        const data = await response.json();
        
        // Extract base64 image from Gemini response
        const parts = data?.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
              console.log(`[Page ${pageIndex + 1}] ✓ Image generated successfully (attempt ${attempt})`);
              return {
                pageIndex,
                success: true,
                image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                attempts: attempt
              };
            }
          }
        }
        
        // No image in response - retry
        console.error(`[Page ${pageIndex + 1}] No image data in response (attempt ${attempt})`);
        if (attempt < MAX_RETRIES) {
          const backoffDelay = getBackoffDelay(attempt);
          console.log(`[Page ${pageIndex + 1}] Retrying in ${Math.round(backoffDelay / 1000)}s...`);
          await delay(backoffDelay);
          return generateImageWithRetry(prompt, pageIndex, attempt + 1);
        }
        
        return {
          pageIndex,
          success: false,
          image: null,
          attempts: attempt,
          error: "Görsel yanıtta bulunamadı"
        };
      } catch (error) {
        console.error(`[Page ${pageIndex + 1}] Error (attempt ${attempt}):`, error);
        
        if (attempt < MAX_RETRIES) {
          const backoffDelay = getBackoffDelay(attempt);
          console.log(`[Page ${pageIndex + 1}] Retrying in ${Math.round(backoffDelay / 1000)}s...`);
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

    // Generate all images
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
      
      console.log(`\n=== Generating image ${index + 1}/${pages.length}: ${page.character} ===`);
      const result = await generateImageWithRetry(prompt, index);
      results.push(result);
      
      // Delay between requests to avoid rate limiting
      if (index < pages.length - 1) {
        await delay(1500);
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

    // Return detailed response
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
