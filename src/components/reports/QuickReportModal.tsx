import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { assignWard } from '../../lib/wards'
import { getSessionId } from '../../lib/session'
import { uploadReportImage, analyzeTrashImage } from '../../lib/gemini'
import type { TrashAnalysis } from '../../types/database'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface QuickReportModalProps {
  open: boolean
  onClose: () => void
  onReported: () => void
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
    })
  })
}

const AUTO_APPROVE = import.meta.env.VITE_AUTO_APPROVE_REPORTS !== 'false'

export function QuickReportModal({ open, onClose, onReported }: QuickReportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [severity, setSeverity] = useState(5)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setFile(null)
    setPreview(null)
    setSeverity(5)
    setStatus(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    if (!file) return
    setSubmitting(true)
    setStatus('Getting location…')

    try {
      const position = await getCurrentPosition()
      const reportId = crypto.randomUUID()

      setStatus('Analyzing photo…')
      let analysis: TrashAnalysis = {
        is_trash: true,
        severity,
        tags: ['citizen-report'],
        moderation_action: 'approve',
      }
      try {
        analysis = await analyzeTrashImage(file)
      } catch {
        /* proceed with manual severity if AI unavailable */
      }

      if (analysis.moderation_action === 'reject' || analysis.is_trash === false) {
        setStatus('Photo could not be verified as trash. Please retake at the hotspot.')
        setSubmitting(false)
        return
      }

      const imageUrl = await uploadReportImage('anonymous', reportId, file)
      const ward = assignWard(position.coords.latitude, position.coords.longitude)

      const autoLive =
        AUTO_APPROVE && analysis.moderation_action !== 'review'
      const nextStatus = autoLive ? 'active' : 'pending'

      setStatus('Submitting…')
      const { error } = await supabase.from('reports').insert({
        id: reportId,
        user_id: null,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        severity_score: analysis.severity ?? severity,
        status: nextStatus,
        image_url: imageUrl,
        ai_tags: analysis.tags,
        is_anonymous: true,
        reporter_session: getSessionId(),
        ward_id: ward?.wardId ?? null,
        area_name: ward?.areaName ?? null,
        waste_type: analysis.tags[0] ?? 'Mixed waste',
        approved_at: autoLive ? new Date().toISOString() : null,
        moderation_note:
          analysis.moderation_action === 'review' ? 'Queued for human review' : null,
      })

      if (error) throw error

      setStatus(
        nextStatus === 'pending'
          ? 'Submitted! Pending review before it appears on the map.'
          : 'Report live on the map. Thank you!',
      )
      onReported()
      setTimeout(handleClose, 900)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Report trash (30 sec)">
      <p className="mb-3 text-sm text-white/60">
        No login needed. Photo + location only.
      </p>
      {preview ? (
        <img src={preview} alt="Preview" className="mb-3 aspect-video w-full rounded-lg object-cover" />
      ) : (
        <div className="mb-3 flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/40 text-sm text-white/50">
          Take or upload a photo
        </div>
      )}
      <Button type="button" variant="ghost" className="mb-3" onClick={() => fileRef.current?.click()}>
        {file ? 'Change photo' : 'Add photo'}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          setFile(f)
          setPreview(URL.createObjectURL(f))
        }}
      />
      <div className="mb-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 flex justify-between text-xs">
          <span className="text-white/60">Intensity</span>
          <span className="font-bold text-[var(--neon-clean)]">{severity}/10</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={severity}
          onChange={(e) => setSeverity(Number(e.target.value))}
          className="w-full accent-[var(--neon-clean)]"
        />
      </div>
      {status && <p className="mb-2 text-xs text-[var(--neon-clean)]">{status}</p>}
      <Button type="button" className="w-full" disabled={!file || submitting} onClick={handleSubmit}>
        {submitting ? 'Submitting…' : 'Submit report'}
      </Button>
    </Modal>
  )
}
