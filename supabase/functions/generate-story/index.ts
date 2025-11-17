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

    // Retry on rate limit to improve success rate
    async function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

    let response: Response | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Sen çocuklar için hikaye yazan bir yardımcısın. ${theme} temalı, 5 sayfalık bir çocuk hikayesi yaz. Her sayfa için:\n- Karakter adı ve emoji\n- Kısa bir başlık (maksimum 6 kelime)\n- Karakter için kısa bir açıklama (maksimum 12 kelime)\n- Karakterin ses efekti (maksimum 3 kelime)\n\nYanıtını SADECE JSON formatında ver, başka hiçbir şey yazma:\n{\n  "title": "Kitap Başlığı",\n  "pages": [\n    {\n      "character": "Karakter Adı",\n      "emoji": "🐻",\n      "title": "Sayfa Başlığı",\n      "description": "Kısa açıklama",\n      "sound": "Ses efekti"\n    }\n  ]\n}`
              }]
            }],
            generationConfig: {
              temperature: 0.9,
              topK: 40,
              topP: 0.9,
              maxOutputTokens: 4096,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (response.ok) break;

      const errTxt = await response.text();
      console.error(`Gemini API error (attempt ${attempt}):`, response.status, errTxt);

      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after")) || 6 * attempt;
        await delay(retryAfter * 1000);
        continue;
      }

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit aşıldı, lütfen daha sonra tekrar deneyin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Gemini API anahtarı geçersiz veya eksik." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }


    if (!response) {
      throw new Error("Gemini yanıt vermedi");
    }

    const data = await response.json();
    
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      console.error("No content in response:", JSON.stringify(data));
      throw new Error("Gemini'den içerik alınamadı");
    }
    
    console.log("Content from Gemini:", content.substring(0, 200));
    
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
