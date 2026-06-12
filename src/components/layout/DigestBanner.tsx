import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export function DigestBanner() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const subscribe = async () => {
    if (!email.includes('@')) return
    const { error } = await supabase.from('digest_subscribers').insert({ email })
    if (error) {
      setStatus(error.message.includes('unique') ? 'Already subscribed!' : error.message)
      return
    }
    setStatus('Subscribed to weekly digest.')
    setEmail('')
  }

  return (
    <div className="pointer-events-auto hidden max-w-[200px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 shadow-[var(--shadow-sm)] sm:block">
      <p className="text-[10px] text-[var(--text-muted)]">Monday cleanup digest</p>
      <div className="mt-1 flex gap-1">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="min-w-0 flex-1 rounded border border-[var(--border-subtle)] bg-white px-2 py-1 text-xs text-[var(--text-primary)]"
        />
        <button
          type="button"
          onClick={subscribe}
          className="shrink-0 rounded bg-[var(--brand-teal)] px-2 py-1 text-[10px] font-semibold text-white"
        >
          Join
        </button>
      </div>
      {status && <p className="mt-1 text-[10px] text-[var(--brand-teal)]">{status}</p>}
    </div>
  )
}
