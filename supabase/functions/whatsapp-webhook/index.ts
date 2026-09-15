import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** MVP webhook: accept JSON { latitude, longitude, image_url, severity? } from WhatsApp automation. */
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

  try {
    const webhookSecret = Deno.env.get('WHATSAPP_WEBHOOK_SECRET')
    if (webhookSecret && req.headers.get('x-webhook-secret') !== webhookSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { latitude, longitude, image_url, severity } = body

    if (!latitude || !longitude || !image_url) {
      return new Response(JSON.stringify({ error: 'latitude, longitude, image_url required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const autoApprove = Deno.env.get('AUTO_APPROVE_REPORTS') !== 'false'
    const reportId = crypto.randomUUID()

    const { error } = await supabase.from('reports').insert({
      id: reportId,
      user_id: null,
      latitude,
      longitude,
      severity_score: severity ?? 5,
      status: autoApprove ? 'active' : 'pending',
      image_url,
      ai_tags: ['whatsapp', 'citizen-report'],
      is_anonymous: true,
      reporter_session: 'whatsapp',
      waste_type: 'Mixed waste',
      approved_at: autoApprove ? new Date().toISOString() : null,
      moderation_note: 'Submitted via WhatsApp webhook',
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ ok: true, report_id: reportId, status: autoApprove ? 'active' : 'pending' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Webhook failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
