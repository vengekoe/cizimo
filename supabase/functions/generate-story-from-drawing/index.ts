import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate base64 size (8MB limit = ~10.7MB base64)
const requestSchema = z.object({
  imageBase64: z.string()
    .min(1, "Image data cannot be empty")
    .max(10700000, "Image size must be less than 8MB")
    .refine((val) => {
      try {
        return val.startsWith('data:image/');
      } catch {
        return false;
      }
    }, "Invalid image format"),
  language: z.enum(["tr", "en"]).default("tr"),
  pageCount: z.number().min(5).max(20).default(10),
});

const storyPageSchema = z.object({
  character: z.string(),
  emoji: z.string(),
  title: z.string(),
  description: z.string(),
  sound: z.string(),
});

const storySchema = z.object({
  title: z.string(),
  pages: z.array(storyPageSchema).min(5).max(20),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { imageBase64, language, pageCount } = requestSchema.parse(body);
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    console.log("Analyzing child's drawing with Gemini...");

    // Base64 string'den data URL prefix'ini çıkar
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // İlk adım: Resmi analiz et
    const analysisResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Bu çocuk çizimini analiz et ve şunları belirle:
1. Çizimdeki ana renkler (en fazla 3 renk)
2. Çizimdeki karakterler veya nesneler (en fazla 4 karakter)
3. Genel tema ve duygu
4. Hikaye için uygun başlık

JSON formatında dön:
{
  "colors": ["renk1", "renk2", "renk3"],
  "characters": [
    {
      "name": "Karakter adı",
      "emoji": "🎨",
      "description": "Karakter açıklaması"
    }
  ],
  "theme": "Genel tema açıklaması",
  "mood": "Duygu/atmosfer",
  "title": "Hikaye başlığı"
}`
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("Analysis failed:", analysisResponse.status, errorText);
      
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "RATE_LIMIT",
            message: "Çok fazla istek gönderildi. Lütfen birkaç saniye bekleyin."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Failed to analyze drawing: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const analysisRaw = analysisData.candidates?.[0]?.content?.parts?.[0]?.text;
    let analysis: any;
    try {
      analysis = typeof analysisRaw === "string" ? JSON.parse(analysisRaw) : analysisRaw;
    } catch {
      const match = analysisRaw?.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid analysis format");
      analysis = JSON.parse(match[0]);
    }
    console.log("Analysis complete - Title:", analysis.title);

    // İkinci adım: Analiz sonucuna göre hikaye oluştur
    const storyResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Aşağıdaki özelliklere dayanarak ${pageCount} sayfalık BİR BÜTÜN OLARAK TUTARLI bir çocuk hikayesi oluştur.

HİKAYE ÖZELLİKLERİ:
- Renkler: ${analysis.colors.join(", ")}
- Tema: ${analysis.theme}
- Duygu: ${analysis.mood}
- Karakterler: ${analysis.characters.map((c: any) => `${c.name} (${c.description})`).join(", ")}
- Dil: ${language === "tr" ? "TÜRKÇE" : "ENGLISH"}

ÖNEMLİ KURALLAR:
1) ${language === "tr" ? "HİKAYE TAMAMEN TÜRKÇE OLMALIDIR" : "STORY MUST BE ENTIRELY IN ENGLISH"}
2) Önce tek parça bütün bir hikaye (başlangıç-gelişme-sonuç) kurgula
3) Sonra bu hikayeyi ${pageCount} ardışık sahneye böl; her sayfa bir öncekinin devamı olsun
4) Karakterler tutarlı davransın ve her sayfada gelişsinler
5) Son sayfada pozitif, mutlu bir final olsun
6) Her sayfanın açıklaması en az 3 cümle olmalı ve bir önceki sayfanın devamı olmalı
7) Sayfa başlıkları ve açıklamaları yaratıcı ve ilgi çekici olmalı

JSON FORMATINDA DÖNÜŞ YAP (tüm içerik ${language === "tr" ? "Türkçe" : "English"}):
{
  "title": "${analysis.title}",
  "pages": [
    {
      "character": "${language === "tr" ? "Karakter adı (Türkçe)" : "Character name (English)"}",
      "emoji": "🎨",
      "title": "${language === "tr" ? "Sayfa başlığı (Türkçe)" : "Page title (English)"}",
      "description": "${language === "tr" ? "Detaylı açıklama (Türkçe, en az 3 cümle, hikayenin devamı)" : "Detailed description (English, at least 3 sentences, continuation of the story)"}",
      "sound": "${language === "tr" ? "Ses efekti (Türkçe)" : "Sound effect (English)"}"
    }
  ]
}

UNUTMA: Tüm metin içeriği (başlık, karakter adları, açıklamalar, sesler) TAMAMEN ${language === "tr" ? "TÜRKÇE" : "ENGLISH"} olmalıdır!
Toplam ${pageCount} sayfa olmalı ve her sayfa öncekinin devamı olmalı.`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }),
    });

    if (!storyResponse.ok) {
      const errorText = await storyResponse.text();
      console.error("Story generation failed:", storyResponse.status, errorText);
      
      if (storyResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "RATE_LIMIT",
            message: "Çok fazla istek gönderildi. Lütfen birkaç saniye bekleyin."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Failed to generate story: ${storyResponse.status}`);
    }

    const storyData = await storyResponse.json();
    console.log("Gemini response:", JSON.stringify(storyData, null, 2));
    
    const storyRaw = storyData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!storyRaw) {
      console.error("No text in Gemini response");
      console.error("Full response:", JSON.stringify(storyData));
      throw new Error("Gemini'den metin alınamadı. Lütfen tekrar deneyin.");
    }

    console.log("Story text received, length:", storyRaw.length);

    let story: any;
    try {
      story = JSON.parse(storyRaw);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw text:", storyRaw.substring(0, 500));
      
      // Try to extract JSON from text
      const start = storyRaw.indexOf("{");
      const end = storyRaw.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        try {
          story = JSON.parse(storyRaw.slice(start, end + 1));
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
      JSON.stringify({ story: validated, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-story-from-drawing:", error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Invalid request format", details: error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
