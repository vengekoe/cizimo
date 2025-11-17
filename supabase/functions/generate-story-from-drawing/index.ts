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
        // Validate it's a valid base64 data URL
        return val.startsWith('data:image/');
      } catch {
        return false;
      }
    }, "Invalid image format"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { imageBase64 } = requestSchema.parse(body);
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    console.log("Analyzing child's drawing with OpenAI...");

    // İlk adım: Resmi analiz et
    const analysisResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: [
          {
            role: "system",
            content: "Sen çocuk çizimlerini anlayan bir yardımcısın. Çizimdeki renkleri, karakterleri, duyguyu ve temayı analiz et ve JSON formatında döndür.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
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
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("Analysis failed:", analysisResponse.status, errorText);
      
      if (analysisResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "PAYMENT_REQUIRED",
            message: "OpenAI API kredileriniz tükendi."
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "RATE_LIMIT",
            message: "Çok fazla istek gönderildi."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Failed to analyze drawing: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const analysisRaw = analysisData.choices?.[0]?.message?.content;
    let analysis: any;
    try {
      analysis = typeof analysisRaw === "string" ? JSON.parse(analysisRaw) : analysisRaw;
    } catch {
      const match = typeof analysisRaw === "string" ? analysisRaw.match(/\{[\s\S]*\}/) : null;
      if (!match) throw new Error("Invalid analysis format");
      analysis = JSON.parse(match[0]);
    }
    console.log("Analysis complete - Title:", analysis.title);

    // İkinci adım: Analiz sonucuna göre hikaye oluştur
    const storyResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
              content: "Sen çocuklar için yaratıcı hikayeler yazan bir yazarsın. Baştan sona tutarlı, akıcı ve bütünsel hikayeler oluşturursun. YANITINI SADECE 'create_story' adlı aracı çağırarak ver; başka içerik ekleme.",
            },
            {
              role: "user",
              content: `Aşağıdaki özelliklere dayanarak BAŞTAN SONA TUTARLI bir çocuk hikayesi üret ve 10 sayfaya böl:

Renkler: ${analysis.colors.join(", ")}
Tema: ${analysis.theme}
Duygu: ${analysis.mood}
Karakterler: ${analysis.characters.map((c: any) => `${c.name} (${c.description})`).join(", ")}

KURALLAR:
1) Önce tek parça bütün bir hikaye (başlangıç-gelişme-sonuç) kurgula
2) Sonra bu hikayeyi 10 ardışık sahneye böl; her sayfa bir öncekinin devamı olsun
3) Karakterler tutarlı davransın
4) Son sayfada pozitif final olsun

ÇIKTI FORMATIN (yalnızca JSON):
{
  "title": "${analysis.title}",
  "pages": [
    {
      "character": "Karakter Adı",
      "emoji": "🎨",
      "title": "Sayfa Başlığı (<= 8 kelime)",
      "description": "1-2 cümle (<= 25 kelime)",
      "sound": "Ses efekti"
    }
  ]
}
`
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_story",
                description: "10 sayfaya bölünmüş, ardışık ve pozitif finali olan bir çocuk hikayesini döndür.",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    pages: {
                      type: "array",
                      minItems: 10,
                      maxItems: 10,
                      items: {
                        type: "object",
                        properties: {
                          character: { type: "string" },
                          emoji: { type: "string" },
                          title: { type: "string", maxLength: 60 },
                          description: { type: "string", maxLength: 200 },
                          sound: { type: "string" }
                        },
                        required: ["character", "emoji", "title", "description", "sound"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["title", "pages"],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "create_story" } },
          max_completion_tokens: 2048,
          response_format: { type: "json_object" },
        }),
    });

    if (!storyResponse.ok) {
      const errorText = await storyResponse.text();
      console.error("Story generation failed:", storyResponse.status, errorText);
      
      if (storyResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "PAYMENT_REQUIRED",
            message: "OpenAI API kredileriniz tükendi."
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (storyResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "RATE_LIMIT",
            message: "Çok fazla istek gönderildi."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Failed to generate story: ${storyResponse.status}`);
    }

    const storyData = await storyResponse.json();
    const choice = storyData.choices?.[0] ?? {};
    const message = choice.message ?? {};
    const toolCall = message?.tool_calls?.[0];
    const toolArgsRaw = toolCall?.function?.arguments;
    const functionCallArgsRaw = message?.function_call?.arguments;
    const storyRaw = message?.content as string | undefined;

    console.log("Story generated successfully");

    const tryParse = (val: unknown) => {
      if (!val) return undefined as any;
      if (typeof val === "string") {
        try { return JSON.parse(val); } catch { return undefined as any; }
      }
      if (typeof val === "object") return val as any;
      return undefined as any;
    };

    let story: any =
      tryParse(toolArgsRaw) ??
      tryParse(functionCallArgsRaw) ??
      tryParse(storyRaw);

    if (!story && typeof storyRaw === "string") {
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

    if (!story && typeof toolArgsRaw === "string") {
      const start = toolArgsRaw.indexOf("{");
      const end = toolArgsRaw.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        try {
          story = JSON.parse(toolArgsRaw.slice(start, end + 1));
        } catch { /* ignore */ }
      }
    }

    if (!story) {
      console.warn("Primary parse failed; retrying with json_object no-tools...");
      const retryBody = {
        model: "gpt-5-2025-08-07",
        messages: [
          { role: "system", content: "Sen çocuklar için yaratıcı hikayeler yazan bir yazarsın. Yalnızca geçerli JSON üret." },
          { role: "user", content: `Aşağıdaki özelliklere dayanarak 10 sayfalık TUTARLI bir çocuk hikayesi üret ve JSON dön:\n\nRenkler: ${analysis.colors.join(", ")}\nTema: ${analysis.theme}\nDuygu: ${analysis.mood}\nKarakterler: ${analysis.characters.map((c: any) => `${c.name} (${c.description})`).join(", ")}\n\nFORMAT:\n{\n  \"title\": \"${analysis.title}\",\n  \"pages\": [{\n    \"character\": \"\",\n    \"emoji\": \"\",\n    \"title\": \"\",\n    \"description\": \"\",\n    \"sound\": \"\"\n  }]\n}` }
        ],
        max_completion_tokens: 2048,
        response_format: { type: "json_object" },
      } as const;

      const retryResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(retryBody),
      });

      if (retryResp.ok) {
        const retryData = await retryResp.json();
        const retryRaw = retryData.choices?.[0]?.message?.content as string | undefined;
        if (retryRaw) {
          try {
            story = JSON.parse(retryRaw);
          } catch (e) {
            const s = retryRaw.indexOf("{");
            const eidx = retryRaw.lastIndexOf("}");
            if (s !== -1 && eidx !== -1) {
              try { story = JSON.parse(retryRaw.slice(s, eidx + 1)); } catch {}
            }
          }
        }
      } else {
        const t = await retryResp.text();
        console.error("Retry story request failed:", retryResp.status, t);
      }

      if (!story) {
        console.error(
          "Story parse failed after retry. Debug -> hasToolCalls:", Boolean(toolCall),
          "toolArgsType:", typeof toolArgsRaw,
          "hasFunctionCall:", Boolean(functionCallArgsRaw),
          "contentLen:", storyRaw?.length ?? 0
        );
        throw new Error("Invalid story format from AI response");
      }
    }

    // Minimal schema validation for robustness
    const storySchema = z.object({
      title: z.string().min(1),
      pages: z.array(z.object({
        character: z.string().min(1),
        emoji: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
        sound: z.string().min(1),
      })).min(1),
    });
    story = storySchema.parse(story);

    return new Response(
      JSON.stringify({
        story,
        analysis: {
          colors: analysis.colors,
          theme: analysis.theme,
          mood: analysis.mood,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-story-from-drawing:", error);
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
