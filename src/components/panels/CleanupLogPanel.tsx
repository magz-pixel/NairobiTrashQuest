import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { uploadCleanupMedia } from '../../lib/uploads'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface CleanupLogPanelProps {
  open: boolean
  onClose: () => void
  onLogged?: () => void
}

function toNumber(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function CleanupLogPanel({
  open,
  onClose,
  onLogged,
}: CleanupLogPanelProps) {
  const { user } = useAuth()
  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)

  const [hours, setHours] = useState('1')
  const [kg, setKg] = useState('3')
  const [eco, setEco] = useState(1)
  const [locationText, setLocationText] = useState('')
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const previewPoints = useMemo(() => {
    return Math.max(
      0,
      Math.round(toNumber(hours) * 10 + toNumber(kg) * 5 + eco * 20),
    )
  }, [eco, hours, kg])

  const handleSubmit = async () => {
    if (!user) {
      setStatus('Sign in required.')
      return
    }
    setSubmitting(true)
    setStatus('Saving log…')

    try {
      let beforeUrl: string | null = null
      let afterUrl: string | null = null

      const baseId = crypto.randomUUID()
      if (beforeFile) {
        setStatus('Uploading before photo…')
        beforeUrl = await uploadCleanupMedia(user.id, `${baseId}-before`, beforeFile)
      }
      if (afterFile) {
        setStatus('Uploading after photo…')
        afterUrl = await uploadCleanupMedia(user.id, `${baseId}-after`, afterFile)
      }

      setStatus('Writing cleanup log…')
      const { error } = await supabase.from('cleanup_logs').insert({
        user_id: user.id,
        hours: toNumber(hours),
        kg: toNumber(kg),
        eco_multiplier: eco,
        location_text: locationText || null,
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
      })
      if (error) throw error

      setStatus('Logged! Tokens awarded.')
      onLogged?.()
      setTimeout(() => {
        setStatus(null)
        onClose()
      }, 700)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to save log')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close cleanup log"
            className="absolute inset-0 z-[1100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute z-[1200] flex w-full flex-col border-white/10 bg-[var(--bg-charcoal)]/98 shadow-[0_-20px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl max-md:inset-x-0 max-md:bottom-0 max-md:h-[92dvh] max-md:rounded-t-2xl max-md:border-t md:right-0 md:top-0 md:h-full md:max-w-md md:rounded-none md:border-l md:shadow-[-8px_0_40px_rgba(0,0,0,0.5)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="border-b border-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--neon-clean)]">
                Cleanup log
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                Earn tokens
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Tokens are calculated by a standard formula.
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {!user ? (
                <Card className="bg-black/40">
                  <p className="text-sm text-white/70">Sign in to log cleanups.</p>
                </Card>
              ) : (
                <>
                  <Card className="bg-black/40">
                    <p className="text-xs text-white/50">Estimated tokens</p>
                    <p className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-[var(--neon-clean)]">
                      {previewPoints}
                    </p>
                    <p className="mt-2 text-[10px] text-white/40">
                      Hours×10 + KG×5 + Eco×20 (Eco is 0–5)
                    </p>
                  </Card>

                  <Card className="bg-black/40">
                    <label className="block text-xs text-white/60">Hours spent</label>
                    <input
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      inputMode="decimal"
                      className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--neon-clean)]/60"
                    />

                    <label className="mt-3 block text-xs text-white/60">KG collected</label>
                    <input
                      value={kg}
                      onChange={(e) => setKg(e.target.value)}
                      inputMode="decimal"
                      className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--neon-clean)]/60"
                    />

                    <label className="mt-3 block text-xs text-white/60">Ecological impact</label>
                    <div className="mt-2 grid grid-cols-6 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEco(i)}
                          className={`rounded-lg border px-2 py-2 text-xs font-bold ${
                            eco === i
                              ? 'border-[var(--neon-clean)]/60 bg-[var(--neon-clean)]/15 text-[var(--neon-clean)]'
                              : 'border-white/15 bg-white/5 text-white/60 hover:border-white/30'
                          }`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>

                    <label className="mt-3 block text-xs text-white/60">Location (optional)</label>
                    <input
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      placeholder="e.g. Gikomba market entrance"
                      className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--neon-clean)]/60"
                    />
                  </Card>

                  <Card className="bg-black/40">
                    <p className="text-xs text-white/60">Before/After photos (optional)</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => beforeInputRef.current?.click()}
                      >
                        Upload before
                      </Button>
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => afterInputRef.current?.click()}
                      >
                        Upload after
                      </Button>
                      <input
                        ref={beforeInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
                      />
                      <input
                        ref={afterInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <div className="mt-2 text-[10px] text-white/45">
                      {beforeFile ? `Before: ${beforeFile.name}` : 'Before: none'} ·{' '}
                      {afterFile ? `After: ${afterFile.name}` : 'After: none'}
                    </div>
                  </Card>
                </>
              )}
            </div>

            <div className="border-t border-white/10 p-4">
              {status && (
                <p className="mb-2 text-xs text-[var(--neon-clean)]">{status}</p>
              )}
              <Button
                type="button"
                className="w-full"
                disabled={!user || submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Saving…' : 'Log cleanup'}
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

