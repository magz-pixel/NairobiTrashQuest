import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { SignInButton } from '../auth/SignInButton'
import type { Event } from '../../types/database'
import {
  calendarUrl,
  directionsUrl,
  formatEventWhen,
  isHappeningNow,
  relativeDays,
  whatsappShareUrl,
} from '../../lib/events'

interface EventDetailSheetProps {
  event: Event | null
  goingCount?: number
  isGoing: boolean
  signedIn: boolean
  /** Public page for this cleanup, used in share and calendar links. */
  pageUrl: string
  onToggleGoing: (eventId: string) => Promise<string | null>
  onClose: () => void
}

export function EventDetailSheet({
  event,
  goingCount,
  isGoing,
  signedIn,
  pageUrl,
  onToggleGoing,
  onClose,
}: EventDetailSheetProps) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const toggle = async () => {
    if (!event) return
    setBusy(true)
    setMessage(null)
    const error = await onToggleGoing(event.id)
    setBusy(false)
    setMessage(error ?? (isGoing ? 'You’ve left this cleanup.' : 'You’re in! See you there 🧤'))
  }

  const close = () => {
    setMessage(null)
    onClose()
  }

  const directions = event ? directionsUrl(event) : null
  const live = event ? isHappeningNow(event) : false

  return (
    <AnimatePresence>
      {event && (
        <>
          <motion.button
            type="button"
            aria-label="Close cleanup details"
            className="fixed inset-0 z-[1400] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-label={event.title}
            className="fixed inset-x-0 bottom-0 z-[1500] max-h-[88dvh] overflow-y-auto rounded-t-[1.75rem] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(6,59,50,.2)] md:inset-x-auto md:bottom-auto md:right-4 md:top-20 md:w-[26rem] md:rounded-[1.5rem]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#d9e9e4] md:hidden" />
            <div className="flex items-start justify-between gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[.1em] ${
                  live ? 'bg-[#ffe0d8] text-[#a44738]' : 'bg-[#d9f7e9] text-[#087766]'
                }`}
              >
                🧹 Cleanup · {relativeDays(event.event_date)}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full text-[#5d746e] hover:bg-[#f3f7f4]"
              >
                ✕
              </button>
            </div>

            <h2 className="fn-display mt-3 text-2xl font-extrabold leading-tight tracking-[-.02em] text-[#063b32]">
              {event.title}
            </h2>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex gap-3">
                <dt aria-label="When">📅</dt>
                <dd className="font-bold text-[#12332d]">{formatEventWhen(event.event_date)}</dd>
              </div>
              <div className="flex gap-3">
                <dt aria-label="Where">📍</dt>
                <dd className="font-bold text-[#12332d]">{event.location}</dd>
              </div>
              {typeof goingCount === 'number' ? (
                <div className="flex gap-3">
                  <dt aria-label="Going">🙋</dt>
                  <dd className="text-[#36564e]">
                    <strong className="text-[#063b32]">{goingCount}</strong>{' '}
                    {goingCount === 1 ? 'person is' : 'people are'} going
                  </dd>
                </div>
              ) : null}
            </dl>

            {event.description ? (
              <p className="mt-4 rounded-xl bg-[#f3f7f4] p-3.5 text-sm leading-6 text-[#36564e]">{event.description}</p>
            ) : null}

            <div className="mt-5">
              {!signedIn ? (
                <div className="space-y-2">
                  <SignInButton
                    variant="dark"
                    label="Sign in to join →"
                    className="min-h-12 w-full"
                    authTitle="Join this cleanup"
                    authBlurb="Sign in with Google or your email to save your spot."
                  />
                  <p className="text-center text-xs text-[#71867f]">
                    Joining saves your spot and earns XP when the organiser confirms you came.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void toggle()}
                  className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-extrabold transition active:scale-[.98] disabled:opacity-60 ${
                    isGoing ? 'border border-[#cfe1da] bg-white text-[#063b32]' : 'bg-gold-400 text-emerald-950'
                  }`}
                >
                  {busy ? 'Saving…' : isGoing ? '✓ You’re going · tap to leave' : 'I’ll be there →'}
                </button>
              )}
              {message ? <p className="mt-2 text-center text-sm font-bold text-[#087766]">{message}</p> : null}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
              {directions ? (
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-[#d9e9e4] px-2 py-3 text-[#0b8c76] hover:bg-[#f3f7f4]"
                >
                  🧭<br />
                  Directions
                </a>
              ) : (
                <span className="rounded-xl border border-dashed border-[#d9e9e4] px-2 py-3 text-[#9ab0a8]">
                  🧭<br />
                  No pin yet
                </span>
              )}
              <a
                href={calendarUrl(event, pageUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-[#d9e9e4] px-2 py-3 text-[#0b8c76] hover:bg-[#f3f7f4]"
              >
                🗓️<br />
                Add to calendar
              </a>
              <a
                href={whatsappShareUrl(event, pageUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-[#d9e9e4] px-2 py-3 text-[#0b8c76] hover:bg-[#f3f7f4]"
              >
                💬<br />
                Invite friends
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
