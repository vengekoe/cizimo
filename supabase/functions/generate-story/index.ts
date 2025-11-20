import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  theme: z.string().min(1, "Theme cannot be empty").max(200, "Theme must be less than 200 characters"),
  language: z.enum(["tr", "en"]).default("tr"),
  pageCount: z.number().min(5).max(20).default(10),
});

const storySchema = z.object({
  title: z.string().min(1),
  pages: z.array(z.object({
    character: z.string().min(1),
    emoji: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    sound: z.string().min(1),
  })).min(5).max(20),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { theme, language, pageCount } = requestSchema.parse(body);
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    console.log("Generating story with theme:", theme);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `"${theme}" temalı ${pageCount} sayfalık BİR BÜTÜN OLARAK TUTARLI bir çocuk hikayesi oluştur:

KURALLAR:
1) ${language === "tr" ? "HİKAYE TAMAMEN TÜRKÇE OLMALIDIR" : "STORY MUST BE ENTIRELY IN ENGLISH"}
2) Önce tek parça bütün bir hikaye (başlangıç-gelişme-sonuç) kurgula
3) Sonra bu hikayeyi ${pageCount} ardışık sahneye böl; her sayfa bir öncekinin devamı olsun
4) Karakterler tutarlı davransın ve her sayfada gelişsinler
5) Son sayfada pozitif, mutlu bir final olsun
6) Her sayfanın açıklaması en az 3 cümle olmalı ve bir önceki sayfanın devamı olmalı

JSON FORMATINDA DÖNÜŞ YAP (tüm içerik ${language === "tr" ? "Türkçe" : "English"}):
{
  "title": "${language === "tr" ? "Hikaye Başlığı (Türkçe)" : "Story Title (English)"}",
  "pages": [
    {
      "character": "${language === "tr" ? "Karakter adı (Türkçe)" : "Character name (English)"}",
      "emoji": "🎨",
      "title": "${language === "tr" ? "Sayfa başlığı (Türkçe)" : "Page title (English)"}",
      "description": "${language === "tr" ? "Detaylı açıklama (Türkçe, en az 3 cümle, hikayenin devamı)" : "Detailed description (English, at least 3 sentences, continuation of story)"}",
      "sound": "${language === "tr" ? "Ses efekti (Türkçe)" : "Sound effect (English)"}"
    }
  ]
}

Toplam ${pageCount} sayfa olmalı ve her sayfa öncekinin devamı olmalı. Tüm içerik ${language === "tr" ? "TÜRKÇE" : "ENGLISH"} olmalıdır!`
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
    console.log("Gemini response:", JSON.stringify(data, null, 2));
    
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("No content in Gemini response");
      console.error("Full response:", JSON.stringify(data));
      throw new Error("Gemini'den metin alınamadı. Lütfen tekrar deneyin.");
    }

    console.log("Story content received, length:", content.length);

    let story;
    try {
      story = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content:", content.substring(0, 500));
      
      // Try to extract JSON from text
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        try {
          story = JSON.parse(content.slice(start, end + 1));
        } catch (e2) {
          console.error("Brace-slice parse failed:", e2);
          throw new Error("Hikaye formatı geçersiz");
        }
      } else {
        throw new Error("JSON formatı bulunamadı");
      }
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
