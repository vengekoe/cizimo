import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  theme: z.string().min(1, "Theme cannot be empty").max(200, "Theme must be less than 200 characters"),
});

const storySchema = z.object({
  title: z.string().min(1),
  pages: z.array(z.object({
    character: z.string().min(1),
    emoji: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    sound: z.string().min(1),
  })).length(10),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { theme } = requestSchema.parse(body);
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    console.log("Generating story with theme:", theme);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `"${theme}" temalı 10 sayfalık BİR BÜTÜN OLARAK TUTARLI bir çocuk hikayesi oluştur:

KURALLAR:
1) Önce tek parça bütün bir hikaye (başlangıç-gelişme-sonuç) kurgula
2) Sonra bu hikayeyi 10 ardışık sahneye böl; her sayfa bir öncekinin devamı olsun
3) Karakterler tutarlı davransın
4) Son sayfada pozitif final olsun

JSON FORMATINDA DÖNÜŞ YAP:
{
  "title": "Hikaye Başlığı",
  "pages": [
    {
      "character": "Karakter adı",
      "emoji": "🎨",
      "title": "Sayfa başlığı",
      "description": "Detaylı açıklama (en az 3 cümle, hikayenin devamı)",
      "sound": "Ses efekti"
    }
  ]
}

Toplam 10 sayfa olmalı ve her sayfa öncekinin devamı olmalı.`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "RATE_LIMIT",
            message: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("No content in Gemini response:", JSON.stringify(data));
      throw new Error("Gemini'den içerik alınamadı");
    }

    console.log("Story content received, length:", content.length);

    let story;
    try {
      story = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse story JSON:", parseError);
      console.error("Content:", content);
      throw new Error("Hikaye formatı geçersiz");
    }

    // Validate story structure
    const validated = storySchema.parse(story);
    console.log("Story validated successfully");

    return new Response(
      JSON.stringify({ story: validated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-story function:", error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: "Validation error",
          details: error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
