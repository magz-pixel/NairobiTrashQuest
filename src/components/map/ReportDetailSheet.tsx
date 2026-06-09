import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getSessionId } from '../../lib/session'
import { bumpMissionProgress } from '../../lib/missions'
import { useAuth } from '../../hooks/useAuth'
import { assignWard, daysSince, severityLabel } from '../../lib/wards'
import { isDemoReport } from '../../lib/demoReports'
import type { Report } from '../../types/database'
import { Button } from '../ui/Button'
import { AccountabilityFlow } from './AccountabilityFlow'

interface ReportDetailSheetProps {
  report: Report | null
  onClose: () => void
  onVerify?: () => void
  onUpdated?: () => void
  userLoggedIn?: boolean
}

export function ReportDetailSheet({
  report,
  onClose,
  onVerify,
  onUpdated,
  userLoggedIn,
}: ReportDetailSheetProps) {
  const { user } = useAuth()
  const [status, setStatus] = useState<string | null>(null)
  const [seenCount, setSeenCount] = useState(0)

  if (!report) return null

  const demo = isDemoReport(report)
  const ward = report.area_name
    ? { areaName: report.area_name, wardId: report.ward_id }
    : assignWard(report.latitude, report.longitude)

  const displaySeen = seenCount || report.seen_count

  const handleSeen = async () => {
    if (demo) {
      setSeenCount((c) => c + 1)
      setStatus('Thanks — marked as seen.')
      return
    }
    const sessionId = getSessionId()
    const { error } = await supabase.from('report_corroborations').insert({
      report_id: report.id,
      session_id: sessionId,
    })
    if (error) {
      setStatus(error.message.includes('unique') ? 'You already marked this.' : error.message)
      return
    }
    setSeenCount((c) => c + 1)
    setStatus('Thanks — marked as seen.')
    if (user) await bumpMissionProgress(user.id, 'corroborate')
    onUpdated?.()
  }

  const handleFlag = async () => {
    if (demo) {
      setStatus('Flag recorded (demo).')
      return
    }
    const { error } = await supabase.from('report_flags').insert({
      report_id: report.id,
      session_id: getSessionId(),
      reason: 'User flagged as incorrect',
    })
    if (error) {
      setStatus(error.message)
      return
    }
    setStatus('Report flagged for review.')
    onUpdated?.()
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`

  return (
    <AnimatePresence>
      {report && (
        <>
          <motion.button
            type="button"
            aria-label="Close detail"
            className="fixed inset-0 z-[1400] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[1500] max-h-[88dvh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[var(--bg-charcoal)] p-4 md:inset-x-auto md:right-4 md:top-4 md:max-w-md md:rounded-xl md:border"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-bold uppercase text-red-400">
                  {severityLabel(report.severity_score)}
                </span>
                <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase text-white/60">
                  {report.status.replace('_', ' ')}
                </span>
                {demo && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                    Demo
                  </span>
                )}
              </div>
              <button type="button" onClick={onClose} className="text-white/50">
                ✕
              </button>
            </div>

            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
              {ward?.areaName ?? 'Hotspot'}
            </h2>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs text-[var(--neon-clean)]"
            >
              Get directions →
            </a>

            <img
              src={report.image_url}
              alt="Report evidence"
              className="mt-3 aspect-video w-full rounded-xl object-cover"
            />

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-black/40 p-2">
                <p className="font-bold text-white">1</p>
                <p className="text-[10px] text-white/45">Reports</p>
              </div>
              <div className="rounded-lg bg-black/40 p-2">
                <p className="font-bold text-white">{daysSince(report.created_at)}</p>
                <p className="text-[10px] text-white/45">Days</p>
              </div>
              <div className="rounded-lg bg-black/40 p-2">
                <p className="truncate text-xs font-bold text-white">
                  {report.waste_type ?? 'Mixed'}
                </p>
                <p className="text-[10px] text-white/45">Waste type</p>
              </div>
            </div>

            <AccountabilityFlow
              wardId={ward?.wardId ?? report.ward_id}
              areaName={ward?.areaName ?? 'Nairobi'}
              reportId={report.id}
              isDemo={demo}
            />

            {status && <p className="mt-2 text-xs text-[var(--neon-clean)]">{status}</p>}

            <div className="mt-4 flex flex-col gap-2">
              <Button type="button" variant="ghost" onClick={handleSeen}>
                👍 I've seen this ({displaySeen})
              </Button>
              {userLoggedIn && onVerify && (
                <Button type="button" onClick={onVerify}>
                  ✓ Verify cleanup
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={handleFlag}>
                ⚑ Flag as incorrect
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
