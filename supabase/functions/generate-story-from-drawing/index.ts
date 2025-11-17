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

    // İlk adım: Resmi analiz et (Lovable AI + tool calling ile katı JSON)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content:
              "Sen çocuk çizimlerini anlayan bir yardımcıısın. Sadece araç çağrısı ile yapılandırılmış veriyi döndür.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Bu çocuk çizimini analiz et ve renkler(<=3), karakterler(<=4), tema, duygu ve hikaye başlığını çıkar.",
              },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_drawing",
              description: "Çocuk çiziminden yapılandırılmış analiz sonucu döndür",
              parameters: {
                type: "object",
                properties: {
                  colors: { type: "array", items: { type: "string" }, maxItems: 3 },
                  characters: {
                    type: "array",
                    maxItems: 4,
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        emoji: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name", "emoji", "description"],
                      additionalProperties: false,
                    },
                  },
                  theme: { type: "string" },
                  mood: { type: "string" },
                  title: { type: "string" },
                },
                required: ["colors", "characters", "theme", "mood", "title"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_drawing" } },
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("Analysis failed:", analysisResponse.status, errorText);
      throw new Error(`Failed to analyze drawing: ${analysisResponse.status} - ${errorText}`);
    }

    const analysisData = await analysisResponse.json();
    const analysisMsg = analysisData.choices?.[0]?.message;

    let analysis;
    const toolArgs = analysisMsg?.tool_calls?.[0]?.function?.arguments;
    if (toolArgs) {
      analysis = JSON.parse(toolArgs);
    } else {
      const analysisContent = analysisMsg?.content || "";
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid analysis format");
      analysis = JSON.parse(jsonMatch[0]);
    }

    console.log("Analysis complete (sanitized). Title:", analysis.title);


    // İkinci adım: Analiz sonucuna göre hikaye oluştur (Lovable AI + tool calling)
    const storyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content:
              "Sen çocuklar için yaratıcı hikayeler oluşturan bir yazarsın. Sadece araç çağrısıyla JSON döndür.",
          },
          {
            role: "user",
            content: `Aşağıdaki analizden BAŞTAN SONA TUTARLI bir çocuk hikayesi üret ve 10 sayfaya böl:\n\nRenkler: ${analysis.colors.join(", ")}\nTema: ${analysis.theme}\nDuygu: ${analysis.mood}\nKarakterler: ${analysis.characters
              .map((c: any) => `${c.name} (${c.description})`)
              .join(", ")}\n\nKurallar: tek parça bütünlük, 10 ardışık sahne, tutarlılık, pozitif final.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "build_story",
              description: "Analize göre hikaye döndür",
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
                        title: { type: "string" },
                        description: { type: "string" },
                        sound: { type: "string" },
                      },
                      required: ["character", "emoji", "title", "description", "sound"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "pages"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "build_story" } },
        // Yeni modellerde max_completion_tokens kullanılır
        max_completion_tokens: 4096,
      }),
    });

    if (!storyResponse.ok) {
      const errorText = await storyResponse.text();
      console.error("Story generation failed:", storyResponse.status, errorText);
      throw new Error(`Failed to generate story: ${storyResponse.status} - ${errorText}`);
    }

    const storyData = await storyResponse.json();
    const storyMsg = storyData.choices?.[0]?.message;

    let story;
    const storyToolArgs = storyMsg?.tool_calls?.[0]?.function?.arguments;
    if (storyToolArgs) {
      story = JSON.parse(storyToolArgs);
    } else {
      const storyContent = storyMsg?.content || "";
      console.log("Story response content:", storyContent);
      // Try to extract JSON from markdown code blocks or plain text
      let jsonStr = storyContent;
      const codeBlockMatch = storyContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        const jsonMatch = storyContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[0];
      }
      try {
        story = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Failed to parse story JSON:", parseError);
        console.error("Attempted to parse:", jsonStr);
        throw new Error("Invalid story format from AI response");
      }
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
