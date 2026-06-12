import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
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

  useEffect(() => {
    if (!open) return
    supabase
      .from('reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPending((data ?? []) as Report[])
        setLoading(false)
      })
  }, [open])

  if (!profile?.is_admin) return null

  const approve = async (id: string) => {
    await supabase.rpc('approve_report', { report_uuid: id })
    setPending((p) => p.filter((r) => r.id !== id))
    onReviewed()
  }

  const reject = async (id: string) => {
    await supabase.rpc('reject_report', { report_uuid: id, reason: 'Does not meet guidelines' })
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
              {loading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
              {pending.map((r) => (
                <div key={r.id} className="rounded-xl border border-[var(--border-subtle)] bg-gray-50 p-3">
                  <img src={r.image_url} alt="" className="mb-2 aspect-video w-full rounded-lg object-cover" />
                  <p className="text-xs text-[var(--text-muted)]">
                    Severity {r.severity_score} · {r.area_name ?? 'Unknown'}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button type="button" className="flex-1" onClick={() => approve(r.id)}>
                      Approve
                    </Button>
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => reject(r.id)}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
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
