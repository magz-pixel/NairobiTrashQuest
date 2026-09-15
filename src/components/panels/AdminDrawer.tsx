import { AnimatePresence, motion } from 'framer-motion'
import { exportReportsCsv, exportReportsGeoJson, publicStatsUrl, t } from '../../lib/i18n'
import type { Report } from '../../types/database'
import { Button } from '../ui/Button'

interface AdminDrawerProps {
  open: boolean
  onClose: () => void
  reports: Report[]
  onOpenModeration: () => void
  onOpenAnalytics: () => void
}

export function AdminDrawer({
  open,
  onClose,
  reports,
  onOpenModeration,
  onOpenAnalytics,
}: AdminDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close admin"
            className="fixed inset-0 z-[1400] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[1500] flex h-full w-full max-w-sm flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
          >
            <div className="border-b border-[var(--border-subtle)] p-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Admin tools</h2>
              <p className="text-sm text-[var(--text-muted)]">Moderation, analytics, and data export</p>
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
              <Button type="button" className="w-full justify-center" onClick={() => { onClose(); onOpenModeration() }}>
                Moderation queue
              </Button>
              <Button type="button" variant="ghost" className="w-full justify-center" onClick={() => { onClose(); onOpenAnalytics() }}>
                {t('analytics')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-center"
                onClick={() => exportReportsCsv(reports)}
              >
                {t('dataExport')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-center"
                onClick={() => exportReportsGeoJson(reports)}
              >
                {t('geoExport')}
              </Button>
              {publicStatsUrl() && (
                <a
                  href={publicStatsUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-center text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--brand-teal)]"
                >
                  {t('publicApi')}
                </a>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
