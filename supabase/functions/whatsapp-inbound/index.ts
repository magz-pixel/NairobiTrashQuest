import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

/**
 * Twilio inbound WhatsApp bridge: photo and location often arrive as separate messages.
 *
 * Expected Supabase secrets (Dashboard → Edge Functions → Secrets):
 *   TWILIO_ACCOUNT_SID  — Twilio Account SID (MediaUrl download + Messages API)
 *   TWILIO_AUTH_TOKEN   — Twilio Auth Token
 *   WHATSAPP_WEBHOOK_SECRET — forwarded to whatsapp-webhook when creating a report
 *
 * Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Known gap: whatsapp_pending_reports rows are not expired automatically yet.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PendingRow {
  phone_number: string
  image_url: string | null
  latitude: number | null
  longitude: number | null
  updated_at: string
}

function twilioBasicAuth(accountSid: string, authToken: string): string {
  return 'Basic ' + btoa(`${accountSid}:${authToken}`)
}

function extensionForContentType(contentType: string | null): string {
  if (!contentType) return 'jpg'
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('gif')) return 'gif'
  return 'jpg'
}

function parseCoordinate(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : null
}

function isComplete(row: Pick<PendingRow, 'image_url' | 'latitude' | 'longitude'>): boolean {
  return (
    typeof row.image_url === 'string' &&
    row.image_url.length > 0 &&
    row.latitude != null &&
    row.longitude != null
  )
}

async function downloadTwilioMedia(
  mediaUrl: string,
  accountSid: string,
  authToken: string,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const res = await fetch(mediaUrl, {
    headers: { Authorization: twilioBasicAuth(accountSid, authToken) },
  })
  if (!res.ok) {
    throw new Error(`Twilio media download failed (${res.status})`)
  }
  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const bytes = new Uint8Array(await res.arrayBuffer())
  return { bytes, contentType }
}

async function uploadReportImage(
  supabase: ReturnType<typeof createClient>,
  phoneNumber: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<string> {
  const ext = extensionForContentType(contentType)
  const safePhone = phoneNumber.replace(/[^a-zA-Z0-9+]/g, '_')
  const path = `anonymous/whatsapp/${safePhone}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('report-images').upload(path, bytes, {
    contentType,
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from('report-images').getPublicUrl(path)
  return data.publicUrl
}

async function sendWhatsAppReply(
  to: string,
  from: string,
  body: string,
  accountSid: string,
  authToken: string,
): Promise<void> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: twilioBasicAuth(accountSid, authToken),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Twilio reply failed (${res.status}): ${detail}`)
  }
}

async function createReportViaWebhook(
  latitude: number,
  longitude: number,
  image_url: string,
): Promise<{ ok: boolean; report_id?: string }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  if (!supabaseUrl) throw new Error('SUPABASE_URL is not set')

  const secret = Deno.env.get('WHATSAPP_WEBHOOK_SECRET')
  const res = await fetch(`${supabaseUrl}/functions/v1/whatsapp-webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { 'x-webhook-secret': secret } : {}),
    },
    body: JSON.stringify({ latitude, longitude, image_url }),
  })

  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      typeof payload?.error === 'string' ? payload.error : `HTTP ${res.status}`
    throw new Error(message)
  }
  return payload as { ok: boolean; report_id?: string }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  if (!accountSid || !authToken) {
    return new Response(JSON.stringify({ error: 'Twilio is not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const form = new URLSearchParams(await req.text())
    const from = form.get('From')?.trim() ?? ''
    const to = form.get('To')?.trim() ?? ''
    const numMedia = Number.parseInt(form.get('NumMedia') ?? '0', 10) || 0
    const mediaUrl0 = form.get('MediaUrl0')
    const mediaContentType0 = form.get('MediaContentType0')
    const latitude = parseCoordinate(form.get('Latitude'))
    const longitude = parseCoordinate(form.get('Longitude'))

    if (!from || !to) {
      return new Response(JSON.stringify({ error: 'Missing From/To' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: existing, error: loadError } = await supabase
      .from('whatsapp_pending_reports')
      .select('*')
      .eq('phone_number', from)
      .maybeSingle()

    if (loadError) throw loadError

    let imageUrl = existing?.image_url ?? null
    let lat = existing?.latitude ?? null
    let lng = existing?.longitude ?? null

    const gotPhoto = numMedia > 0 && !!mediaUrl0
    const gotLocation = latitude != null && longitude != null

    if (gotPhoto) {
      const { bytes, contentType } = await downloadTwilioMedia(
        mediaUrl0!,
        accountSid,
        authToken,
      )
      imageUrl = await uploadReportImage(
        supabase,
        from,
        bytes,
        mediaContentType0 ?? contentType,
      )
    }

    if (gotLocation) {
      lat = latitude
      lng = longitude
    }

    const merged: PendingRow = {
      phone_number: from,
      image_url: imageUrl,
      latitude: lat,
      longitude: lng,
      updated_at: new Date().toISOString(),
    }

    const { error: upsertError } = await supabase
      .from('whatsapp_pending_reports')
      .upsert(merged, { onConflict: 'phone_number' })

    if (upsertError) throw upsertError

    let reply: string

    if (!gotPhoto && !gotLocation) {
      reply =
        'Send a trash photo or share your location pin in WhatsApp to report a hotspot.'
    } else if (isComplete(merged)) {
      try {
        await createReportViaWebhook(merged.latitude!, merged.longitude!, merged.image_url!)
        await supabase
          .from('whatsapp_pending_reports')
          .delete()
          .eq('phone_number', from)
        reply =
          'Report submitted successfully — thank you! Your hotspot is on the Fix Nairobi map.'
      } catch (err) {
        reply =
          'We have your photo and location but could not save the report right now. Please try again in a few minutes.'
        console.error('whatsapp-webhook call failed:', err)
      }
    } else if (merged.image_url && (merged.latitude == null || merged.longitude == null)) {
      reply =
        'Got your photo! Share your location pin in WhatsApp (attach → Location) so we can map this hotspot.'
    } else if (merged.latitude != null && merged.longitude != null && !merged.image_url) {
      reply =
        'Got your location! Send a photo of the trash so we can log the report.'
    } else {
      reply =
        'Thanks — send a trash photo and your location pin when you are ready.'
    }

    await sendWhatsAppReply(from, to, reply, accountSid, authToken)

    return new Response(JSON.stringify({ ok: true, reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('whatsapp-inbound error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Inbound handler failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
