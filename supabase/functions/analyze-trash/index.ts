import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const MODERATION_PROMPT = `You are moderating photos for a civic trash-reporting app in Nairobi.
Return ONLY valid JSON with no markdown:
{
  "is_safe": boolean,
  "is_trash": boolean,
  "severity": number 1-10,
  "tags": string[],
  "confidence": number 0-1,
  "moderation_action": "approve" | "review" | "reject",
  "moderation_note": string
}
Rules:
- is_safe=false for NSFW, violence, hate, or non-street photos (selfies, memes, screenshots)
- is_trash=false if the image is not genuine urban trash/pollution
- moderation_action=approve when is_safe and is_trash and confidence>=0.85
- moderation_action=review when uncertain or confidence 0.5-0.84
- moderation_action=reject when not safe or clearly not trash`

const CLEAR_PROMPT = `Compare these two images of the same urban location (before and after cleanup).
Return ONLY valid JSON with no markdown: {"is_cleared": boolean, "matches_location": boolean, "confidence": number 0-1}`

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url)
  const blob = await res.blob()
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return {
    data: btoa(binary),
    mimeType: blob.type || 'image/jpeg',
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY secret is not set')
    }

    const body = await req.json()
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    if (body.mode === 'clear') {
      const before = await fetchImageAsBase64(body.beforeImageUrl)
      const result = await model.generateContent([
        CLEAR_PROMPT,
        { inlineData: { data: before.data, mimeType: before.mimeType } },
        {
          inlineData: {
            data: body.clearedImageBase64,
            mimeType: body.clearedMimeType || 'image/jpeg',
          },
        },
      ])
      const text = result.response.text().replace(/```json|```/g, '').trim()
      return new Response(text, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await model.generateContent([
      MODERATION_PROMPT,
      {
        inlineData: {
          data: body.imageBase64,
          mimeType: body.mimeType || 'image/jpeg',
        },
      },
    ])
    const text = result.response.text().replace(/```json|```/g, '').trim()
    return new Response(text, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Analysis failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
