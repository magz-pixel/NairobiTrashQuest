import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: subs, error } = await supabase
      .from('digest_subscribers')
      .select('email')
      .limit(500)

    if (error) throw error

    const { data: reports } = await supabase
      .from('reports')
      .select('status, area_name')
      .in('status', ['active', 'verified_cleared'])

    const active = reports?.filter((r) => r.status === 'active').length ?? 0
    const resolved = reports?.filter((r) => r.status === 'verified_cleared').length ?? 0

    const subject = 'Nairobi Trash Locator — Monday cleanup digest'
    const body = `This week on the map: ${active} unresolved hotspots, ${resolved} verified cleanups.\n\nOpen the map: https://nairobi-trash-quest.vercel.app\n\nData licensed CC-BY.`

    let sent = 0
    if (resendKey && subs?.length) {
      for (const sub of subs) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Nairobi Trash Locator <digest@ntr.local>',
            to: sub.email,
            subject,
            text: body,
          }),
        })
        if (res.ok) sent++
      }
    }

    return new Response(
      JSON.stringify({
        subscribers: subs?.length ?? 0,
        emails_sent: sent,
        preview: body,
        note: resendKey ? 'Digest sent via Resend' : 'Set RESEND_API_KEY to send emails',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Digest failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
