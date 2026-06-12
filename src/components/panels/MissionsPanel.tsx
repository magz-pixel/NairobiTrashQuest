import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import type { Mission, UserMission } from '../../types/database'
import { Card } from '../ui/Card'

const FALLBACK_MISSIONS: Mission[] = [
  { id: 'first-scan', title: 'First Scan', description: 'Report your first trash hotspot', reward_points: 50, target_count: 1, mission_type: 'report', active: true },
  { id: 'zone-defender', title: 'Zone Defender', description: 'Verify 1 cleanup within 50m', reward_points: 100, target_count: 1, mission_type: 'verify', active: true },
  { id: 'heat-hunter', title: 'Heat Hunter', description: 'Log 1 cleanup session', reward_points: 75, target_count: 1, mission_type: 'cleanup_log', active: true },
]

interface MissionsPanelProps {
  open: boolean
  onClose: () => void
}

export function MissionsPanel({ open, onClose }: MissionsPanelProps) {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>(FALLBACK_MISSIONS)
  const [progress, setProgress] = useState<UserMission[]>([])

  useEffect(() => {
    if (!open) return
    supabase
      .from('missions')
      .select('*')
      .eq('active', true)
      .then(({ data }) => {
        if (data && data.length > 0) setMissions(data as Mission[])
      })
    if (!user) return
    supabase
      .from('user_missions')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => setProgress((data ?? []) as UserMission[]))
  }, [open, user])

  const progressFor = (missionId: string) =>
    progress.find((p) => p.mission_id === missionId)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close quests"
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
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lava-hot)]">
                Daily quests
              </p>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Missions
              </h2>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {missions.map((m) => {
                const p = progressFor(m.id)
                const done = !!p?.completed_at
                const pct = p
                  ? Math.min(100, Math.round((p.progress / m.target_count) * 100))
                  : 0
                return (
                  <Card key={m.id} className="border-[var(--border-subtle)] bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">{m.title}</h3>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{m.description}</p>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-[var(--brand-teal)]"
                            style={{ width: `${done ? 100 : pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md bg-[var(--brand-teal)]/15 px-2 py-1 text-xs font-bold text-[var(--brand-teal)]">
                        {done ? 'Done' : `+${m.reward_points} XP`}
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
