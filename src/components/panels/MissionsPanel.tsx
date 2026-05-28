import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../ui/Card'

const MISSIONS = [
  {
    title: 'First Scan',
    desc: 'Report your first trash hotspot',
    reward: '+50 XP',
    done: false,
  },
  {
    title: 'Zone Defender',
    desc: 'Verify 1 cleanup within 50m',
    reward: '+100 XP',
    done: false,
  },
  {
    title: 'Heat Hunter',
    desc: 'Clear a critical (9+) zone',
    reward: 'Ranger badge',
    done: false,
  },
]

interface MissionsPanelProps {
  open: boolean
  onClose: () => void
}

export function MissionsPanel({ open, onClose }: MissionsPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close quests"
            className="absolute inset-0 z-[1100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute right-0 top-0 z-[1200] flex h-full w-full max-w-md flex-col border-l border-[var(--lava-hot)]/20 bg-[var(--bg-charcoal)]/98 shadow-[-8px_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="border-b border-white/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lava-hot)]">
                Daily quests
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                Missions
              </h2>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {MISSIONS.map((m) => (
                <Card key={m.title} className="border-white/10 bg-black/40">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-white">{m.title}</h3>
                      <p className="mt-1 text-sm text-white/60">{m.desc}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-[var(--neon-clean)]/15 px-2 py-1 text-xs font-bold text-[var(--neon-clean)]">
                      {m.reward}
                    </span>
                  </div>
                </Card>
              ))}
              <p className="text-center text-xs text-white/35">
                Complete scans & clears to unlock rewards
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
