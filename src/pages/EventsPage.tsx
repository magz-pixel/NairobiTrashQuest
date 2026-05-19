import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Event } from '../types/database'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

interface EventsPageProps {
  onBack: () => void
}

export function EventsPage({ onBack }: EventsPageProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .then(({ data }) => {
        setEvents((data ?? []) as Event[])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-deep)] p-4 text-[var(--text-sharp)]">
      <div className="mx-auto max-w-lg">
        <Button type="button" variant="ghost" onClick={onBack} className="mb-4">
          ← Back to map
        </Button>
        <h1 className="mb-2 text-2xl font-bold">Cleanup events</h1>
        <p className="mb-6 text-sm text-white/60">
          Join community cleanups across Nairobi.
        </p>
        {loading ? (
          <p className="text-sm text-white/50">Loading events…</p>
        ) : events.length === 0 ? (
          <Card>
            <p className="text-sm text-white/70">No upcoming events yet.</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id}>
                <Card>
                  <h2 className="font-semibold text-[var(--neon-clean)]">
                    {event.title}
                  </h2>
                  <p className="mt-1 text-xs text-white/50">
                    {new Date(event.event_date).toLocaleString()} · {event.location}
                  </p>
                  <p className="mt-2 text-sm text-white/80">{event.description}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
