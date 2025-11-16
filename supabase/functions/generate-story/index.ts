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
    const { theme } = await req.json();
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${theme} temalı, 5 sayfalık bir çocuk hikayesi yaz. Her sayfa için:
- Karakter adı ve emoji
- Kısa bir başlık (maksimum 6 kelime)
- Karakter için kısa bir açıklama (maksimum 12 kelime)
- Karakterin ses efekti (maksimum 3 kelime)

Yanıtını SADECE JSON formatında ver:
{
  "title": "Kitap Başlığı",
  "pages": [
    {
      "character": "Karakter Adı",
      "emoji": "🐻",
      "title": "Sayfa Başlığı",
      "description": "Kısa açıklama",
      "sound": "Ses efekti"
    }
  ]
}`
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 4096,
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Google AI rate limit aşıldı, lütfen daha sonra tekrar deneyin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Google AI API anahtarı geçersiz." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Google AI response data:", JSON.stringify(data).substring(0, 200));
    
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      console.error("No content in response:", JSON.stringify(data));
      throw new Error("Google AI'dan içerik alınamadı");
    }
    
    console.log("Content from OpenAI:", content.substring(0, 200));
    
    // JSON mode kullandığımız için direkt parse edebiliriz
    let story;
    try {
      story = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Content that failed to parse:", content);
      throw new Error("Geçersiz JSON formatı");
    }
    
    // Validate the structure
    if (!story.title || !Array.isArray(story.pages)) {
      console.error("Invalid story structure:", story);
      throw new Error("Hikaye yapısı geçersiz");
    }

    console.log("Successfully generated story:", story.title);
    return new Response(JSON.stringify(story), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Story generation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
