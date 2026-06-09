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
    <div className="pointer-events-auto rounded-lg border border-[var(--neon-clean)]/20 bg-black/70 px-3 py-2 backdrop-blur-md">
      <p className="text-[10px] text-white/55">Join the Monday cleanup digest</p>
      <div className="mt-1 flex gap-1">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="min-w-0 flex-1 rounded border border-white/15 bg-black/40 px-2 py-1 text-xs text-white"
        />
        <button
          type="button"
          onClick={subscribe}
          className="shrink-0 rounded bg-[var(--neon-clean)]/20 px-2 py-1 text-[10px] font-bold text-[var(--neon-clean)]"
        >
          Join
        </button>
      </div>
      {status && <p className="mt-1 text-[10px] text-[var(--neon-clean)]">{status}</p>}
    </div>
  )
}
