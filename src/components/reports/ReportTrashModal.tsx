import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { analyzeTrashImage, uploadReportImage } from '../../lib/gemini'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface ReportTrashModalProps {
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

export function ReportTrashModal({
  open,
  onClose,
  onReported,
}: ReportTrashModalProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })
    streamRef.current = stream
    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    }
    setCameraOn(true)
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const captured = new File([blob], 'report.jpg', { type: 'image/jpeg' })
      setFile(captured)
      setPreview(URL.createObjectURL(captured))
      stopCamera()
    }, 'image/jpeg', 0.9)
  }

  const handleFileChange = (selected: File | null) => {
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    stopCamera()
  }

  const handleSubmit = async () => {
    if (!file || !user) return
    setSubmitting(true)
    setStatus('Analyzing with AI…')

    try {
      const analysis = await analyzeTrashImage(file)
      if (!analysis.is_trash) {
        setStatus('No significant trash detected. Try another angle.')
        setSubmitting(false)
        return
      }

      setStatus('Getting location…')
      const position = await getCurrentPosition()
      const reportId = crypto.randomUUID()
      const imageUrl = await uploadReportImage(user.id, reportId, file)

      setStatus('Saving report…')
      const { error } = await supabase.from('reports').insert({
        id: reportId,
        user_id: user.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        severity_score: Math.min(10, Math.max(1, Math.round(analysis.severity))),
        status: 'active',
        image_url: imageUrl,
        ai_tags: analysis.tags,
      })

      if (error) throw error

      setStatus('Hotspot added to the map!')
      onReported()
      setTimeout(() => {
        handleClose()
      }, 800)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    stopCamera()
    setPreview(null)
    setFile(null)
    setStatus(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Report trash">
      <div className="space-y-3">
        {cameraOn ? (
          <video ref={videoRef} className="aspect-video w-full rounded-lg bg-black" muted playsInline />
        ) : preview ? (
          <img src={preview} alt="Preview" className="aspect-video w-full rounded-lg object-cover" />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/40 text-sm text-white/50">
            Capture or upload a photo
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!cameraOn && (
            <Button type="button" variant="ghost" onClick={startCamera}>
              Open camera
            </Button>
          )}
          {cameraOn && (
            <Button type="button" onClick={capturePhoto}>
              Capture
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </div>

        {status && <p className="text-xs text-[var(--neon-clean)]">{status}</p>}

        <Button
          type="button"
          className="w-full"
          disabled={!file || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Processing…' : 'Submit report'}
        </Button>
      </div>
    </Modal>
  )
}
