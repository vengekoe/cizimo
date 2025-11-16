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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "Sen çocuklar için hikaye yazan bir yardımcısın. Her zaman JSON formatında yanıt verirsin."
            },
            {
              role: "user",
              content: `${theme} temalı, 5 sayfalık bir çocuk hikayesi yaz. Her sayfa için:
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
            }
          ],
          response_format: { type: "json_object" }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit aşıldı, lütfen daha sonra tekrar deneyin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Lovable AI kredileriniz tükendi. Settings → Workspace → Usage bölümünden kredi ekleyin." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Lovable AI response data:", JSON.stringify(data).substring(0, 200));
    
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in response:", JSON.stringify(data));
      throw new Error("Lovable AI'dan içerik alınamadı");
    }
    
    console.log("Content from Lovable AI:", content.substring(0, 200));
    
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
