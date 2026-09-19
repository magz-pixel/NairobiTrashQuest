import { useState } from 'react'
import { AuthGate } from '../components/auth/AuthGate'
import { OpsFrame } from '../components/site/PagePrimitives'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useFundLedger } from '../hooks/useFundLedger'
import { useCity } from '../lib/CityContext'
import { formatCityMoney } from '../lib/cities'
import { isSupabaseConfigured } from '../lib/supabase'

function LedgerManageInner() {
  const { profile, signOut, loading } = useAuth()
  const city = useCity()
  const money = (n: number) => formatCityMoney(n, city)
  const { entries, addEntry, voidEntry, usingLocal, refetch } = useFundLedger(city.slug)
  const [kind, setKind] = useState<'donation' | 'expense'>('donation')
  const [amount, setAmount] = useState('')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isAdmin = Boolean(profile?.is_admin) || usingLocal

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount_kes = Number(amount)
    if (!name.trim() || !amount_kes || amount_kes <= 0) {
      setStatus('Enter a valid name and amount.')
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      await addEntry({
        kind,
        amount_kes,
        donor_or_payee: name.trim(),
        note: note.trim() || undefined,
      })
      setAmount('')
      setName('')
      setNote('')
      setStatus('Saved to ledger.')
      await refetch()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-[#5d746e]">Checking admin access…</p>
  }

  if (!isAdmin && !usingLocal) {
    return (
      <div className="fn-warn">
        <p className="font-semibold">Admin access required</p>
        <p className="mt-2">
          Your profile needs <code>is_admin = true</code> in
          Supabase to edit the shared ledger. Ask Arnold to flag your account, or use local
          seed mode until migration 006 is applied.
        </p>
        <button
          type="button"
          className="mt-4 text-sm font-bold underline"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {usingLocal && (
        <p className="fn-warn">
          Local ledger mode (browser only). Run{' '}
          <code>supabase/migrations/006_fund_ledger.sql</code> for the shared live ledger.
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#063b32]">
          Log entry
        </h2>
        <div className="flex gap-2">
          {(['donation', 'expense'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`fn-chip-btn capitalize ${kind === k ? 'is-on' : ''}`}
            >
              {k}
            </button>
          ))}
        </div>
        <label className="fn-label">
          Amount ({city.currency.code})
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="fn-field"
            required
          />
        </label>
        <label className="fn-label">
          Donor / payee
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="fn-field"
            required
          />
        </label>
        <label className="fn-label">
          Note
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="fn-field"
            placeholder="Optional"
          />
        </label>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Saving…' : 'Add to ledger'}
        </Button>
        {status && <p className="text-sm font-semibold text-[#0b8c76]">{status}</p>}
      </form>

      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#063b32]">
          All entries
        </h2>
        <ul className="mt-3 divide-y divide-[#e5efeb] border-t border-[#e5efeb]">
          {entries.map((e) => (
            <li
              key={e.id}
              className={`flex flex-wrap items-center justify-between gap-2 py-3 ${
                e.voided ? 'opacity-40' : ''
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-[#063b32]">
                  {e.kind} · {e.donor_or_payee} · {money(Number(e.amount_kes))}
                </p>
                <p className="text-xs text-[#71867f]">{e.note}</p>
              </div>
              {!e.voided && (
                <button
                  type="button"
                  className="text-xs font-bold text-[#8b6207] hover:underline"
                  onClick={() => void voidEntry(e.id)}
                >
                  Void
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <button type="button" className="text-sm font-bold text-[#0b8c76] underline" onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  )
}

export function FundsManagePage() {
  return (
    <OpsFrame
      title="Team ledger console"
      eyebrow="Public money"
      description="Sign in to log donations and expenses. Admins only on the shared Supabase ledger."
      backTo="/funds"
    >
      {!isSupabaseConfigured ? (
        <LedgerManageInner />
      ) : (
        <AuthGate>
          <LedgerManageInner />
        </AuthGate>
      )}
    </OpsFrame>
  )
}
