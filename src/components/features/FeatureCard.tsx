import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { SignInButton } from '../auth/SignInButton'
import { useAuth } from '../../hooks/useAuth'
import { addFeatureUpdate, STATUS_OPTIONS, statusMeta, type MapFeature } from '../../lib/mapFeatures'
import { daysSince } from '../../lib/wards'

/** Tap a bin or tree: its condition, details, and a one-tap check-in to update it. */
export function FeatureCard({
  feature,
  onClose,
  onUpdated,
}: {
  feature: MapFeature | null
  onClose: () => void
  onUpdated: () => void
}) {
  const { user } = useAuth()
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const checkIn = async (status: string) => {
    if (!feature || !user) return
    setBusy(status)
    setMessage(null)
    const error = await addFeatureUpdate(feature.id, status, user.id)
    setBusy(null)
    if (error) {
      setMessage(error)
      return
    }
    setMessage('Thanks! Updated for everyone.')
    onUpdated()
  }

  return (
    <AnimatePresence>
      {feature ? (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-[1400] bg-black/25 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setMessage(null)
              onClose()
            }}
          />
          <motion.aside
            role="dialog"
            aria-label={feature.kind === 'tree' ? 'Tree' : 'Bin'}
            className="fixed inset-x-0 bottom-0 z-[1500] max-h-[80dvh] overflow-y-auto rounded-t-[1.75rem] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(6,59,50,.2)] md:inset-x-auto md:bottom-auto md:right-4 md:top-20 md:w-[22rem] md:rounded-[1.5rem]"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#0b8c76]">
                  {feature.kind === 'tree' ? (feature.origin === 'planted' ? 'Planted tree' : 'Tree') : 'Public bin'}
                </p>
                <h2 className="fn-display mt-1 text-2xl font-extrabold text-[#063b32]">
                  {statusMeta(feature.kind, feature.status).emoji} {statusMeta(feature.kind, feature.status).label}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMessage(null)
                  onClose()
                }}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full text-[#5d746e] hover:bg-[#f3f7f4]"
              >
                ✕
              </button>
            </div>

            {feature.image_url ? <img src={feature.image_url} alt="" className="mt-3 aspect-video w-full rounded-xl object-cover" /> : null}

            <dl className="mt-3 space-y-1 text-sm text-[#36564e]">
              {feature.species ? (
                <div>
                  <dt className="inline font-bold">Species: </dt>
                  <dd className="inline">{feature.species}</dd>
                </div>
              ) : null}
              {feature.planted_on ? (
                <div>
                  <dt className="inline font-bold">Planted: </dt>
                  <dd className="inline">{new Date(feature.planted_on).toLocaleDateString()}</dd>
                </div>
              ) : null}
              <div>
                <dt className="inline font-bold">Last updated: </dt>
                <dd className="inline">{daysSince(feature.updated_at) === 0 ? 'today' : `${daysSince(feature.updated_at)} days ago`}</dd>
              </div>
              {feature.note ? <p className="rounded-lg bg-[#f3f7f4] p-2">{feature.note}</p> : null}
            </dl>

            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[.16em] text-[#6a827b]">
              {feature.kind === 'tree' ? 'How is it doing today?' : 'What does it look like today?'}
            </p>
            {user ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {STATUS_OPTIONS[feature.kind].map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    disabled={!!busy}
                    onClick={() => void checkIn(o.value)}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 text-sm font-bold ${
                      feature.status === o.value ? 'border-[#0b8c76] bg-[#d9f7e9] text-[#087766]' : 'border-[#d9e9e4] text-[#36564e]'
                    }`}
                  >
                    {busy === o.value ? '…' : o.emoji} {o.label}
                  </button>
                ))}
              </div>
            ) : (
              <SignInButton variant="dark" label="Sign in to update" className="mt-2 w-full" />
            )}
            {message ? <p className="mt-3 text-sm font-bold text-[#087766]">{message}</p> : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
