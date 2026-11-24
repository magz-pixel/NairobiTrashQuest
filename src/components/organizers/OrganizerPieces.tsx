import { useCallback, useEffect, useState } from 'react'
import { uploadPhoto } from '../../lib/uploads'
import {
  eventReport,
  organizerStats,
  pendingApplications,
  reviewApplication,
  submitEventReport,
  TRUSTED_AFTER,
  type EventReport,
  type OrganizerApplication,
  type OrganizerStats,
} from '../../lib/organizers'
import { PhotoPicker } from '../reports/PhotoPicker'

/* ------------------------------------------------------------ admin queue */

/** Admins: approve or decline organiser applications. */
export function OrganizerApplicationsQueue() {
  const [apps, setApps] = useState<OrganizerApplication[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<string | null>(null)
  const load = useCallback(async () => setApps(await pendingApplications()), [])
  useEffect(() => {
    let cancelled = false
    void pendingApplications().then((a) => !cancelled && setApps(a))
    return () => {
      cancelled = true
    }
  }, [])

  const decide = async (a: OrganizerApplication, approve: boolean) => {
    setMsg(null)
    try {
      await reviewApplication(a.user_id, approve, notes[a.user_id])
      setMsg(`${a.full_name} ${approve ? 'is now a verified organiser.' : 'was declined.'}`)
      void load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save.')
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-[#f5d78e] bg-[#fff8e8] p-5">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#063b32]">Organiser applications ({apps.length})</h2>
      <p className="text-xs text-[#8b6207]">Call or WhatsApp the applicant if unsure. Approved organisers can post cleanups straight away.</p>
      {msg ? <p className="mt-2 text-sm font-bold text-[#087766]">{msg}</p> : null}
      {apps.length === 0 ? <p className="mt-3 text-sm text-[#5d746e]">No applications waiting.</p> : null}
      <ul className="mt-3 space-y-3">
        {apps.map((a) => (
          <li key={a.user_id} className="rounded-xl bg-white p-4 text-sm text-[#12332d]">
            <p className="font-extrabold">
              {a.full_name} · {a.neighbourhood}, {a.city}
            </p>
            <p className="text-xs text-[#5d746e]">
              📞 {a.phone} · applied {new Date(a.created_at).toLocaleDateString()}
            </p>
            <p className="mt-2">{a.motivation}</p>
            {a.experience ? <p className="mt-1 text-[#5d746e]">Experience: {a.experience}</p> : null}
            {a.links ? <p className="mt-1 break-all text-[#0b8c76]">{a.links}</p> : null}
            <input
              value={notes[a.user_id] ?? ''}
              onChange={(e) => setNotes((n) => ({ ...n, [a.user_id]: e.target.value }))}
              placeholder="Note (shown to them if declined)"
              className="fn-field mt-2 py-2 text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => void decide(a, true)} className="rounded-lg bg-[#0b8c76] px-3 py-2 text-xs font-bold text-white">
                Verify organiser
              </button>
              <button type="button" onClick={() => void decide(a, false)} className="rounded-lg border border-[#f2c4bb] bg-white px-3 py-2 text-xs font-bold text-[#a44738]">
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------ document a cleanup */

/** Organiser's proof that the cleanup happened: photos, turnout, haul. Builds their track record. */
export function DocumentCleanup({ eventId, organizerId, onDone }: { eventId: string; organizerId: string; onDone?: () => void }) {
  const [existing, setExisting] = useState<EventReport | null | undefined>(undefined)
  const [before, setBefore] = useState<File | null>(null)
  const [after, setAfter] = useState<File | null>(null)
  const [attendees, setAttendees] = useState('')
  const [bags, setBags] = useState('')
  const [kg, setKg] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void eventReport(eventId).then((r) => !cancelled && setExisting(r))
    return () => {
      cancelled = true
    }
  }, [eventId])

  if (existing === undefined) return null
  if (existing) return <CleanupRecap report={existing} />

  const submit = async () => {
    if (!after || attendees === '') return setMsg('Add an after photo and how many people came.')
    setBusy(true)
    setMsg(null)
    try {
      const afterUp = await uploadPhoto('cleanup-media', '', after)
      if (afterUp.error) throw afterUp.error
      const beforeUp = before ? await uploadPhoto('cleanup-media', '', before) : null
      await submitEventReport({
        event_id: eventId,
        organizer_id: organizerId,
        after_url: afterUp.url,
        before_url: beforeUp && !beforeUp.error ? beforeUp.url : null,
        attendees: Number(attendees),
        bags: bags === '' ? null : Number(bags),
        kg: kg === '' ? null : Number(kg),
        notes: notes.trim() || null,
      })
      setExisting(await eventReport(eventId))
      onDone?.()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 space-y-2 rounded-xl border border-[#cfe9df] bg-[#f8fbf9] p-4">
      <p className="font-extrabold text-[#063b32]">📸 Document this cleanup</p>
      <p className="text-xs text-[#5d746e]">
        Proof builds your organiser record. You need to document a cleanup within 7 days to post your next one.
      </p>
      <p className="text-xs font-bold text-[#36564e]">After photo (required)</p>
      <PhotoPicker hasPhoto={!!after} onPick={setAfter} />
      <p className="text-xs font-bold text-[#36564e]">Before photo (optional)</p>
      <PhotoPicker hasPhoto={!!before} onPick={setBefore} />
      <div className="grid grid-cols-3 gap-2">
        <input type="number" min={0} inputMode="numeric" value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="People" className="fn-field mt-0" />
        <input type="number" min={0} inputMode="numeric" value={bags} onChange={(e) => setBags(e.target.value)} placeholder="Bags" className="fn-field mt-0" />
        <input type="number" min={0} inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="kg" className="fn-field mt-0" />
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={1000} placeholder="How did it go?" className="fn-field" />
      {msg ? <p className="text-sm font-bold text-[#a44738]">{msg}</p> : null}
      <button type="button" disabled={busy} onClick={() => void submit()} className="fn-action fn-action-gold justify-center disabled:opacity-50">
        {busy ? 'Saving…' : 'Publish cleanup results'}
      </button>
    </div>
  )
}

/** Public result of a finished cleanup. */
export function CleanupRecap({ report }: { report: EventReport }) {
  return (
    <div className="mt-4 rounded-xl bg-[#effaf5] p-3 text-[#063b32]">
      <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#0b8c76]">✅ Cleanup done</p>
      <div className={`mt-2 grid gap-2 ${report.before_url ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {report.before_url ? <img src={report.before_url} alt="Before the cleanup" loading="lazy" className="h-28 w-full rounded-lg object-cover" /> : null}
        <img src={report.after_url} alt="After the cleanup" loading="lazy" className="h-28 w-full rounded-lg object-cover" />
      </div>
      <p className="mt-2 text-sm font-bold">
        🙋 {report.attendees} people{report.bags != null ? ` · 🛍️ ${report.bags} bags` : ''}
        {report.kg != null ? ` · ⚖️ ${Number(report.kg)} kg` : ''}
      </p>
      {report.notes ? <p className="mt-1 text-sm text-[#36564e]">{report.notes}</p> : null}
    </div>
  )
}

/* ------------------------------------------------------------ badge + record */

/** "✓ Verified organiser" / "⭐ Trusted organiser" with their public track record. */
export function OrganizerBadge({ organizerId }: { organizerId: string }) {
  const [s, setS] = useState<OrganizerStats | null>(null)
  useEffect(() => {
    let cancelled = false
    void organizerStats(organizerId).then((x) => !cancelled && setS(x))
    return () => {
      cancelled = true
    }
  }, [organizerId])
  if (!s) return null
  const verified = s.organizer_status === 'verified'
  return (
    <div className="mt-3 rounded-xl border border-[#d9e9e4] bg-white px-3 py-2.5 text-sm text-[#12332d]">
      <p className="font-extrabold">
        {s.trusted ? '⭐ Trusted organiser' : verified ? '✓ Verified organiser' : 'Organiser'} · {s.username}
      </p>
      <p className="text-xs text-[#5d746e]">
        {s.cleanups_held} cleanups held · {s.documented} documented
        {s.people_mobilised ? ` · ${s.people_mobilised} people mobilised` : ''}
        {s.kg_collected ? ` · ${s.kg_collected} kg` : ''}
        {!s.trusted && verified ? ` · Trusted after ${TRUSTED_AFTER} documented cleanups` : ''}
      </p>
    </div>
  )
}
