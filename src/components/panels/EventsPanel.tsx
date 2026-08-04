import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import type { Event } from '../../types/database'
import { Card } from '../ui/Card'

const DEMO_EVENTS: Event[] = [
  {
    id: 'demo-ev-1',
    title: 'CBD River Cleanup',
    description: 'Join rangers to clear plastic along the Nairobi River footpath.',
    location: 'CBD, Nairobi',
    latitude: -1.286,
    longitude: 36.817,
    event_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    organizer_id: '00000000-0000-4000-8000-000000000001',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-ev-2',
    title: 'Westlands Park Sweep',
    description: 'Gamified litter hunt — earn double impact points this weekend.',
    location: 'Westlands',
    latitude: -1.265,
    longitude: 36.805,
    event_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    organizer_id: '00000000-0000-4000-8000-000000000001',
    created_at: new Date().toISOString(),
  },
]

interface EventsPanelProps {
  open: boolean
  onClose: () => void
}

export function EventsPanel({ open, onClose }: EventsPanelProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .then(({ data }) => {
        const live = (data ?? []) as Event[]
        setEvents(live.length > 0 ? live : DEMO_EVENTS)
        setLoading(false)
      })
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close events"
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
                Community
              </p>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Cleanup events
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Squad up and reclaim Nairobi block by block. Full list also on{' '}
                <a href="/cleanups" className="font-semibold text-[var(--brand-teal)]">
                  /cleanups
                </a>
                .
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <p className="text-sm text-[var(--text-muted)]">Loading events…</p>
              ) : (
                <ul className="space-y-3">
                  {events.map((event) => (
                    <li key={event.id}>
                      <Card className="border-[var(--brand-teal)]/10 bg-gray-50">
                        <h3 className="font-semibold text-[var(--brand-teal)]">
                          {event.title}
                        </h3>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {new Date(event.event_date).toLocaleString()} ·{' '}
                          {event.location}
                        </p>
                        <p className="mt-2 text-sm text-[var(--text-primary)]/80">
                          {event.description}
                        </p>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
