import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const requestSchema = z.object({
  text: z.string().min(1, "Text cannot be empty").max(1000, "Text must be less than 1000 characters"),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { text } = requestSchema.parse(body)

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key bulunamadı')
    }

    console.log('Text-to-speech isteği:', text.substring(0, 50))

    // ElevenLabs API çağrısı - Türkçe seslendirme için Aria kullanıyoruz
    const response = await fetch(
      'https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x',
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          }
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('ElevenLabs hatası:', error)
      throw new Error(`Ses oluşturulamadı: ${error}`)
    }

    // Ses verisini base64'e çevir
    const arrayBuffer = await response.arrayBuffer()
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    )

    console.log('Ses başarıyla oluşturuldu, boyut:', arrayBuffer.byteLength)

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Text-to-speech hatası:', error)
    const isValidationError = error instanceof z.ZodError;
    return new Response(
      JSON.stringify({ 
        error: isValidationError 
          ? `Validation error: ${error.errors.map(err => err.message).join(', ')}`
          : error instanceof Error ? error.message : 'Bilinmeyen hata' 
      }),
      {
        status: isValidationError ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
