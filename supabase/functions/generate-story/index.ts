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
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          {
            role: "system",
            content: `Sen çocuklar için eğlenceli ve öğretici hikayeler yazan bir yazarsın. Her hikaye 10 sayfa olmalı ve her sayfada bir karakter ve onun hikayesi olmalı. Hikayeler ${theme} temalı olmalı. Yanıtını sadece JSON formatında ver, başka açıklama ekleme.`,
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
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "OpenAI rate limit aşıldı, lütfen daha sonra tekrar deneyin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "OpenAI API anahtarı geçersiz." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // JSON'u parse et
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Invalid JSON in response:", content);
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
