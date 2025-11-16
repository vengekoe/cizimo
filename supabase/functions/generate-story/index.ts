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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Sen çocuklar için eğlenceli ve öğretici hikayeler yazan bir yazarsın. Her hikaye 10 sayfa olmalı ve her sayfada bir karakter ve onun hikayesi olmalı. Hikayeler ${theme} temalı olmalı.`,
          },
          {
            role: "user",
            content: `${theme} temalı, 10 sayfalık bir çocuk hikayesi yaz. Her sayfa için:
            - Karakter adı ve emoji
            - Kısa bir başlık (maksimum 8 kelime)
            - Karakter için kısa bir açıklama (maksimum 15 kelime)
            - Karakterin ses efekti
            
            JSON formatında dön:
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
            }`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit aşıldı, lütfen daha sonra tekrar deneyin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Ödeme gerekli, lütfen hesabınıza kredi ekleyin." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // JSON'u parse et
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Geçersiz JSON formatı");
    }
    
    const story = JSON.parse(jsonMatch[0]);

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
