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
    const { imageBase64 } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
    if (!imageBase64) throw new Error("Image is required");

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
      }),
    });

    if (!storyResponse.ok) {
      console.error("Story generation failed:", storyResponse.status);
      throw new Error("Failed to generate story");
    }

    const storyData = await storyResponse.json();
    const storyContent = storyData.choices[0].message.content;
    
    const storyJsonMatch = storyContent.match(/\{[\s\S]*\}/);
    if (!storyJsonMatch) throw new Error("Invalid story format");
    
    const story = JSON.parse(storyJsonMatch[0]);

    return new Response(
      JSON.stringify({
        ...story,
        metadata: {
          colors: analysis.colors,
          theme: analysis.theme,
          mood: analysis.mood,
          originalCharacters: analysis.characters,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Story generation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
