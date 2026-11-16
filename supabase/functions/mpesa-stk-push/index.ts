/**
 * mpesa-stk-push — sends an M-Pesa "Lipa na M-Pesa Online" (STK push) prompt to the payer's phone
 * for a pending bounty pledge. Safaricom then calls `mpesa-callback`, which confirms the pledge.
 *
 * Setup (once you have a Daraja app: https://developer.safaricom.co.ke):
 *   supabase secrets set MPESA_ENV=sandbox MPESA_CONSUMER_KEY=... MPESA_CONSUMER_SECRET=... \
 *     MPESA_SHORTCODE=174379 MPESA_PASSKEY=... \
 *     MPESA_CALLBACK_TOKEN=<long random string> \n *     MPESA_CALLBACK_URL=https://momkbsgfypjfujkhrtxb.functions.supabase.co/mpesa-callback?token=<same string>
 *   supabase functions deploy mpesa-stk-push
 *   supabase functions deploy mpesa-callback --no-verify-jwt
 * Until those secrets exist this function answers { configured: false } and the app falls back
 * to manual Paybill instructions.
 *
 * Body: { pledgeId: string }  (the pledge must belong to the signed-in caller and be pending)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const env = (k: string) => Deno.env.get(k) ?? ''

/** 07xx / 7xx / +2547xx → 2547xxxxxxxx */
function normalisePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, '')
  const m = d.match(/^(?:254|0)?([17]\d{8})$/)
  return m ? `254${m[1]}` : null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const key = env('MPESA_CONSUMER_KEY')
    if (!key) return json({ configured: false })

    const { pledgeId } = await req.json()
    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
    const auth = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: who } = await admin.auth.getUser(auth)
    if (!who.user) return json({ error: 'Sign in first' }, 401)

    const { data: pledge } = await admin
      .from('bounty_pledges')
      .select('id,user_id,amount,currency,status,payer_phone,method')
      .eq('id', pledgeId)
      .maybeSingle()
    if (!pledge || pledge.user_id !== who.user.id || pledge.status !== 'pending' || pledge.method !== 'mpesa')
      return json({ error: 'Pledge not found' }, 404)
    if (pledge.currency !== 'KES') return json({ error: 'M-Pesa is KES only' }, 400)
    const phone = normalisePhone(pledge.payer_phone ?? '')
    if (!phone) return json({ error: 'Enter a Safaricom number like 0712 345 678' }, 400)

    const base = env('MPESA_ENV') === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'
    const tokenRes = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${btoa(`${key}:${env('MPESA_CONSUMER_SECRET')}`)}` },
    })
    const { access_token } = await tokenRes.json()

    const shortcode = env('MPESA_SHORTCODE')
    const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14) // yyyyMMddHHmmss (UTC; Daraja accepts)
    const password = btoa(`${shortcode}${env('MPESA_PASSKEY')}${timestamp}`)

    const stk = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(Number(pledge.amount)),
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: env('MPESA_CALLBACK_URL'),
        AccountReference: `RT-${pledge.id.slice(0, 8)}`,
        TransactionDesc: 'Ramani-Taka bounty',
      }),
    }).then((r) => r.json())

    if (stk.ResponseCode !== '0') return json({ error: stk.errorMessage ?? stk.ResponseDescription ?? 'M-Pesa declined' }, 502)
    await admin.from('bounty_pledges').update({ provider_ref: stk.CheckoutRequestID }).eq('id', pledge.id)
    return json({ configured: true, checkoutRequestId: stk.CheckoutRequestID })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
