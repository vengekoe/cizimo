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
  model: z.enum(["gemini-3-pro-preview", "gpt-5-mini", "gpt-5.1-mini-preview"]).optional().default("gemini-3-pro-preview"),
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
    const { imageBase64, language, pageCount, model } = requestSchema.parse(body);
    
    console.log(`Analyzing drawing with ${model}: lang=${language}, pages=${pageCount}`);

    // Base64 string'den data URL prefix'ini çıkar
    const base64Parts = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Parts) {
      throw new Error("Invalid image format");
    }
    const mimeType = `image/${base64Parts[1]}`;
    const base64Data = base64Parts[2];

    // Step 1: Analyze the drawing
    const analysisPrompt = `Bu çocuk çizimini analiz et ve şunları belirle:
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
}`;

    let analysisResponse: Response;

    if (model === "gpt-5-mini" || model === "gpt-5.1-mini-preview") {
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

      const openaiModel = model === "gpt-5.1-mini-preview" ? "gpt-5.1-mini-preview-2025-12-17" : "gpt-5-mini-2025-08-07";

      analysisResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: openaiModel,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: analysisPrompt },
                {
                  type: "image_url",
                  image_url: { url: imageBase64 }
                }
              ]
            }
          ],
          max_completion_tokens: 2048,
        })
      });
    } else {
      const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
      if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

      analysisResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GOOGLE_AI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: analysisPrompt },
              { inlineData: { mimeType, data: base64Data } }
            ]
          }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });
    }

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error(`${model} analysis error:`, analysisResponse.status, errorText);
      
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "RATE_LIMIT" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (analysisResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "PAYMENT_REQUIRED" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Analysis failed: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    let analysisText: string;

    if (model === "gpt-5-mini") {
      analysisText = analysisData?.choices?.[0]?.message?.content;
    } else {
      analysisText = analysisData.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    if (!analysisText) {
      throw new Error("Failed to analyze drawing");
    }

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      const start = analysisText.indexOf("{");
      const end = analysisText.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        analysis = JSON.parse(analysisText.slice(start, end + 1));
      } else {
        throw new Error("Invalid analysis format");
      }
    }

    console.log("Drawing analyzed successfully");

    // Step 2: Generate story based on analysis
    const storyPrompt = `Bu çizim analizine dayanarak ${pageCount} sayfalık tutarlı bir çocuk hikayesi oluştur (${language === "tr" ? "TÜRKÇE" : "ENGLISH"}):

Çizim Analizi:
- Renkler: ${analysis.colors.join(', ')}
- Karakterler: ${analysis.characters.map((c: any) => c.name).join(', ')}
- Tema: ${analysis.theme}
- Duygu: ${analysis.mood}
- Başlık: ${analysis.title}

KURALLAR:
1) Hikaye ${pageCount} sayfadan oluşmalı
2) Her sayfa bir öncekinin doğal devamı olmalı (bağımsız cümleler değil)
3) Başlangıç-gelişme-sonuç yapısı olmalı
4) Pozitif, mutlu bir final olmalı
5) Tüm içerik ${language === "tr" ? "TÜRKÇE" : "ENGLISH"} olmalı

JSON FORMATINDA:
{
  "title": "${analysis.title}",
  "pages": [
    {
      "character": "Karakter",
      "emoji": "🎨",
      "title": "Sayfa başlığı",
      "description": "En az 3 cümle, hikayenin devamı",
      "sound": "bee/bird/cricket/frog"
    }
  ]
}`;

    let storyResponse: Response;

    if (model === "gpt-5-mini" || model === "gpt-5.1-mini-preview") {
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

      const openaiModel = model === "gpt-5.1-mini-preview" ? "gpt-5.1-mini-preview-2025-12-17" : "gpt-5-mini-2025-08-07";
      
      storyResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: openaiModel,
          messages: [
            {
              role: "system",
              content: "You are a creative children's story writer. Generate stories in valid JSON format only."
            },
            {
              role: "user",
              content: storyPrompt
            }
          ],
          max_completion_tokens: 8192,
        })
      });
    } else {
      const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

      storyResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GOOGLE_AI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: storyPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });
    }

    if (!storyResponse.ok) {
      const errorText = await storyResponse.text();
      console.error(`${model} story error:`, storyResponse.status, errorText);
      
      if (storyResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "RATE_LIMIT" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (storyResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "PAYMENT_REQUIRED" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Story generation failed: ${storyResponse.status}`);
    }

    const storyData = await storyResponse.json();
    let storyText: string;

    if (model === "gpt-5-mini") {
      storyText = storyData?.choices?.[0]?.message?.content;
    } else {
      storyText = storyData.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    if (!storyText) {
      throw new Error("Failed to generate story");
    }

    let story;
    try {
      story = JSON.parse(storyText);
    } catch {
      const start = storyText.indexOf("{");
      const end = storyText.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        story = JSON.parse(storyText.slice(start, end + 1));
      } else {
        throw new Error("Invalid story format");
      }
    }

    const validated = storySchema.parse(story);
    console.log("Story generated and validated successfully");

    return new Response(
      JSON.stringify({ 
        story: validated,
        analysis 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-story-from-drawing:", error);

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
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
