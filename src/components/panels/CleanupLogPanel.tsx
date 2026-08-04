import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { uploadCleanupMedia } from '../../lib/uploads'
import { bumpMissionProgress } from '../../lib/missions'
import { SignInButton } from '../auth/SignInButton'
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

      let latitude: number | null = null
      let longitude: number | null = null
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
        )
        latitude = pos.coords.latitude
        longitude = pos.coords.longitude
      } catch {
        /* optional GPS */
      }

      const { error } = await supabase.from('cleanup_logs').insert({
        user_id: user.id,
        hours: toNumber(hours),
        kg: toNumber(kg),
        eco_multiplier: eco,
        location_text: locationText || null,
        latitude,
        longitude,
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
      })
      if (error) throw error

      await bumpMissionProgress(user.id, 'cleanup_log')

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
            className="absolute inset-0 z-[1100] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute z-[1200] flex w-full flex-col border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[0_-20px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl max-md:inset-x-0 max-md:bottom-0 max-md:h-[92dvh] max-md:rounded-t-2xl max-md:border-t md:right-0 md:top-0 md:h-full md:max-w-md md:rounded-none md:border-l md:shadow-[-8px_0_40px_rgba(0,0,0,0.5)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="border-b border-[var(--border-subtle)] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-teal)]">
                Cleanup log
              </p>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Earn tokens
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Tokens are calculated by a standard formula.
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {!user ? (
                <Card className="bg-gray-50">
                  <p className="mb-3 text-sm text-[var(--text-primary)]">Sign in to log cleanups.</p>
                  <SignInButton />
                </Card>
              ) : (
                <>
                  <Card className="bg-gray-50">
                    <p className="text-xs text-[var(--text-muted)]">Estimated tokens</p>
                    <p className="text-4xl font-extrabold text-[var(--brand-teal)]">
                      {previewPoints}
                    </p>
                    <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                      Hours×10 + KG×5 + Eco×20 (Eco is 0–5)
                    </p>
                    <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                      Photo uploads use the Supabase Storage bucket{' '}
                      <span className="font-semibold">cleanup-media</span>.
                    </p>
                  </Card>

                  <Card className="bg-gray-50">
                    <label className="block text-xs text-[var(--text-muted)]">Hours spent</label>
                    <input
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      inputMode="decimal"
                      className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-gray-50 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-teal)]/60"
                    />

                    <label className="mt-3 block text-xs text-[var(--text-muted)]">KG collected</label>
                    <input
                      value={kg}
                      onChange={(e) => setKg(e.target.value)}
                      inputMode="decimal"
                      className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-gray-50 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-teal)]/60"
                    />

                    <label className="mt-3 block text-xs text-[var(--text-muted)]">Ecological impact</label>
                    <div className="mt-2 grid grid-cols-6 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEco(i)}
                          className={`rounded-lg border px-2 py-2 text-xs font-bold ${
                            eco === i
                              ? 'border-[var(--brand-teal)]/60 bg-[var(--brand-teal)]/15 text-[var(--brand-teal)]'
                              : 'border-[var(--border-subtle)] bg-white/5 text-[var(--text-muted)] hover:border-white/30'
                          }`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>

                    <label className="mt-3 block text-xs text-[var(--text-muted)]">Location (optional)</label>
                    <input
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      placeholder="e.g. Gikomba market entrance"
                      className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-gray-50 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-teal)]/60"
                    />
                  </Card>

                  <Card className="bg-gray-50">
                    <p className="text-xs text-[var(--text-muted)]">Before/After photos (optional)</p>
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
                    <div className="mt-2 text-[10px] text-[var(--text-muted)]">
                      {beforeFile ? `Before: ${beforeFile.name}` : 'Before: none'} ·{' '}
                      {afterFile ? `After: ${afterFile.name}` : 'After: none'}
                    </div>
                  </Card>
                </>
              )}
            </div>

            <div className="border-t border-[var(--border-subtle)] p-4">
              {status && (
                <p className="mb-2 text-xs text-[var(--brand-teal)]">{status}</p>
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

