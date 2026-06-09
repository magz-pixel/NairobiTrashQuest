import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { findNearestActiveReport } from '../../lib/geo'
import { verifyClearedImage } from '../../lib/gemini'
import { bumpMissionProgress } from '../../lib/missions'
import { useAuth } from '../../hooks/useAuth'
import type { Report } from '../../types/database'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface ClearTrashModalProps {
  open: boolean
  onClose: () => void
  activeReports: Report[]
  onCleared: () => void
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

export function ClearTrashModal({
  open,
  onClose,
  activeReports,
  onCleared,
}: ClearTrashModalProps) {
  const { user, refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleFileChange = (selected: File | null) => {
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  const handleSubmit = async () => {
    if (!file || !user) return
    setSubmitting(true)
    setStatus('Verifying cleanup…')

    try {
      const position = await getCurrentPosition()
      const nearest = findNearestActiveReport(
        activeReports,
        position.coords.latitude,
        position.coords.longitude,
        50,
      )

      if (!nearest) {
        setStatus('No active hotspot within 50m. Move closer to a marked area.')
        setSubmitting(false)
        return
      }

      const verification = await verifyClearedImage(nearest.image_url, file)
      if (!verification.is_cleared || !verification.matches_location) {
        setStatus(
          'AI could not verify this cleanup. Ensure the after photo shows the same cleared spot.',
        )
        setSubmitting(false)
        return
      }

      const clearedPath = `${user.id}/${nearest.id}-cleared.jpg`
      const { error: uploadError } = await supabase.storage
        .from('report-images')
        .upload(clearedPath, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('report-images')
        .getPublicUrl(clearedPath)

      const { error: updateError } = await supabase
        .from('reports')
        .update({
          status: 'verified_cleared',
          cleared_at: new Date().toISOString(),
          cleared_image_url: urlData.publicUrl,
        })
        .eq('id', nearest.id)

      if (updateError) throw updateError

      await bumpMissionProgress(user.id, 'verify')
      await refreshProfile()
      setStatus(`Cleared! +${Math.max(10, nearest.severity_score * 5)} impact points`)
      onCleared()
      setTimeout(handleClose, 1000)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setPreview(null)
    setFile(null)
    setStatus(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Verify cleared">
      <div className="space-y-3">
        <p className="text-sm text-white/70">
          Upload a photo of the cleaned area. AI will match it to the nearest active hotspot.
        </p>
        {preview ? (
          <img src={preview} alt="Cleared preview" className="aspect-video w-full rounded-lg object-cover" />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/40 text-sm text-white/50">
            After photo required
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload after photo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
        {status && <p className="text-xs text-[var(--neon-clean)]">{status}</p>}
        <Button
          type="button"
          variant="primary"
          className="w-full"
          disabled={!file || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Verifying…' : 'Submit verification'}
        </Button>
      </div>
    </Modal>
  )
}
