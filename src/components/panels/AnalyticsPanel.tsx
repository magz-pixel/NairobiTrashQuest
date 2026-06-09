import { AnimatePresence, motion } from 'framer-motion'
import type { ReportStats } from '../../types/database'

interface AnalyticsPanelProps {
  open: boolean
  onClose: () => void
  stats: ReportStats
}

export function AnalyticsPanel({ open, onClose, stats }: AnalyticsPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close analytics"
            className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed z-[1200] flex w-full flex-col border-white/10 bg-[var(--bg-charcoal)]/98 backdrop-blur-xl max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[85dvh] max-md:rounded-t-2xl max-md:border-t md:right-0 md:top-0 md:h-full md:max-w-md md:border-l"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
          >
            <div className="border-b border-white/10 p-5">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
                City stats
              </h2>
              <p className="text-sm text-white/50">Pollution resolution overview</p>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-red-950/40 p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.active}</p>
                  <p className="text-[10px] uppercase text-white/45">Unresolved</p>
                </div>
                <div className="rounded-xl bg-green-950/40 p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
                  <p className="text-[10px] uppercase text-white/45">Resolved</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-2xl font-bold text-white">{stats.resolutionRate}%</p>
                  <p className="text-[10px] uppercase text-white/45">Rate</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/45">
                  Worst areas (unresolved)
                </p>
                <ul className="space-y-2">
                  {stats.worstAreas.map((w, i) => (
                    <li
                      key={w.area}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                    >
                      <span className="text-sm text-white">
                        {i + 1}. {w.area}
                      </span>
                      <span className="font-bold text-red-400">{w.count}</span>
                    </li>
                  ))}
                  {stats.worstAreas.length === 0 && (
                    <li className="text-sm text-white/50">No active hotspots yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
