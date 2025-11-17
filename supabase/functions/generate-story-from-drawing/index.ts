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

    console.log("Analyzing child's drawing...");

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
            content: "Sen çocuk çizimlerini anlayan ve onlardan ilham alan bir hikaye yazarısın. Çizimdeki renkleri, karakterleri, duyguyu ve temayı analiz edip bunlardan yaratıcı hikayeler oluşturuyorsun.",
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
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("Analysis failed:", analysisResponse.status, errorText);
      throw new Error(`Failed to analyze drawing: ${analysisResponse.status} - ${errorText}`);
    }

    const analysisData = await analysisResponse.json();
    const analysisContent = analysisData.choices[0].message.content;
    
    const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid analysis format");
    
    const analysis = JSON.parse(jsonMatch[0]);
    console.log("Analysis complete:", analysis);

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
            content: "Sen çocuklar için yaratıcı hikayeler yazan bir yazarsın. Baştan sona tutarlı, akıcı ve bütünsel hikayeler oluşturursun. Önce kafanda olay örgüsünü planlar, sonra sayfalara bölersin. Yanıtın yalnızca geçerli JSON olmalıdır.",
          },
          {
            role: "user",
            content: `Aşağıdaki özelliklere dayanarak BAŞTAN SONA TUTARLI bir çocuk hikayesi üret ve 10 sayfaya böl:

Renkler: ${analysis.colors.join(", ")}
Tema: ${analysis.theme}
Duygu: ${analysis.mood}
Karakterler: ${analysis.characters.map((c: any) => `${c.name} (${c.description})`).join(", ")}

KURALLAR:
1) Önce tek parça bütün bir hikaye (başlangıç-gelişme-sonuç) kurgula; olaylar mantıksal olarak ilerlesin.
2) Sonra bu hikayeyi 10 ardışık sahneye böl; her sayfa bir öncekinin DOĞRUDAN devamı olsun.
3) Aynı karakterler hikaye boyunca tutarlı davransın, yer-zaman değişimleri yumuşak geçişlerle olsun.
4) Son sayfada pozitif ve kapanış yapan bir final olsun.

ÇIKTI FORMATIN (yalnızca JSON):
{
  "title": "${analysis.title}",
  "pages": [
    {
      "character": "Karakter Adı",
      "emoji": "🎨",
      "title": "Sayfa Başlığı (<= 8 kelime)",
      "description": "Önceki sayfanın devamı olacak şekilde 1-2 cümle, akıcı ve bağlamsal (<= 25 kelime)",
      "sound": "Uygun ses efekti"
    }
  ]
}
`
          },
        ],
        max_completion_tokens: 4096,
      }),
    });

    if (!storyResponse.ok) {
      const errorText = await storyResponse.text();
      console.error("Story generation failed:", storyResponse.status, errorText);
      throw new Error(`Failed to generate story: ${storyResponse.status} - ${errorText}`);
    }

    const storyData = await storyResponse.json();
    const storyContent = storyData.choices[0].message.content;
    
    console.log("Story response content:", storyContent);
    
    // Try to extract JSON from markdown code blocks or plain text
    let jsonStr = storyContent;
    
    // Remove markdown code blocks if present
    const codeBlockMatch = storyContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    } else {
      // Try to find JSON object in the text
      const jsonMatch = storyContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }
    
    let story;
    try {
      story = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse story JSON:", parseError);
      console.error("Attempted to parse:", jsonStr);
      throw new Error("Invalid story format from AI response");
    }

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
