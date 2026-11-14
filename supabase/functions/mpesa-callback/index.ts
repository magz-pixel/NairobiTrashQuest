/**
 * mpesa-callback — Safaricom posts the STK push result here. Deploy with --no-verify-jwt.
 * Success → pledge 'confirmed' (the DB trigger opens the bounty once the target is reached).
 * Failure/cancel → pledge 'failed'.
 * Matching is by CheckoutRequestID, which mpesa-stk-push stored in provider_ref.
 * Safaricom always expects a 200 with ResultCode 0, even if we couldn't match the payment.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const ok = () => new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), { headers: { 'Content-Type': 'application/json' } })

serve(async (req) => {
  try {
    const body = await req.json()
    const cb = body?.Body?.stkCallback
    if (!cb?.CheckoutRequestID) return ok()
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    if (cb.ResultCode === 0) {
      const items: { Name: string; Value?: string | number }[] = cb.CallbackMetadata?.Item ?? []
      const receipt = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value
      const amount = Number(items.find((i) => i.Name === 'Amount')?.Value ?? 0)
      await admin
        .from('bounty_pledges')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          provider_ref: receipt ? `${cb.CheckoutRequestID}|${receipt}` : cb.CheckoutRequestID,
          ...(amount > 0 ? { amount } : {}), // trust what M-Pesa actually collected
        })
        .eq('provider_ref', cb.CheckoutRequestID)
        .eq('status', 'pending')
    } else {
      await admin.from('bounty_pledges').update({ status: 'failed' }).eq('provider_ref', cb.CheckoutRequestID).eq('status', 'pending')
    }
  } catch {
    /* swallow: Safaricom retries are not useful for malformed bodies */
  }
  return ok()
})
