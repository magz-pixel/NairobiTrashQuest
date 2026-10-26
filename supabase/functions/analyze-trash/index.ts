import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_MODEL = 'gemini-2.5-flash'

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

class HttpError extends Error {
  status: number
  constructor(status: number, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'HttpError'
    this.status = status
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Keep provider errors useful in logs without echoing a query-string API key. */
function scrub(message: string): string {
  return message.replace(/key=[^&\s]+/gi, 'key=redacted').slice(0, 500)
}

function errorMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error && err.message ? err.message : fallback
  return scrub(raw)
}

function parseModelJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch (err) {
    throw new HttpError(502, 'Gemini returned an unreadable result', { cause: err })
  }
}

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch (err) {
    throw new HttpError(400, 'Could not load the before photo. The image URL is not valid.', {
      cause: err,
    })
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new HttpError(400, 'Could not load the before photo. The image URL is not valid.')
  }

  let res: Response
  try {
    res = await fetch(parsed)
  } catch (err) {
    throw new HttpError(400, 'Could not load the before photo.', { cause: err })
  }
  if (!res.ok) {
    throw new HttpError(
      400,
      `Could not load the before photo (HTTP ${res.status}).`,
    )
  }

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

type ModelPart =
  | string
  | { inlineData: { data: string; mimeType: string } }

async function generateJson(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  parts: ModelPart[],
): Promise<unknown> {
  let result: Awaited<ReturnType<typeof model.generateContent>>
  try {
    result = await model.generateContent(parts)
  } catch (err) {
    throw new HttpError(502, errorMessage(err, 'Gemini request failed'), { cause: err })
  }

  let text = ''
  try {
    text = result.response.text()
  } catch (err) {
    throw new HttpError(502, 'Gemini returned no result', { cause: err })
  }
  return parseModelJson(text)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      console.error('analyze-trash: GEMINI_API_KEY secret is not set')
      return jsonResponse({ error: 'GEMINI_API_KEY secret is not set' }, 500)
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch (err) {
      console.error('analyze-trash: invalid request body', err)
      return jsonResponse({ error: 'Request body must be JSON' }, 400)
    }

    const modelName = Deno.env.get('GEMINI_MODEL')?.trim() || DEFAULT_MODEL
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelName })

    if (body.mode === 'clear') {
      if (typeof body.beforeImageUrl !== 'string' || !body.beforeImageUrl.trim()) {
        return jsonResponse({ error: 'beforeImageUrl is required' }, 400)
      }
      if (typeof body.clearedImageBase64 !== 'string' || !body.clearedImageBase64) {
        return jsonResponse({ error: 'clearedImageBase64 is required' }, 400)
      }

      const before = await fetchImageAsBase64(body.beforeImageUrl)
      const parsed = await generateJson(model, [
        CLEAR_PROMPT,
        { inlineData: { data: before.data, mimeType: before.mimeType } },
        {
          inlineData: {
            data: body.clearedImageBase64,
            mimeType:
              typeof body.clearedMimeType === 'string' && body.clearedMimeType
                ? body.clearedMimeType
                : 'image/jpeg',
          },
        },
      ])
      return jsonResponse(parsed)
    }

    if (typeof body.imageBase64 !== 'string' || !body.imageBase64) {
      return jsonResponse({ error: 'imageBase64 is required' }, 400)
    }

    const parsed = await generateJson(model, [
      MODERATION_PROMPT,
      {
        inlineData: {
          data: body.imageBase64,
          mimeType:
            typeof body.mimeType === 'string' && body.mimeType ? body.mimeType : 'image/jpeg',
        },
      },
    ])
    return jsonResponse(parsed)
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500
    const message =
      err instanceof HttpError
        ? err.message
        : errorMessage(err, 'Analysis failed')
    console.error('analyze-trash failed', message, err instanceof HttpError ? err.cause ?? err : err)
    return jsonResponse({ error: message }, status)
  }
})
