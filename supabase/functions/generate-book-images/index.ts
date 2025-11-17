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
    const { pages, theme } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    
    if (!OPENAI_API_KEY && !GOOGLE_AI_API_KEY) {
      throw new Error("Ne OPENAI_API_KEY ne de GOOGLE_AI_API_KEY yapılandırılmamış");
    }

    console.log(`Generating ${pages.length} images for theme: ${theme}`);

    // Process sequentially with retry to avoid rate limits
    const images: (string | null)[] = [];

    async function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function generateImageWithRetry(prompt: string, attempt = 1): Promise<string | null> {
      // Prefer Gemini if available (kullanıcı isteği), aksi halde OpenAI; başarısız olursa diğerine düş
      const tryGemini = async (): Promise<{ ok: boolean; dataUrl?: string; retryable?: boolean; unauthorized?: boolean }> => {
        if (!GOOGLE_AI_API_KEY) return { ok: false };
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GOOGLE_AI_API_KEY}`;
        const body = JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        });
        const resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
        if (!resp.ok) {
          const t = await resp.text();
          console.error(`Gemini image gen failed (attempt ${attempt}):`, resp.status, t);
          return {
            ok: false,
            retryable: resp.status === 429,
            unauthorized: resp.status === 401 || resp.status === 403,
          };
        }
        const data = await resp.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const inline = parts.find((p: any) => p.inlineData)?.inlineData;
        const base64 = inline?.data as string | undefined;
        const mime = inline?.mimeType as string | undefined;
        if (!base64) return { ok: false };
        return { ok: true, dataUrl: `data:${mime || "image/png"};base64,${base64}` };
      };

      const tryOpenAI = async (): Promise<{ ok: boolean; dataUrl?: string; retryable?: boolean; unauthorized?: boolean }> => {
        if (!OPENAI_API_KEY) return { ok: false };
        const url = "https://api.openai.com/v1/images/generations";
        const body = JSON.stringify({ model: "gpt-image-1", prompt, n: 1, size: "1024x1024" });
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
          body,
        });
        if (!resp.ok) {
          const t = await resp.text();
          console.error(`OpenAI image gen failed (attempt ${attempt}):`, resp.status, t);
          return {
            ok: false,
            retryable: resp.status === 429,
            unauthorized: resp.status === 401 || resp.status === 403,
          };
        }
        const data = await resp.json();
        const b64 = data?.data?.[0]?.b64_json as string | undefined;
        if (!b64) return { ok: false };
        return { ok: true, dataUrl: `data:image/png;base64,${b64}` };
      };

      // Attempt order: Gemini → OpenAI
      for (let a = attempt; a <= 3; a++) {
        const g = await tryGemini();
        if (g.ok) return g.dataUrl!;
        if (g.retryable && a < 3) { await delay((6 * a) * 1000); continue; }

        const o = await tryOpenAI();
        if (o.ok) return o.dataUrl!;
        if ((g.retryable || o.retryable) && a < 3) { await delay((6 * a) * 1000); continue; }

        // If both unauthorized, break early
        if (g.unauthorized && o.unauthorized) break;
      }
      return null;
    }

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      const prompt = `Create a vibrant children's book illustration suitable for ages 3-7. Character: ${page.character} ${page.emoji}. ${page.description}. Theme: ${theme}. Style: colorful, friendly, simple shapes, high-contrast, warm and inviting.`;
      console.log(`Generating image ${index + 1}/${pages.length}: ${prompt.substring(0, 50)}...`);
      const img = await generateImageWithRetry(prompt);
      images.push(img);
      // Small delay between requests to reduce rate limiting
      await delay(500);
    }

    console.log(`Successfully generated ${images.filter((img) => img !== null).length} images`);

    return new Response(JSON.stringify({ images }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Image generation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Bilinmeyen hata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
