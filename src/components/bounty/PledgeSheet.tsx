import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { createPledge, money, PAYMENT_CONFIG, QUICK_AMOUNTS, startMpesaPush, type BountyProgress, type PayMethod } from '../../lib/bounties'
import { SignInButton } from '../auth/SignInButton'
import { Modal } from '../ui/Modal'

type Step = 'form' | 'mpesa-sent' | 'mpesa-manual' | 'crypto-sent'

/** Pledge to a hotspot bounty: amount → rail (M-Pesa / USDT / USDC) → pending pledge. */
export function PledgeSheet({ bounty, place, open, onClose, onDone }: { bounty: BountyProgress; place: string; open: boolean; onClose: () => void; onDone: () => void }) {
  const { user, profile } = useAuth()
  const quick = QUICK_AMOUNTS[bounty.currency] ?? QUICK_AMOUNTS.KES
  const [amount, setAmount] = useState(quick[1])
  const [method, setMethod] = useState<PayMethod>(bounty.currency === 'KES' ? 'mpesa' : 'usdt')
  const [phone, setPhone] = useState('')
  const [tx, setTx] = useState('')
  const [anon, setAnon] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('form')
  const [ref, setRef] = useState('')

  const remaining = Math.max(0, bounty.target_amount - bounty.raised - bounty.pending)
  const close = () => {
    setStep('form')
    setError(null)
    onClose()
  }

  const submit = async () => {
    if (!user) return
    setError(null)
    if (method === 'mpesa' && !/^(?:\+?254|0)?[17]\d{8}$/.test(phone.replace(/\s/g, ''))) {
      return setError('Enter your Safaricom number, e.g. 0712 345 678')
    }
    setBusy(true)
    try {
      const id = await createPledge({
        bountyId: bounty.id,
        userId: user.id,
        displayName: anon ? null : (profile?.username ?? null),
        amount,
        currency: bounty.currency,
        method,
        phone: method === 'mpesa' ? phone.replace(/\s/g, '') : undefined,
        txHash: method !== 'mpesa' && tx.trim() ? tx.trim() : undefined,
      })
      setRef(`${PAYMENT_CONFIG.mpesa.accountPrefix}-${id.slice(0, 8).toUpperCase()}`)
      if (method === 'mpesa') {
        const pushed = await startMpesaPush(id).catch((e: Error) => {
          setError(e.message)
          return false
        })
        setStep(pushed ? 'mpesa-sent' : 'mpesa-manual')
      } else setStep('crypto-sent')
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your pledge.')
    } finally {
      setBusy(false)
    }
  }

  const tab = (m: PayMethod, label: string, sub: string, disabled = false) => (
    <button
      key={m}
      type="button"
      disabled={disabled}
      onClick={() => setMethod(m)}
      className={`flex-1 rounded-2xl border-2 p-3 text-left disabled:opacity-40 ${method === m ? 'border-[#0b8c76] bg-[#effaf5]' : 'border-[#e5efeb] bg-white'}`}
    >
      <span className="block text-sm font-extrabold text-[#063b32]">{label}</span>
      <span className="block text-[11px] text-[#5d746e]">{sub}</span>
    </button>
  )

  return (
    <Modal open={open} onClose={close} title={`Back the bounty · ${place}`}>
      {!user ? (
        <div className="space-y-3 text-sm text-[#5d746e]">
          <p>Pledges are tied to an account so every shilling is traceable from pledge to payout.</p>
          <SignInButton variant="dark" label="Sign in to pledge" className="w-full" />
        </div>
      ) : step === 'mpesa-sent' ? (
        <Done icon="📲" title="Check your phone" body={`Enter your M-Pesa PIN to send ${money(bounty.currency, amount)}. The bar updates as soon as Safaricom confirms.`} onClose={close} />
      ) : step === 'mpesa-manual' ? (
        <div className="space-y-3 text-sm">
          <Done icon="🧾" title="Pledge saved" body="M-Pesa prompts are switching on soon. Your pledge is recorded as pending." />
          {PAYMENT_CONFIG.mpesa.paybill ? (
            <div className="rounded-2xl bg-[#effaf5] p-4 text-[#063b32]">
              <p className="font-extrabold">Pay now via Paybill</p>
              <p className="mt-1">Business no. <b>{PAYMENT_CONFIG.mpesa.paybill}</b></p>
              <p>Account no. <b>{ref}</b></p>
              <p>Amount <b>{money(bounty.currency, amount)}</b></p>
            </div>
          ) : (
            <p className="rounded-2xl bg-[#fff8e8] p-4 text-[#8b6207]">
              🚧 <b>M-Pesa coming soon.</b> We'll message you to complete payment when it's live. Nothing has been charged. Ref <b>{ref}</b>.
            </p>
          )}
          {error ? <p className="text-xs text-[#a44738]">{error}</p> : null}
          <button type="button" onClick={close} className="w-full rounded-full bg-[#063b32] py-3 font-extrabold text-white">Done</button>
        </div>
      ) : step === 'crypto-sent' ? (
        <Done icon="⛓️" title="Pledge recorded" body={`Test mode: no real crypto is collected yet. Your ${money(bounty.currency, amount)} pledge is pending until the team verifies the transfer. Ref ${ref}.`} onClose={close} />
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#5d746e]">Amount ({bounty.currency})</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {quick.map((a) => (
                <button key={a} type="button" onClick={() => setAmount(a)} className={`rounded-xl py-2.5 text-sm font-extrabold ${amount === a ? 'bg-[#063b32] text-white' : 'bg-[#f3f7f4] text-[#063b32]'}`}>
                  {a.toLocaleString()}
                </button>
              ))}
            </div>
            <input type="number" inputMode="numeric" min={10} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} className="fn-field" aria-label="Custom amount" />
            {remaining > 0 ? (
              <button type="button" onClick={() => setAmount(remaining)} className="mt-1 text-xs font-bold text-[#0b8c76] underline">
                Close the gap: {money(bounty.currency, remaining)}
              </button>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#5d746e]">Pay with</p>
            <div className="mt-2 flex gap-2">
              {tab('mpesa', 'M-Pesa', 'Prompt to your phone', bounty.currency !== 'KES')}
              {tab('usdt', 'USDT', 'Test mode')}
              {tab('usdc', 'USDC', 'Test mode')}
            </div>
          </div>

          {method === 'mpesa' ? (
            <label className="block">
              <span className="fn-label">Safaricom number</span>
              <input type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} className="fn-field" />
            </label>
          ) : (
            <div className="space-y-2 rounded-2xl border border-dashed border-[#f5d78e] bg-[#fff8e8] p-3 text-xs text-[#8b6207]">
              <p className="font-extrabold">🧪 Test mode: do not send real funds</p>
              <p>Network: {PAYMENT_CONFIG.crypto.network}</p>
              <p className="break-all font-mono">{method === 'usdt' ? PAYMENT_CONFIG.crypto.usdtAddress : PAYMENT_CONFIG.crypto.usdcAddress}</p>
              <input value={tx} onChange={(e) => setTx(e.target.value)} placeholder="Transaction hash (optional)" className="fn-field mt-0 font-mono text-xs" />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-[#5d746e]">
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} /> Show me as "A neighbour"
          </label>

          {error ? <p className="text-sm font-bold text-[#a44738]">{error}</p> : null}
          <button type="button" disabled={busy || amount < 10} onClick={() => void submit()} className="w-full rounded-full bg-[#fbbf24] py-3.5 text-base font-extrabold text-[#063b32] disabled:opacity-50">
            {busy ? 'Saving…' : method === 'mpesa' ? `Pledge ${money(bounty.currency, amount)} with M-Pesa` : `Pledge ${money(bounty.currency, amount)}`}
          </button>
          <p className="text-center text-[11px] text-[#5d746e]">
            Money is held by Ramani-Taka and released only when a verified crew cleans the spot. Refunded if the bounty is cancelled.
          </p>
        </div>
      )}
    </Modal>
  )
}

function Done({ icon, title, body, onClose }: { icon: string; title: string; body: string; onClose?: () => void }) {
  return (
    <div className="text-center">
      <p className="text-5xl">{icon}</p>
      <p className="mt-3 text-xl font-extrabold text-[#063b32]">{title}</p>
      <p className="mt-2 text-sm text-[#5d746e]">{body}</p>
      {onClose ? (
        <button type="button" onClick={onClose} className="mt-5 w-full rounded-full bg-[#063b32] py-3 font-extrabold text-white">
          Done
        </button>
      ) : null}
    </div>
  )
}
