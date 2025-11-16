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

    const imagePromises = pages.map(async (page: any, index: number) => {
      const prompt = `Children's book illustration for: ${page.character} ${page.emoji}. ${page.description}. Theme: ${theme}. Colorful, friendly, safe for children, high quality digital art, vibrant colors, 16:9 aspect ratio`;
      
      console.log(`Generating image ${index + 1}/${pages.length}: ${prompt.substring(0, 50)}...`);

      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1792x1024",
            quality: "hd",
            style: "vivid"
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Image ${index + 1} generation failed:`, response.status, errorText);
        
        if (response.status === 429) {
          throw new Error("OpenAI rate limit aşıldı");
        }
        if (response.status === 402) {
          throw new Error("OpenAI kredisi yetersiz");
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error("API anahtarı geçersiz");
        }
        return null;
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
      
      if (!imageUrl) {
        console.error(`No image data for index ${index}`);
        return null;
      }

      console.log(`Image ${index + 1} generated successfully`);
      return imageUrl;
    });

    const images = await Promise.all(imagePromises);
    console.log(`Successfully generated ${images.filter(img => img !== null).length} images`);

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
