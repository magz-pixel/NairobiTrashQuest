import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { isCleanupUnderReview, PENDING_CLEANUP_NOTE } from '../../lib/cleanupReview'
import type { Report } from '../../types/database'
import { Button } from '../ui/Button'

interface AdminReviewPanelProps {
  open: boolean
  onClose: () => void
  onReviewed: () => void
}

export function AdminReviewPanel({ open, onClose, onReviewed }: AdminReviewPanelProps) {
  const { profile } = useAuth()
  const [pending, setPending] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    void Promise.all([
      supabase
        .from('reports')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('reports')
        .select('*')
        .eq('moderation_note', PENDING_CLEANUP_NOTE)
        .in('status', ['active', 'flagged'])
        .not('cleared_image_url', 'is', null)
        .order('cleared_at', { ascending: false }),
    ]).then(([newReports, cleanupReviews]) => {
      const rows = [
        ...((cleanupReviews.data ?? []) as Report[]),
        ...((newReports.data ?? []) as Report[]),
      ]
      const seen = new Set<string>()
      setPending(rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true))))
      setLoading(false)
    })
  }, [open])

  if (!profile?.is_admin) return null

  const approve = async (id: string) => {
    setActionError(null)
    const { error } = await supabase.rpc('approve_report', { report_uuid: id })
    if (error) {
      setActionError(error.message)
      return
    }
    setPending((p) => p.filter((r) => r.id !== id))
    onReviewed()
  }

  const reject = async (id: string) => {
    setActionError(null)
    const { error } = await supabase.rpc('reject_report', {
      report_uuid: id,
      reason: 'Does not meet guidelines',
    })
    if (error) {
      setActionError(error.message)
      return
    }
    setPending((p) => p.filter((r) => r.id !== id))
    onReviewed()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-[1100] bg-black/30"
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[1200] flex h-full w-full max-w-md flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-surface)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
          >
            <div className="border-b border-[var(--border-subtle)] p-4">
              <h2 className="font-bold text-[var(--text-primary)]">Moderation queue</h2>
              <p className="text-xs text-[var(--text-muted)]">{pending.length} pending</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {actionError && (
                <p className="text-xs text-[var(--brand-teal)]">{actionError}</p>
              )}
              {loading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
              {pending.map((r) => {
                const cleanupReview = isCleanupUnderReview(r)
                return (
                <div key={r.id} className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-canvas p-3">
                  {cleanupReview ? (
                    <div className="mb-2 grid grid-cols-2 gap-2">
                      <figure>
                        <img src={r.image_url} alt="Before cleanup" className="aspect-video w-full rounded-lg object-cover" />
                        <figcaption className="mt-1 text-[10px] text-[var(--text-muted)]">Before</figcaption>
                      </figure>
                      <figure>
                        <img src={r.cleared_image_url!} alt="After cleanup" className="aspect-video w-full rounded-lg object-cover" />
                        <figcaption className="mt-1 text-[10px] text-[var(--text-muted)]">After</figcaption>
                      </figure>
                    </div>
                  ) : (
                    <img src={r.image_url} alt="" className="mb-2 aspect-video w-full rounded-lg object-cover" />
                  )}
                  <p className="text-xs text-[var(--text-muted)]">
                    {cleanupReview
                      ? 'Cleanup awaiting verification'
                      : `Severity ${r.severity_score}`}
                    {' · '}
                    {r.area_name ?? 'Unknown'}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button type="button" className="flex-1" onClick={() => approve(r.id)}>
                      {cleanupReview ? 'Approve cleanup' : 'Approve'}
                    </Button>
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => reject(r.id)}>
                      {cleanupReview ? 'Send back' : 'Reject'}
                    </Button>
                  </div>
                </div>
                )
              })}
              {!loading && pending.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">Queue empty.</p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
