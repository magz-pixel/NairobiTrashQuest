import { useCallback, useEffect, useState } from 'react'
import { AuthGate } from '../components/auth/AuthGate'
import { OpsFrame } from '../components/site/PagePrimitives'
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
  const { user, profile, loading } = useAuth()
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

  if (loading) {
    return <p className="text-sm text-[#5d746e]">Checking admin access…</p>
  }

  if (!canWrite && isSupabaseConfigured) {
    return (
      <p className="fn-warn">
        Sign in as an admin to log marshal weights.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {usingLocal && (
        <p className="text-xs font-semibold text-[#8b6207]">
          Local weight/hotspot log — run migrations 008 + 014 for shared data.
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#063b32]">
          Log checkpoint weight
        </h2>
        <label className="fn-label">
          Squad
          <select
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="fn-field"
          >
            {teamOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="fn-label">
          Kilograms
          <input
            type="number"
            min="0.1"
            step="0.1"
            required
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            className="fn-field"
          />
        </label>
        <label className="fn-label">
          Waste category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as WasteCategory)}
            className="fn-field"
          >
            {WASTE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="fn-label">
          Hotspot cleared (optional)
          <select
            value={hotspotId}
            onChange={(e) => setHotspotId(e.target.value)}
            className="fn-field"
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
          className="fn-action fn-action-gold w-full justify-center disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Add to leaderboard'}
        </button>
        {status && <p className="text-sm font-semibold text-[#0b8c76]">{status}</p>}
      </form>

      <div>
        <h3 className="text-sm font-semibold text-[#063b32]">Recent logs</h3>
        <ul className="mt-2 divide-y divide-[#e5efeb] border-t border-[#e5efeb] text-sm">
          {logs.map((l) => (
            <li key={l.id} className="flex justify-between gap-2 py-2 text-[#36564e]">
              <span>
                {l.team_name} · {l.waste_category}
              </span>
              <strong className="text-[#8b6207]">{Number(l.kg).toFixed(1)} kg</strong>
            </li>
          ))}
          {logs.length === 0 && <li className="py-3 text-[#71867f]">No weights yet.</li>}
        </ul>
      </div>
    </div>
  )
}

export function RaceMarshalPage() {
  return (
    <OpsFrame
      title="Marshal checkpoint"
      eyebrow="Season 2 ops"
      description="Log verified waste weight by squad and clear race hotspots. Feeds the Season 2 live leaderboard."
      backTo="/race/leaderboard"
    >
      {!isSupabaseConfigured ? (
        <MarshalInner />
      ) : (
        <AuthGate>
          <MarshalInner />
        </AuthGate>
      )}
    </OpsFrame>
  )
}
