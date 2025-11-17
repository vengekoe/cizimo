import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pages, theme } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    console.log(`Generating ${pages.length} images for theme: ${theme}`);

    // Process sequentially with retry to avoid rate limits
    const images: (string | null)[] = [];

    async function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function generateImageWithRetry(prompt: string, attempt = 1): Promise<string | null> {
      const url = "https://api.openai.com/v1/images/generations";
      const body = JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI image gen failed (attempt ${attempt}):`, response.status, errorText);
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("retry-after")) || 8 * attempt;
          await delay(retryAfter * 1000);
          return generateImageWithRetry(prompt, attempt + 1);
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error("OPENAI_API_KEY geçersiz veya yetkisiz");
        }
        return null;
      }

      const data = await response.json();
      const b64 = data?.data?.[0]?.b64_json as string | undefined;
      if (!b64) {
        console.error("OpenAI 'b64_json' döndürmedi");
        return null;
      }
      return `data:image/png;base64,${b64}`;
    }

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      const prompt = `Create a vibrant children's book illustration suitable for ages 3-7. Character: ${page.character} ${page.emoji}. ${page.description}. Theme: ${theme}. Style: colorful, friendly, simple shapes, high-contrast, warm and inviting.`;
      console.log(`Generating image ${index + 1}/${pages.length}: ${prompt.substring(0, 50)}...`);
      const img = await generateImageWithRetry(prompt);
      images.push(img);
      // Small delay between requests to reduce rate limiting
      await delay(500);
    }

    console.log(`Successfully generated ${images.filter((img) => img !== null).length} images`);

    return new Response(JSON.stringify({ images }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Image generation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
