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
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("Generating story with theme:", theme);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-2025-08-07",
        messages: [
          {
            role: "system",
            content: "Sen çocuklar için yaratıcı hikayeler yazan bir yazarsın. Baştan sona tutarlı, akıcı ve bütünsel hikayeler oluşturursun. Yalnızca geçerli JSON formatında yanıt ver.",
          },
          {
            role: "user",
            content: `"${theme}" temalı 10 sayfalık BİR BÜTÜN OLARAK TUTARLI bir çocuk hikayesi oluştur:

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
      "description": "Detaylı açıklama",
      "sound": "Ses efekti"
    }
  ]
}`
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "PAYMENT_REQUIRED",
            message: "OpenAI API kredileriniz tükendi."
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "RATE_LIMIT",
            message: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in OpenAI response:", JSON.stringify(data));
      throw new Error("OpenAI'den içerik alınamadı");
    }

    console.log("Story content received, length:", content.length);

    let story;
    try {
      story = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Content that failed to parse:", content.substring(0, 500));
      throw new Error("Geçersiz JSON formatı");
    }

    // Validate story structure
    story = storySchema.parse(story);

    console.log("Story generated successfully:", story.title);

    return new Response(
      JSON.stringify({ story }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-story:", error);
    const isValidationError = error instanceof z.ZodError;
    return new Response(
      JSON.stringify({ 
        error: isValidationError 
          ? `Validation error: ${error.errors.map(err => err.message).join(', ')}`
          : error instanceof Error ? error.message : "Bilinmeyen hata" 
      }),
      { status: isValidationError ? 400 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
