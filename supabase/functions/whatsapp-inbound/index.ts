import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

/**
 * Report a trash spot over WhatsApp (Twilio). People send a photo and a location pin, in either
 * order; once both arrive the spot goes on the map.
 *
 * Abuse controls:
 *   - Only requests signed by Twilio are accepted (X-Twilio-Signature).
 *   - Blocked numbers (public.whatsapp_blocked_numbers) are ignored silently.
 *   - Per number: 40 messages/hour (beyond that we stop replying, so spam can't run up Twilio costs)
 *     and 5 reports/day.
 *   - Photos must be images ≤ 5 MB. Locations must be inside a city we cover.
 *   - Every photo is checked by the same AI moderation as the app: clear trash goes live,
 *     unsure goes to the admin review queue, non-trash/unsafe is rejected.
 *   - Half-finished reports expire after 2 hours. Phone numbers are never stored on reports:
 *     only a one-way hash, in a private table.
 *
 * Secrets (Dashboard → Edge Functions → Secrets): TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 *   TWILIO_WEBHOOK_URL (the exact URL set in Twilio, e.g. https://<project>.supabase.co/functions/v1/whatsapp-inbound)
 * Deploy with: supabase functions deploy whatsapp-inbound --no-verify-jwt
 * Needs migrations 016, 029 and 030.
 */

const MSG_PER_HOUR = 40
const REPORTS_PER_DAY = 5
const PENDING_TTL_MS = 2 * 60 * 60 * 1000
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const APP_URL = 'https://ramani-taka.co.ke'

/** Cities we cover (keep in sync with src/lib/cities.ts). */
const CITIES = [
  { slug: 'nairobi', name: 'Nairobi', lat: -1.286389, lng: 36.817223 },
  { slug: 'kampala', name: 'Kampala', lat: 0.3476, lng: 32.5825 },
  { slug: 'dar-es-salaam', name: 'Dar es Salaam', lat: -6.7924, lng: 39.2083 },
]
const CITY_RADIUS_DEG = 0.6 // ≈ 65 km

interface PendingRow {
  phone_number: string
  image_url: string | null
  latitude: number | null
  longitude: number | null
  updated_at: string
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const twilioBasicAuth = (sid: string, token: string) => 'Basic ' + btoa(`${sid}:${token}`)

function parseCoordinate(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : null
}

function cityFor(lat: number, lng: number) {
  return CITIES.find((c) => Math.abs(c.lat - lat) < CITY_RADIUS_DEG && Math.abs(c.lng - lng) < CITY_RADIUS_DEG) ?? null
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

/** base64(HMAC-SHA1(authToken, url + sorted key/value pairs)), compared in constant time. */
async function validTwilioSignature(req: Request, form: URLSearchParams, authToken: string): Promise<boolean> {
  const given = req.headers.get('X-Twilio-Signature')
  if (!given) return false
  const url = Deno.env.get('TWILIO_WEBHOOK_URL') || req.url
  const keys = [...new Set(form.keys())].sort()
  const data = url + keys.map((k) => k + (form.get(k) ?? '')).join('')
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const expected = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)))))
  if (expected.length !== given.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i)
  return diff === 0
}

async function sendReply(to: string, from: string, body: string, sid: string, token: string) {
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: twilioBasicAuth(sid, token), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  })
  if (!res.ok) console.error('Twilio reply failed', res.status, await res.text())
}

type Verdict = { action: 'approve' | 'review' | 'reject'; severity: number; tags: string[]; note: string }

/** Same AI moderation the app uses. If the check is unavailable, the report waits for an admin. */
async function moderate(bytes: Uint8Array, mimeType: string): Promise<Verdict> {
  try {
    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/analyze-trash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
      body: JSON.stringify({ imageBase64: toBase64(bytes), mimeType }),
    })
    const r = await res.json()
    if (!res.ok || !r?.moderation_action) throw new Error(r?.error ?? `HTTP ${res.status}`)
    return {
      action: r.moderation_action,
      severity: Math.max(1, Math.min(10, Math.round(Number(r.severity) || 5))),
      tags: Array.isArray(r.tags) ? r.tags.slice(0, 6) : [],
      note: String(r.moderation_note ?? ''),
    }
  } catch (err) {
    console.error('moderation unavailable', err)
    return { action: 'review', severity: 5, tags: [], note: 'AI check unavailable' }
  }
}

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const sid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const token = Deno.env.get('TWILIO_AUTH_TOKEN')
  if (!sid || !token) return json({ error: 'Twilio is not configured' }, 500)

  const form = new URLSearchParams(await req.text())
  if (!(await validTwilioSignature(req, form, token))) return json({ error: 'Invalid signature' }, 403)

  const from = form.get('From')?.trim() ?? ''
  const to = form.get('To')?.trim() ?? ''
  if (!from || !to) return json({ error: 'Missing From/To' }, 400)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const phoneHash = await sha256(`rt-wa:${from}`)
  const reply = (text: string) => sendReply(from, to, text, sid, token)

  try {
    // Blocked numbers: ignore silently (no reply = no cost).
    const { data: blocked } = await db.from('whatsapp_blocked_numbers').select('phone_hash').eq('phone_hash', phoneHash).maybeSingle()
    if (blocked) return json({ ok: true, ignored: 'blocked' })

    // Message flood: stop replying.
    const { data: underMsgLimit } = await db.rpc('rate_limit_hit', { p_bucket: 'wa-msg', p_key: phoneHash, p_max: MSG_PER_HOUR, p_window_seconds: 3600 })
    if (underMsgLimit === false) return json({ ok: true, ignored: 'rate' })

    const numMedia = Number.parseInt(form.get('NumMedia') ?? '0', 10) || 0
    const mediaUrl = form.get('MediaUrl0')
    const mediaType = form.get('MediaContentType0') ?? ''
    const latitude = parseCoordinate(form.get('Latitude'))
    const longitude = parseCoordinate(form.get('Longitude'))
    const gotPhoto = numMedia > 0 && !!mediaUrl
    const gotLocation = latitude != null && longitude != null

    if (gotPhoto && !mediaType.startsWith('image/')) {
      await reply('Please send a photo (not a video or file) of the trash, then share your location pin.')
      return json({ ok: true })
    }
    if (gotLocation && !cityFor(latitude!, longitude!)) {
      await reply(`That location is outside the cities we cover right now (${CITIES.map((c) => c.name).join(', ')}). Thank you for caring!`)
      return json({ ok: true })
    }

    const { data: existing } = await db.from('whatsapp_pending_reports').select('*').eq('phone_number', phoneHash).maybeSingle()
    const fresh = existing && Date.now() - new Date(existing.updated_at).getTime() < PENDING_TTL_MS
    let imageUrl: string | null = fresh ? existing.image_url : null
    let lat: number | null = fresh ? existing.latitude : null
    let lng: number | null = fresh ? existing.longitude : null
    let bytes: Uint8Array | null = null

    if (gotPhoto) {
      const res = await fetch(mediaUrl!, { headers: { Authorization: twilioBasicAuth(sid, token) } })
      if (!res.ok) throw new Error(`Twilio media download failed (${res.status})`)
      bytes = new Uint8Array(await res.arrayBuffer())
      if (bytes.length > MAX_IMAGE_BYTES) {
        await reply('That photo is too large. Please send a smaller photo.')
        return json({ ok: true })
      }
      const ext = mediaType.includes('png') ? 'png' : mediaType.includes('webp') ? 'webp' : 'jpg'
      const path = `anonymous/whatsapp/${phoneHash.slice(0, 16)}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await db.storage.from('report-images').upload(path, bytes, { contentType: mediaType, upsert: false })
      if (upErr) throw upErr
      imageUrl = db.storage.from('report-images').getPublicUrl(path).data.publicUrl
    }
    if (gotLocation) {
      lat = latitude
      lng = longitude
    }

    // Not complete yet: remember what we have and ask for the rest.
    if (!imageUrl || lat == null || lng == null) {
      await db.from('whatsapp_pending_reports').upsert(
        { phone_number: phoneHash, image_url: imageUrl, latitude: lat, longitude: lng, updated_at: new Date().toISOString() } satisfies PendingRow,
        { onConflict: 'phone_number' },
      )
      await reply(
        imageUrl
          ? 'Got your photo! Now share your location pin (📎 → Location) so we can put this spot on the map.'
          : lat != null
            ? 'Got your location! Now send a photo of the trash.'
            : 'Hi! To report a trash spot: send a photo of it, then share your location pin (📎 → Location).',
      )
      return json({ ok: true })
    }

    // Complete. Daily report limit per number.
    const { data: underDaily } = await db.rpc('rate_limit_hit', { p_bucket: 'wa-report', p_key: phoneHash, p_max: REPORTS_PER_DAY, p_window_seconds: 86400 })
    if (underDaily === false) {
      await db.from('whatsapp_pending_reports').delete().eq('phone_number', phoneHash)
      await reply(`Thank you! You've reported ${REPORTS_PER_DAY} spots today, which is our daily limit. Please send more tomorrow.`)
      return json({ ok: true })
    }

    // Moderate the photo (re-download only if it arrived in an earlier message).
    if (!bytes) {
      const res = await fetch(imageUrl)
      bytes = new Uint8Array(await res.arrayBuffer())
    }
    const verdict = await moderate(bytes, mediaType || 'image/jpeg')
    await db.from('whatsapp_pending_reports').delete().eq('phone_number', phoneHash)

    if (verdict.action === 'reject') {
      await reply("Sorry, we couldn't use that photo. Please send a clear photo of the trash itself, then your location pin.")
      return json({ ok: true, rejected: true })
    }

    const city = cityFor(lat, lng)!
    const live = verdict.action === 'approve'
    const reportId = crypto.randomUUID()
    const { error } = await db.from('reports').insert({
      id: reportId,
      user_id: null,
      latitude: lat,
      longitude: lng,
      severity_score: verdict.severity,
      status: live ? 'active' : 'pending',
      image_url: imageUrl,
      ai_tags: ['whatsapp', ...verdict.tags],
      is_anonymous: true,
      reporter_session: `wa:${phoneHash}`, // moved to a private table by the 029 trigger
      waste_type: ['Mixed'],
      approved_at: live ? new Date().toISOString() : null,
      moderation_note: `WhatsApp · ${verdict.note}`.slice(0, 300),
      city: city.slug,
    })
    if (error) {
      // The 029 limits raise friendly messages; pass them on.
      await reply(error.message?.length < 200 ? error.message : 'We could not save the report right now. Please try again later.')
      return json({ ok: false })
    }

    await reply(
      live
        ? `✅ Thank you! Your spot is on the ${city.name} map: ${APP_URL}/${city.slug}/report/${reportId}`
        : `Thank you! Your report is in. Our team will check it shortly before it appears on the ${city.name} map.`,
    )
    return json({ ok: true, report_id: reportId, live })
  } catch (err) {
    console.error('whatsapp-inbound error:', err)
    await reply('Something went wrong on our side. Please try again in a few minutes.').catch(() => {})
    return json({ error: 'Inbound handler failed' }, 500)
  }
})
