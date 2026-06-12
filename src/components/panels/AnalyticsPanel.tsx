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
            className="fixed inset-0 z-[1100] bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed z-[1200] flex w-full flex-col border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-xl max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[85dvh] max-md:rounded-t-2xl max-md:border-t md:right-0 md:top-0 md:h-full md:max-w-md md:border-l"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
          >
            <div className="border-b border-[var(--border-subtle)] p-5">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                City stats
              </h2>
              <p className="text-sm text-[var(--text-muted)]">Pollution resolution overview</p>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-red-950/40 p-3 text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.active}</p>
                  <p className="text-[10px] uppercase text-[var(--text-muted)]">Unresolved</p>
                </div>
                <div className="rounded-xl bg-green-950/40 p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
                  <p className="text-[10px] uppercase text-[var(--text-muted)]">Resolved</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.resolutionRate}%</p>
                  <p className="text-[10px] uppercase text-[var(--text-muted)]">Rate</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Worst areas (unresolved)
                </p>
                <ul className="space-y-2">
                  {stats.worstAreas.map((w, i) => (
                    <li
                      key={w.area}
                      className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-gray-50 px-3 py-2"
                    >
                      <span className="text-sm text-[var(--text-primary)]">
                        {i + 1}. {w.area}
                      </span>
                      <span className="font-bold text-red-400">{w.count}</span>
                    </li>
                  ))}
                  {stats.worstAreas.length === 0 && (
                    <li className="text-sm text-[var(--text-muted)]">No active hotspots yet.</li>
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
