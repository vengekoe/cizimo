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
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log(`Generating ${pages.length} images for theme: ${theme}`);

    const imagePromises = pages.map(async (page: any, index: number) => {
      const prompt = `Children's book illustration: ${page.character} ${page.emoji}. ${page.description}. Theme: ${theme}. Colorful, friendly, safe for children, high quality digital art, vibrant colors.`;
      
      console.log(`Generating image ${index + 1}/${pages.length}: ${prompt.substring(0, 50)}...`);

      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            modalities: ["image", "text"]
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Image ${index + 1} generation failed:`, response.status, errorText);
        
        if (response.status === 429) {
          throw new Error("Rate limit aşıldı");
        }
        if (response.status === 402) {
          throw new Error("Lovable AI kredisi yetersiz");
        }
        return null;
      }

      const data = await response.json();
      const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!imageBase64) {
        console.error(`No image data for index ${index}`);
        return null;
      }

      console.log(`Image ${index + 1} generated successfully`);
      return imageBase64;
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
