import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthGate } from '../components/auth/AuthGate'
import { SiteFooter, SiteNav } from '../components/site/SiteNav'
import { useAuth } from '../hooks/useAuth'
import {
  clearLocalRaceHotspot,
  loadLocalRaceHotspots,
} from '../lib/raceHotspots'
import { loadLocalRaceRegistrations, RACE_TEAM_PRESETS } from '../lib/raceRegistration'
import {
  addLocalRaceWeight,
  loadLocalRaceWeights,
  WASTE_CATEGORIES,
} from '../lib/raceWeights'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import {
  AMAZING_TRASH_RACE_S2,
  type RaceHotspot,
  type RaceWeightLog,
  type WasteCategory,
} from '../types/database'

function MarshalInner() {
  const { user, profile } = useAuth()
  const [teamName, setTeamName] = useState<string>(RACE_TEAM_PRESETS[0])
  const [kg, setKg] = useState('')
  const [category, setCategory] = useState<WasteCategory>('mixed')
  const [hotspotId, setHotspotId] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [logs, setLogs] = useState<RaceWeightLog[]>([])
  const [activeHotspots, setActiveHotspots] = useState<RaceHotspot[]>([])
  const [usingLocal, setUsingLocal] = useState(false)
  const [teamOptions, setTeamOptions] = useState<string[]>([...RACE_TEAM_PRESETS])

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUsingLocal(true)
      setLogs(loadLocalRaceWeights())
      setActiveHotspots(loadLocalRaceHotspots().filter((h) => h.status === 'active'))
      const regs = loadLocalRaceRegistrations()
      const fromRegs = [
        ...new Set(regs.map((r) => r.team_name?.trim()).filter(Boolean) as string[]),
      ]
      setTeamOptions([...new Set([...RACE_TEAM_PRESETS, ...fromRegs])])
      return
    }
    const [{ data: weights, error }, { data: regs }, { data: hotspots, error: hotErr }] =
      await Promise.all([
        supabase
          .from('race_weight_logs')
          .select('*')
          .eq('event_slug', AMAZING_TRASH_RACE_S2)
          .order('created_at', { ascending: false })
          .limit(40),
        supabase
          .from('race_registrations')
          .select('team_name')
          .eq('event_slug', AMAZING_TRASH_RACE_S2),
        supabase
          .from('race_hotspots')
          .select('*')
          .eq('event_slug', AMAZING_TRASH_RACE_S2)
          .eq('status', 'active')
          .order('label', { ascending: true }),
      ])
    if (error || hotErr) {
      setUsingLocal(true)
      setLogs(loadLocalRaceWeights())
      setActiveHotspots(loadLocalRaceHotspots().filter((h) => h.status === 'active'))
      return
    }
    setUsingLocal(false)
    setLogs((weights ?? []) as RaceWeightLog[])
    setActiveHotspots((hotspots ?? []) as RaceHotspot[])
    const fromRegs = [
      ...new Set(
        ((regs ?? []) as { team_name: string | null }[])
          .map((r) => r.team_name?.trim())
          .filter(Boolean) as string[],
      ),
    ]
    setTeamOptions([...new Set([...RACE_TEAM_PRESETS, ...fromRegs])])
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh()
    }, 0)
    return () => window.clearTimeout(t)
  }, [refresh])

  const canWrite = Boolean(profile?.is_admin) || usingLocal || !isSupabaseConfigured

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(kg)
    if (!teamName.trim() || !amount || amount <= 0) {
      setStatus('Enter team and a positive kg amount.')
      return
    }
    if (!canWrite) {
      setStatus('Admin access required to log weights.')
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const selectedHotspot = hotspotId
        ? activeHotspots.find((h) => h.id === hotspotId)
        : null

      if (usingLocal || !isSupabaseConfigured) {
        if (hotspotId) {
          const cleared = clearLocalRaceHotspot(hotspotId, teamName)
          if (!cleared.ok) {
            throw new Error(
              cleared.reason === 'already_cleared'
                ? 'That hotspot was already cleared by another team.'
                : 'Hotspot not found.',
            )
          }
        }
        addLocalRaceWeight({
          team_name: teamName,
          kg: amount,
          waste_category: category,
          logged_by: user?.id ?? null,
        })
        setStatus(
          selectedHotspot
            ? `Logged (local) and cleared “${selectedHotspot.label}”.`
            : 'Logged (local).',
        )
        setKg('')
        setHotspotId('')
        await refresh()
        return
      }

      // Clear first with status=active guard — prevents double-clear / double-award.
      if (hotspotId) {
        const { data: cleared, error: clearErr } = await supabase
          .from('race_hotspots')
          .update({
            status: 'cleared',
            cleared_by_team_name: teamName.trim(),
            cleared_at: new Date().toISOString(),
          })
          .eq('id', hotspotId)
          .eq('status', 'active')
          .select('id')
          .maybeSingle()

        if (clearErr) throw new Error(clearErr.message)
        if (!cleared) {
          throw new Error('That hotspot was already cleared by another team.')
        }
      }

      const { error } = await supabase.from('race_weight_logs').insert({
        event_slug: AMAZING_TRASH_RACE_S2,
        team_name: teamName.trim(),
        kg: amount,
        waste_category: category,
        logged_by: user?.id ?? null,
      })
      if (error) throw new Error(error.message)

      setStatus(
        selectedHotspot
          ? `Logged and cleared “${selectedHotspot.label}” (${selectedHotspot.point_value} pts).`
          : 'Logged to live leaderboard.',
      )
      setKg('')
      setHotspotId('')
      await refresh()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  if (!canWrite && isSupabaseConfigured) {
    return (
      <p className="rounded-xl border border-amber-400/30 p-4 text-sm text-amber-100">
        Sign in as an admin to log marshal weights.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {usingLocal && (
        <p className="text-xs text-amber-200">
          Local weight/hotspot log — run migrations 008 + 014 for shared data.
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
          Log checkpoint weight
        </h2>
        <label className="block text-xs text-teal-200/80">
          Squad
          <select
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#0a1a17] px-3 py-2.5 text-white"
          >
            {teamOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-teal-200/80">
          Kilograms
          <input
            type="number"
            min="0.1"
            step="0.1"
            required
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#0a1a17] px-3 py-2.5 text-white"
          />
        </label>
        <label className="block text-xs text-teal-200/80">
          Waste category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as WasteCategory)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#0a1a17] px-3 py-2.5 text-white"
          >
            {WASTE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-teal-200/80">
          Hotspot cleared (optional)
          <select
            value={hotspotId}
            onChange={(e) => setHotspotId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-[#0a1a17] px-3 py-2.5 text-white"
          >
            <option value="">None — weight only</option>
            {activeHotspots.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label} · {h.point_value} pts
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Add to leaderboard'}
        </button>
        {status && <p className="text-sm text-[#2dd4bf]">{status}</p>}
      </form>

      <div>
        <h3 className="text-sm font-semibold text-white">Recent logs</h3>
        <ul className="mt-2 divide-y divide-white/10 border-t border-white/10 text-sm">
          {logs.map((l) => (
            <li key={l.id} className="flex justify-between gap-2 py-2 text-teal-100/80">
              <span>
                {l.team_name} · {l.waste_category}
              </span>
              <strong className="text-orange-300">{Number(l.kg).toFixed(1)} kg</strong>
            </li>
          ))}
          {logs.length === 0 && <li className="py-3 text-teal-100/50">No weights yet.</li>}
        </ul>
      </div>
    </div>
  )
}

export function RaceMarshalPage() {
  return (
    <div className="fn-landing min-h-full bg-[#071613] text-[#e8f5f1]">
      <SiteNav />
      <main className="mx-auto max-w-lg px-4 py-12 md:px-6">
        <Link to="/race/leaderboard" className="text-sm text-teal-300 hover:text-white">
          ← Leaderboard
        </Link>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
          Marshal checkpoint
        </h1>
        <p className="mt-2 text-sm text-teal-100/70">
          Log verified waste weight by squad and clear race hotspots. Feeds the Season 2 live
          leaderboard.
        </p>
        <div className="mt-8">
          {!isSupabaseConfigured ? (
            <MarshalInner />
          ) : (
            <AuthGate>
              <MarshalInner />
            </AuthGate>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
