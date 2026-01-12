import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getAccessToken } from "../_shared/google-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const profileSchema = z.object({
  age: z.number().nullable().optional(),
  gender: z.string().nullable().optional(),
  favoriteColor: z.string().nullable().optional(),
  favoriteAnimal: z.string().nullable().optional(),
  favoriteTeam: z.string().nullable().optional(),
  favoriteToy: z.string().nullable().optional(),
  favoriteSuperhero: z.string().nullable().optional(),
  favoriteCartoon: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
}).optional();

// Copyrighted character names and brands that should be replaced with generic descriptions
const COPYRIGHTED_CHARACTERS: { [key: string]: string } = {
  // Marvel
  'hulk': 'yeşil güçlü dev',
  'iron man': 'zırhlı kahraman',
  'ironman': 'zırhlı kahraman',
  'spider-man': 'örümcek güçlü kahraman',
  'spiderman': 'örümcek güçlü kahraman',
  'örümcek adam': 'örümcek güçlü kahraman',
  'thor': 'yıldırım tanrısı kahraman',
  'captain america': 'kalkan taşıyan kahraman',
  'kaptan amerika': 'kalkan taşıyan kahraman',
  'black widow': 'casus kahraman',
  'wolverine': 'pençeli kahraman',
  'deadpool': 'maskeli kahraman',
  'thanos': 'güçlü uzaylı',
  'venom': 'siyah güçlü yaratık',
  'loki': 'hileci sihirbaz',
  
  // DC
  'batman': 'yarasa kostümlü kahraman',
  'superman': 'uçan güçlü kahraman',
  'wonder woman': 'amazon savaşçı prenses',
  'flash': 'hızlı koşan kahraman',
  'aquaman': 'deniz kralı kahraman',
  'joker': 'şakacı kötü karakter',
  'harley quinn': 'renkli kostümlü karakter',
  'robin': 'genç kahraman yardımcısı',
  'catwoman': 'kedi kostümlü kahraman',
  
  // Disney
  'mickey mouse': 'sevimli fare',
  'mickey': 'sevimli fare',
  'minnie mouse': 'sevimli fare kız',
  'minnie': 'sevimli fare kız',
  'donald duck': 'komik ördek',
  'goofy': 'sevimli köpek',
  'pluto': 'sadık köpek',
  'elsa': 'buz prensesi',
  'anna': 'cesur prenses',
  'frozen': 'buz krallığı',
  'moana': 'cesur denizci kız',
  'rapunzel': 'uzun saçlı prenses',
  'ariel': 'deniz kızı prenses',
  'simba': 'aslan yavrusu',
  'mufasa': 'kral aslan',
  'nemo': 'palyaço balığı',
  'dory': 'mavi balık',
  'buzz lightyear': 'uzay kahramanı',
  'woody': 'kovboy oyuncak',
  
  // Other popular
  'pokemon': 'cep canavarları',
  'pikachu': 'elektrikli sarı yaratık',
  'mario': 'atlayan kahraman',
  'luigi': 'yeşil şapkalı kahraman',
  'sonic': 'hızlı mavi kirpi',
  'shrek': 'yeşil dev',
  'peppa pig': 'sevimli domuz',
  'paw patrol': 'kahraman köpekler',
  'spongebob': 'deniz süngeri',
  'dora': 'kaşif kız',
  'barbie': 'güzel bebek',
  'hello kitty': 'sevimli kedi',
  'winnie the pooh': 'bal seven ayı',
  'pooh': 'bal seven ayı',
  'transformers': 'dönüşen robotlar',
  'harry potter': 'sihirbaz çocuk',
  'optimus prime': 'lider robot',
  
  // Turkish/International sports teams (as copyrighted brands)
  'galatasaray': 'sarı-kırmızı takım',
  'fenerbahçe': 'sarı-lacivert takım',
  'beşiktaş': 'siyah-beyaz takım',
  'trabzonspor': 'bordo-mavi takım',
  'barcelona': 'mavi-kırmızı takım',
  'real madrid': 'beyaz takım',
};

// Check if text contains copyrighted content and return sanitized version
function sanitizeCopyrightedContent(text: string): { sanitized: string; hasCopyrighted: boolean; found: string[] } {
  if (!text) return { sanitized: text, hasCopyrighted: false, found: [] };
  
  let sanitized = text.toLowerCase();
  const found: string[] = [];
  
  for (const [copyrighted, replacement] of Object.entries(COPYRIGHTED_CHARACTERS)) {
    const regex = new RegExp(`\\b${copyrighted}\\b`, 'gi');
    if (regex.test(sanitized)) {
      found.push(copyrighted);
      sanitized = sanitized.replace(regex, replacement);
    }
  }
  
  // Restore original case for first letter of sentences
  if (found.length > 0) {
    sanitized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
  } else {
    sanitized = text; // Return original if no changes
  }
  
  return { sanitized, hasCopyrighted: found.length > 0, found };
}

const requestSchema = z.object({
  theme: z.string().min(1, "Theme cannot be empty").max(200, "Theme must be less than 200 characters"),
  language: z.enum(["tr", "en"]).default("tr"),
  pageCount: z.number().min(5).max(20).default(10),
  model: z.enum(["gemini-3-pro-preview", "gpt-5-mini", "gpt-5.1-mini-preview"]).optional().default("gemini-3-pro-preview"),
  profile: profileSchema,
});

const storySchema = z.object({
  title: z.string().min(1),
  pages: z.array(z.object({
    character: z.string().min(1),
    emoji: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    sound: z.string().min(1),
    textPosition: z.enum(["top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"]).optional().default("top"),
  })).min(5).max(20),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { theme, language, pageCount, model, profile } = requestSchema.parse(body);
    
    console.log(`Generating story: theme=${theme}, lang=${language}, pages=${pageCount}, model=${model}, hasProfile=${!!profile}`);

    // Build personalization context from profile with copyright sanitization
    let personalizationContext = "";
    const copyrightWarnings: string[] = [];
    
    if (profile) {
      const parts: string[] = [];
      
      if (profile.displayName) {
        parts.push(`Ana karakterin adı "${profile.displayName}" olsun veya hikayede bu isimde bir arkadaş olsun`);
      }
      if (profile.age) {
        parts.push(`Hikaye ${profile.age} yaşındaki bir çocuk için uygun olsun`);
      }
      if (profile.gender) {
        parts.push(`Ana karakter ${profile.gender === 'erkek' ? 'erkek' : profile.gender === 'kız' ? 'kız' : ''} olabilir`);
      }
      if (profile.favoriteColor) {
        parts.push(`Hikayede ${profile.favoriteColor} rengi ön plana çıksın`);
      }
      if (profile.favoriteAnimal) {
        parts.push(`Hikayede ${profile.favoriteAnimal} karakteri veya benzeri bir hayvan bulunsun`);
      }
      
      // Sanitize potentially copyrighted content
      if (profile.favoriteSuperhero) {
        const check = sanitizeCopyrightedContent(profile.favoriteSuperhero);
        if (check.hasCopyrighted) {
          copyrightWarnings.push(`Superhero: ${check.found.join(', ')} → ${check.sanitized}`);
          parts.push(`${check.sanitized} tarzı süper güçler veya kahramanlık temaları eklenebilir (NOT: Orijinal karakter adlarını KULLANMA, genel tanımlamalar kullan)`);
        } else {
          parts.push(`${profile.favoriteSuperhero} tarzı süper güçler veya kahramanlık temaları eklenebilir`);
        }
      }
      if (profile.favoriteCartoon) {
        const check = sanitizeCopyrightedContent(profile.favoriteCartoon);
        if (check.hasCopyrighted) {
          copyrightWarnings.push(`Cartoon: ${check.found.join(', ')} → ${check.sanitized}`);
          parts.push(`${check.sanitized} tarzı çizgi filminden ilham alınabilir (NOT: Orijinal karakter adlarını KULLANMA, genel tanımlamalar kullan)`);
        } else {
          parts.push(`${profile.favoriteCartoon} çizgi filminin tarzından ilham alınabilir`);
        }
      }
      if (profile.favoriteToy) {
        const check = sanitizeCopyrightedContent(profile.favoriteToy);
        if (check.hasCopyrighted) {
          copyrightWarnings.push(`Toy: ${check.found.join(', ')} → ${check.sanitized}`);
          parts.push(`Hikayede ${check.sanitized} ile ilgili bir öğe olabilir`);
        } else {
          parts.push(`Hikayede ${profile.favoriteToy} ile ilgili bir öğe olabilir`);
        }
      }
      if (profile.favoriteTeam) {
        const check = sanitizeCopyrightedContent(profile.favoriteTeam);
        if (check.hasCopyrighted) {
          copyrightWarnings.push(`Team: ${check.found.join(', ')} → ${check.sanitized}`);
          parts.push(`Takım ruhu ve ${check.sanitized} gibi birlikte çalışma temaları işlenebilir`);
        } else {
          parts.push(`Takım ruhu ve ${profile.favoriteTeam} gibi birlikte çalışma temaları işlenebilir`);
        }
      }
      
      if (parts.length > 0) {
        personalizationContext = `\n\nKİŞİSELLEŞTİRME (çocuğun tercihlerine göre hikayeyi uyarla):\n${parts.map((p, i) => `${i + 1}) ${p}`).join('\n')}`;
      }
    }
    
    if (copyrightWarnings.length > 0) {
      console.log(`Copyright content sanitized: ${copyrightWarnings.join('; ')}`);
    }
    
    // Sanitize theme as well
    const themeCheck = sanitizeCopyrightedContent(theme);
    const safeTheme = themeCheck.sanitized;
    if (themeCheck.hasCopyrighted) {
      console.log(`Theme sanitized: ${themeCheck.found.join(', ')} → ${safeTheme}`);
    }

    const prompt = `"${safeTheme}" temalı ${pageCount} sayfalık BİR BÜTÜN OLARAK TUTARLI bir çocuk hikayesi oluştur:

ÖNEMLİ TELİF HAKKI KURALI:
- Hikayelerde Marvel, DC, Disney, Pokemon veya herhangi bir telif haklı karakter adı KULLANMA
- Örneğin "Hulk" yerine "yeşil güçlü dev", "Superman" yerine "uçan kahraman" gibi genel tanımlamalar kullan
- Çocuğun sevdiği karakterden SADECE ilham al, karakter adını hikayede KULLANMA

KURALLAR:
1) ${language === "tr" ? "HİKAYE TAMAMEN TÜRKÇE OLMALIDIR" : "STORY MUST BE ENTIRELY IN ENGLISH"}
2) Önce tek parça bütün bir hikaye (başlangıç-gelişme-sonuç) kurgula
3) Sonra bu hikayeyi ${pageCount} ardışık sahneye böl; her sayfa bir öncekinin devamı olsun
4) Karakterler tutarlı davransın ve her sayfada gelişsinler
5) Son sayfada pozitif, mutlu bir final olsun
6) Her sayfanın açıklaması en az 3 cümle olmalı ve bir önceki sayfanın devamı olmalı
7) Her sayfa için "textPosition" belirle - görselin ana odak noktasına göre metnin nereye yerleştirileceğini seç:
   - "top": Ana odak altta veya ortadaysa
   - "bottom": Ana odak üstteyse
   - "top-left": Ana odak sağ alttaysa
   - "top-right": Ana odak sol alttaysa
   - "bottom-left": Ana odak sağ üstteyse
   - "bottom-right": Ana odak sol üstteyse
${personalizationContext}

JSON FORMATINDA DÖNÜŞ YAP (tüm içerik ${language === "tr" ? "Türkçe" : "English"}):
{
  "title": "${language === "tr" ? "Hikaye Başlığı (Türkçe)" : "Story Title (English)"}",
  "pages": [
    {
      "character": "${language === "tr" ? "Karakter adı (Türkçe)" : "Character name (English)"}",
      "emoji": "🎨",
      "title": "${language === "tr" ? "Sayfa başlığı (Türkçe)" : "Page title (English)"}",
      "description": "${language === "tr" ? "Detaylı açıklama (Türkçe, en az 3 cümle, hikayenin devamı)" : "Detailed description (English, at least 3 sentences, continuation of story)"}",
      "sound": "${language === "tr" ? "Ses efekti (Türkçe)" : "Sound effect (English)"}",
      "textPosition": "top"
    }
  ]
}

Toplam ${pageCount} sayfa olmalı ve her sayfa öncekinin devamı olmalı. Tüm içerik ${language === "tr" ? "TÜRKÇE" : "ENGLISH"} olmalıdır!`;

    let response: Response;

    if (model === "gpt-5-mini" || model === "gpt-5.1-mini-preview") {
      // Use OpenAI API directly
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not configured");
      }

      const openaiModel = model === "gpt-5.1-mini-preview" ? "gpt-5.1-mini-preview-2025-12-17" : "gpt-5-mini-2025-08-07";

      response = await fetch("https://api.openai.com/v1/chat/completions", {
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
              content: prompt
            }
          ],
          max_completion_tokens: 8192,
        }),
      });
    } else {
      // Use Google Gemini API - Try service account first, then API key
      const accessToken = await getAccessToken();
      
      if (accessToken) {
        console.log("Using service account authentication for Gemini");
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          }),
        });
      } else {
        // Fallback to API key
        const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
        if (!GOOGLE_AI_API_KEY) {
          throw new Error("No Gemini authentication available (neither service account nor API key)");
        }
        console.log("Using API key authentication for Gemini");
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${GOOGLE_AI_API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          }),
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${model} API error:`, response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "RATE_LIMIT",
            message: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "PAYMENT_REQUIRED",
            message: "Lovable AI kredileriniz tükendi. Lütfen Settings → Workspace → Usage bölümünden kredi ekleyin."
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`${model} response received`);
    
    let content: string;

    if (model === "gpt-5-mini") {
      // Extract from GPT response
      const choice = data?.choices?.[0];
      if (!choice) {
        console.error("No choices in GPT response");
        throw new Error("GPT'den yanıt alınamadı");
      }
      content = choice.message?.content;
    } else {
      // Extract from Gemini response
      content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    if (!content) {
      console.error("No content in response");
      console.error("Full response:", JSON.stringify(data));
      throw new Error("AI'dan metin alınamadı. Lütfen tekrar deneyin.");
    }

    console.log("Story content received, length:", content.length);

    let story;
    try {
      story = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content:", content.substring(0, 500));
      
      // Try to extract JSON from text
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        try {
          story = JSON.parse(content.slice(start, end + 1));
        } catch (e2) {
          console.error("Brace-slice parse failed:", e2);
          throw new Error("Hikaye formatı geçersiz");
        }
      } else {
        throw new Error("JSON formatı bulunamadı");
      }
    }

    // Validate story structure
    const validated = storySchema.parse(story);
    console.log("Story validated successfully");

    return new Response(
      JSON.stringify({ story: validated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-story function:", error);

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
        error: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
