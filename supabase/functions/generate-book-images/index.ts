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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating ${pages.length} images for theme: ${theme}`);

    const images: (string | null)[] = [];

    async function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function generateImageWithRetry(prompt: string, attempt = 1): Promise<string | null> {
      const url = "https://ai.gateway.lovable.dev/v1/chat/completions";
      const body = JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Lovable AI image gen failed (attempt ${attempt}):`, response.status, errorText);
        
        if (response.status === 429 && attempt < 3) {
          await delay(8 * attempt * 1000);
          return generateImageWithRetry(prompt, attempt + 1);
        }
        if (response.status === 402) {
          throw new Error("Lovable AI kredileriniz tükendi");
        }
        return null;
      }

      const data = await response.json();
      const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url as string | undefined;
      
      if (!imageUrl) {
        console.error("Lovable AI görsel döndürmedi:", JSON.stringify(data).substring(0, 200));
        return null;
      }

      return imageUrl;
    }

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      const prompt = `Create a vibrant children's book illustration suitable for ages 3-7. Character: ${page.character} ${page.emoji}. ${page.description}. Theme: ${theme}. Style: colorful, friendly, simple shapes, high-contrast, warm and inviting.`;
      console.log(`Generating image ${index + 1}/${pages.length}: ${prompt.substring(0, 50)}...`);
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
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
