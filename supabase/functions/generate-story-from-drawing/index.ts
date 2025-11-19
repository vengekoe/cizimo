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
  pages: z.array(storyPageSchema).length(10),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { imageBase64 } = requestSchema.parse(body);
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    console.log("Analyzing child's drawing with Gemini...");

    // Base64 string'den data URL prefix'ini çıkar
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // İlk adım: Resmi analiz et
    const analysisResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`, {
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
    const storyResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Aşağıdaki özelliklere dayanarak 10 sayfalık BİR BÜTÜN OLARAK TUTARLI bir çocuk hikayesi oluştur:

Renkler: ${analysis.colors.join(", ")}
Tema: ${analysis.theme}
Duygu: ${analysis.mood}
Karakterler: ${analysis.characters.map((c: any) => `${c.name} (${c.description})`).join(", ")}

KURALLAR:
1) Önce tek parça bütün bir hikaye (başlangıç-gelişme-sonuç) kurgula
2) Sonra bu hikayeyi 10 ardışık sahneye böl; her sayfa bir öncekinin devamı olsun
3) Karakterler tutarlı davransın
4) Son sayfada pozitif final olsun

JSON FORMATINDA DÖNÜŞ YAP:
{
  "title": "${analysis.title}",
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
    const storyRaw = storyData.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("Story generated successfully");

    let story: any;
    try {
      story = typeof storyRaw === "string" ? JSON.parse(storyRaw) : storyRaw;
    } catch {
      console.error("Primary story JSON parse failed, attempting brace-slice");
      const start = storyRaw.indexOf("{");
      const end = storyRaw.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        try {
          story = JSON.parse(storyRaw.slice(start, end + 1));
        } catch (e2) {
          console.error("Brace-slice parse failed:", e2);
        }
      }
    }

    if (!story) {
      console.error("Story parse failed. Debug -> contentLen:", storyRaw?.length ?? 0);
      throw new Error("Invalid story format from AI response");
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
