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
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    console.log(`Generating ${pages.length} images for theme: ${theme}`);

    const imagePromises = pages.map(async (page: any, index: number) => {
      const prompt = `Create a vibrant children's book illustration: ${page.character} ${page.emoji}. ${page.description}. Theme: ${theme}. Style: Colorful, friendly, safe for children, high quality digital art, warm and inviting.`;
      
      console.log(`Generating image ${index + 1}/${pages.length}: ${prompt.substring(0, 50)}...`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instances: [{
              prompt: prompt
            }],
            parameters: {
              sampleCount: 1,
              aspectRatio: "16:9",
              safetyFilterLevel: "block_most",
              personGeneration: "allow_adult"
            }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Image ${index + 1} generation failed:`, response.status, errorText);
        
        if (response.status === 429) {
          throw new Error("Rate limit aşıldı");
        }
        if (response.status === 403) {
          throw new Error("Gemini API anahtarı geçersiz");
        }
        return null;
      }

      const data = await response.json();
      const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;
      
      if (!imageBase64) {
        console.error(`No image data for index ${index}`);
        return null;
      }

      // Gemini base64'ü data URL formatına çevir
      const dataUrl = `data:image/png;base64,${imageBase64}`;
      console.log(`Image ${index + 1} generated successfully`);
      return dataUrl;
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
