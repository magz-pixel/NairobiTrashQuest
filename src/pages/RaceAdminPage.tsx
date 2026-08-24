import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthGate } from '../components/auth/AuthGate'
import { SiteFooter, SiteNav } from '../components/site/SiteNav'
import { useAuth } from '../hooks/useAuth'
import {
  addLocalRaceHotspot,
  deleteLocalRaceHotspot,
  loadLocalRaceHotspots,
  uploadRaceHotspotImage,
} from '../lib/raceHotspots'
import {
  deleteLocalRaceRegistration,
  exportRaceRegistrationsCsv,
  groupRegistrationsByTeam,
  loadLocalRaceRegistrations,
} from '../lib/raceRegistration'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  AMAZING_TRASH_RACE_S2,
  type RaceHotspot,
  type RaceRegistration,
} from '../types/database'

const inputClass =
  'mt-1 w-full rounded-lg border border-white/15 bg-[#0a1a17] px-3 py-2.5 text-white'

function AdminInner() {
  const { user, profile, loading } = useAuth()
  const [rows, setRows] = useState<RaceRegistration[]>([])
  const [hotspots, setHotspots] = useState<RaceHotspot[]>([])
  const [error, setError] = useState<string | null>(null)
  const [usingLocal, setUsingLocal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formStatus, setFormStatus] = useState<string | null>(null)

  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [label, setLabel] = useState('')
  const [pointValue, setPointValue] = useState('250')
  const [isGhost, setIsGhost] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setError(null)
    if (!isSupabaseConfigured) {
      setUsingLocal(true)
      setRows(loadLocalRaceRegistrations())
      setHotspots(loadLocalRaceHotspots())
      return
    }

    const [regsRes, hotRes] = await Promise.all([
      supabase
        .from('race_registrations')
        .select('*')
        .eq('event_slug', AMAZING_TRASH_RACE_S2)
        .order('created_at', { ascending: false }),
      supabase
        .from('race_hotspots')
        .select('*')
        .eq('event_slug', AMAZING_TRASH_RACE_S2)
        .order('created_at', { ascending: false }),
    ])

    if (regsRes.error) {
      setUsingLocal(true)
      setRows(loadLocalRaceRegistrations())
      setHotspots(loadLocalRaceHotspots())
      setError(regsRes.error.message)
      return
    }

    setRows((regsRes.data ?? []) as RaceRegistration[])

    if (hotRes.error) {
      setUsingLocal(true)
      setHotspots(loadLocalRaceHotspots())
      setError(hotRes.error.message)
      return
    }

    setUsingLocal(false)
    setHotspots((hotRes.data ?? []) as RaceHotspot[])
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

  if (loading) {
    return <p className="text-sm text-teal-100/60">Checking admin access…</p>
  }

  if (!profile?.is_admin && !usingLocal) {
    return (
      <p className="rounded-xl border border-amber-400/30 bg-amber-950/40 p-4 text-sm text-amber-100">
        Admin access required. Set <code>profiles.is_admin = true</code> for your user.
      </p>
    )
  }

  const groups = groupRegistrationsByTeam(rows)

  const onAddHotspot = async (e: React.FormEvent) => {
    e.preventDefault()
    const lat = Number(latitude)
    const lng = Number(longitude)
    const points = Number(pointValue)
    if (!label.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || !points || points <= 0) {
      setFormStatus('Enter label, valid GPS, and a positive point value.')
      return
    }
    setBusy(true)
    setFormStatus(null)
    try {
      if (usingLocal || !isSupabaseConfigured) {
        const gallery = photos.map((file) => URL.createObjectURL(file))
        addLocalRaceHotspot({
          latitude: lat,
          longitude: lng,
          label: label.trim(),
          point_value: points,
          is_ghost_spot: isGhost,
          reference_image_url: gallery[0] ?? null,
          gallery_image_urls: gallery,
        })
        setFormStatus('Hotspot saved locally.')
      } else {
        if (!user) throw new Error('Sign in required to upload.')
        const id = crypto.randomUUID()
        const gallery: string[] = []
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i]
          if (!file) continue
          gallery.push(await uploadRaceHotspotImage(user.id, id, file, i))
        }
        const { error: insErr } = await supabase.from('race_hotspots').insert({
          id,
          event_slug: AMAZING_TRASH_RACE_S2,
          latitude: lat,
          longitude: lng,
          label: label.trim(),
          point_value: points,
          is_ghost_spot: isGhost,
          reference_image_url: gallery[0] ?? null,
          gallery_image_urls: gallery,
          status: 'active',
        })
        if (insErr) throw new Error(insErr.message)
        setFormStatus('Hotspot live on the map.')
      }
      setLatitude('')
      setLongitude('')
      setLabel('')
      setPointValue('250')
      setIsGhost(false)
      setPhotos([])
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (err) {
      setFormStatus(err instanceof Error ? err.message : 'Failed to add hotspot')
    } finally {
      setBusy(false)
    }
  }

  const onDeleteRegistration = async (row: RaceRegistration) => {
    const ok = window.confirm(
      `Delete ${row.full_name}'s ticket ${row.ticket_code}? This cannot be undone.`,
    )
    if (!ok) return
    setBusy(true)
    setFormStatus(null)
    try {
      if (usingLocal || !isSupabaseConfigured) {
        deleteLocalRaceRegistration(row.id)
      } else {
        const { error: delErr } = await supabase
          .from('race_registrations')
          .delete()
          .eq('id', row.id)
        if (delErr) throw new Error(delErr.message)
      }
      await load()
    } catch (err) {
      setFormStatus(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  const onDeleteHotspot = async (id: string) => {
    setBusy(true)
    setFormStatus(null)
    try {
      if (usingLocal || !isSupabaseConfigured) {
        deleteLocalRaceHotspot(id)
      } else {
        const { error: delErr } = await supabase.from('race_hotspots').delete().eq('id', id)
        if (delErr) throw new Error(delErr.message)
      }
      await load()
    } catch (err) {
      setFormStatus(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-10">
      {usingLocal && (
        <p className="text-xs text-amber-200">
          Showing local data (run migrations 007 + 014 + 017 for shared registrations/hotspots).
        </p>
      )}
      {error && <p className="text-xs text-amber-200">{error}</p>}

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
          Race hotspots
        </h2>
        <p className="text-sm text-teal-100/70">
          Pre-load GPS pins with point values. Ghost spots look identical on the map — no visual
          tell.
        </p>
        <form
          onSubmit={onAddHotspot}
          className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <label className="block text-xs text-teal-200/80">
            Label
            <input
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={inputClass}
              placeholder="Riverbank stash"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-teal-200/80">
              Latitude
              <input
                required
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-xs text-teal-200/80">
              Longitude
              <input
                required
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <label className="block text-xs text-teal-200/80">
            Point value
            <input
              required
              type="number"
              min={1}
              step={1}
              value={pointValue}
              onChange={(e) => setPointValue(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-teal-200/80">
            <input
              type="checkbox"
              checked={isGhost}
              onChange={(e) => setIsGhost(e.target.checked)}
              className="rounded border-white/20"
            />
            Ghost spot (decoy — same map look as real)
          </label>
          <label className="block text-xs text-teal-200/80">
            Reference photos (optional)
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="mt-1 block min-h-[44px] w-full py-2 text-sm text-teal-100/80"
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
            />
            <span className="mt-1 block text-[11px] text-teal-100/55">
              First photo is the landmark. Extra files are other angles.
              {photos.length > 0 ? ` ${photos.length} selected.` : ''}
            </span>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#2dd4bf] py-3 text-sm font-bold text-[#042f2e] disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Add hotspot'}
          </button>
          {formStatus && <p className="text-sm text-[#2dd4bf]">{formStatus}</p>}
        </form>

        <ul className="divide-y divide-white/10 border-t border-white/10 text-sm">
          {hotspots.map((h) => (
            <li key={h.id} className="flex items-start justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-white">
                  {h.label}{' '}
                  <span className="font-mono text-xs text-orange-300">{h.point_value} pts</span>
                </p>
                <p className="text-xs text-teal-100/60">
                  {h.latitude.toFixed(5)}, {h.longitude.toFixed(5)} · {h.status}
                  {h.is_ghost_spot ? ' · ghost' : ''}
                  {(h.gallery_image_urls?.length ?? 0) > 0
                    ? ` · ${h.gallery_image_urls?.length} photos`
                    : h.reference_image_url
                      ? ' · 1 photo'
                      : ''}
                  {h.cleared_by_team_name ? ` · cleared by ${h.cleared_by_team_name}` : ''}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                className="shrink-0 text-xs text-amber-200 underline disabled:opacity-50"
                onClick={() => void onDeleteHotspot(h.id)}
              >
                Delete
              </button>
            </li>
          ))}
          {hotspots.length === 0 && (
            <li className="py-3 text-teal-100/50">No hotspots yet.</li>
          )}
        </ul>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-3 text-sm">
          <button
            type="button"
            className="rounded-lg bg-[#2dd4bf] px-3 py-2 font-semibold text-[#042f2e]"
            onClick={() => exportRaceRegistrationsCsv(rows)}
          >
            Export CSV
          </button>
          <button type="button" className="text-teal-200 underline" onClick={() => void load()}>
            Refresh
          </button>
          <Link to="/race/marshal" className="text-teal-200 underline">
            Marshal weights
          </Link>
        </div>
        <p className="text-sm text-teal-100/70">
          {rows.length} warriors · {groups.length} squads
        </p>
        {formStatus && <p className="text-sm text-[#2dd4bf]">{formStatus}</p>}
        <ul className="space-y-4">
          {groups.map((g) => (
            <li key={g.team} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
                {g.team}{' '}
                <span className="text-sm font-normal text-teal-300">({g.members.length})</span>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-teal-100/80">
                {g.members.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3">
                    <span>
                      <span className="font-mono text-xs text-[#2dd4bf]">{m.ticket_code}</span>
                      {' · '}
                      {m.full_name}
                      <span className="text-teal-100/50"> · {m.phone}</span>
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      className="shrink-0 text-xs text-amber-200 underline disabled:opacity-50"
                      onClick={() => void onDeleteRegistration(m)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export function RaceAdminPage() {
  return (
    <div className="fn-landing min-h-full bg-[#071613] text-[#e8f5f1]">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-12 md:px-6">
        <Link to="/race" className="text-sm text-teal-300 hover:text-white">
          ← Registration
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
          Race admin · teams & hotspots
        </h1>
        <p className="mt-2 text-sm text-teal-100/70">
          Load Season 2 GPS hotspots and review squad registrations.
        </p>
        <div className="mt-8">
          {!isSupabaseConfigured ? (
            <AdminInner />
          ) : (
            <AuthGate>
              <AdminInner />
            </AuthGate>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
