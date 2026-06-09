import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getSessionId } from '../../lib/session'
import { bumpMissionProgress } from '../../lib/missions'
import { useAuth } from '../../hooks/useAuth'
import {
  assignWard,
  complaintMailto,
  daysSince,
  severityLabel,
} from '../../lib/wards'
import { isDemoReport } from '../../lib/demoReports'
import type { Report } from '../../types/database'
import { Button } from '../ui/Button'

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
  const [officials, setOfficials] = useState<{ name: string; role: string; contact_email: string | null }[]>([])

  useEffect(() => {
    if (!report?.ward_id) {
      setOfficials([])
      return
    }
    supabase
      .from('ward_officials')
      .select('officials(name, role, contact_email)')
      .eq('ward_id', report.ward_id)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as {
          officials: { name: string; role: string; contact_email: string | null } | null
        }[]
        setOfficials(
          rows.map((r) => r.officials).filter((o): o is { name: string; role: string; contact_email: string | null } => !!o),
        )
      })
  }, [report?.ward_id])

  if (!report) return null

  const ward = report.area_name
    ? { areaName: report.area_name, wardId: report.ward_id }
    : assignWard(report.latitude, report.longitude)

  const displaySeen = seenCount || report.seen_count

  const handleSeen = async () => {
    if (isDemoReport(report)) {
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
    if (isDemoReport(report)) {
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

            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                Accountability
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {ward?.areaName ?? 'Nairobi'} ward
              </p>
              {officials.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {officials.map((o) => (
                    <li key={o.name} className="text-xs text-white/60">
                      {o.name} · {o.role}
                      {o.contact_email && (
                        <a href={`mailto:${o.contact_email}`} className="ml-1 text-[var(--neon-clean)]">
                          Contact
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-white/50">NCC Environment · Sub-county admin</p>
              )}
              <a
                href={complaintMailto(ward?.areaName ?? 'Nairobi', report.id)}
                className="mt-2 inline-block text-xs text-[var(--neon-clean)]"
              >
                File a complaint →
              </a>
            </div>

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
