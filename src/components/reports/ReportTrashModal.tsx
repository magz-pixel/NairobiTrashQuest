import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { analyzeTrashImage, uploadReportImage } from '../../lib/gemini'
import {
  GPS_ACCURACY_LIMIT_M,
  getPositionWithAccuracyRetry,
  isGpsAccuracyAcceptable,
} from '../../lib/geo'
import { compressImageFile } from '../../lib/uploads'
import { assignWard } from '../../lib/wards'
import { nearestActiveReport } from '../../lib/nearbyReports'
import { bumpMissionProgress } from '../../lib/missions'
import { useAuth } from '../../hooks/useAuth'
import type { Report, TrashAnalysis } from '../../types/database'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { NearbyReportPrompt } from './NearbyReportPrompt'

interface ReportTrashModalProps {
  open: boolean
  onClose: () => void
  onReported: () => void
  activeReports?: Report[]
  onViewExistingReport?: (report: Report) => void
}

interface PreparedReport {
  compressed: File
  analysis: TrashAnalysis
  aiNote: string | null
  position: GeolocationPosition
}

const FALLBACK_ANALYSIS = (severity: number): TrashAnalysis => ({
  is_trash: true,
  severity,
  tags: ['unclassified'],
})

export function ReportTrashModal({
  open,
  onClose,
  onReported,
  activeReports = [],
  onViewExistingReport,
}: ReportTrashModalProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [manualSeverity, setManualSeverity] = useState(5)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [nearbyDuplicate, setNearbyDuplicate] = useState<Report | null>(null)
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false)
  const [gpsWarning, setGpsWarning] = useState<PreparedReport | null>(null)
  const preparedRef = useRef<PreparedReport | null>(null)
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
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const captured = new File([blob], 'report.jpg', { type: 'image/jpeg' })
        setFile(captured)
        setPreview(URL.createObjectURL(captured))
        stopCamera()
      },
      'image/jpeg',
      0.9,
    )
  }

  const handleFileChange = (selected: File | null) => {
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    stopCamera()
  }

  const finishInsert = async (prepared: PreparedReport) => {
    if (!user) return

    const { compressed, analysis, aiNote, position } = prepared
    const severity = Math.min(
      10,
      Math.max(1, Math.round(manualSeverity || analysis.severity)),
    )

    const reportId = crypto.randomUUID()
    setStatus('Uploading photo…')
    const imageUrl = await uploadReportImage(user.id, reportId, compressed)
    const ward = assignWard(position.coords.latitude, position.coords.longitude)

    setStatus(aiNote ? `Saving report… (${aiNote})` : 'Saving report…')
    const { error } = await supabase.from('reports').insert({
      id: reportId,
      user_id: user.id,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      severity_score: severity,
      status: 'active',
      image_url: imageUrl,
      ai_tags: analysis.tags,
      ward_id: ward?.wardId ?? null,
      area_name: ward?.areaName ?? null,
      waste_type: analysis.tags[0] ?? 'Mixed waste',
    })

    if (error) throw error

    await bumpMissionProgress(user.id, 'report')

    setStatus(
      aiNote
        ? `Hotspot added (AI tagging skipped — ${aiNote}).`
        : 'Hotspot added to the map!',
    )
    onReported()
    setTimeout(() => {
      handleClose()
    }, 800)
  }

  const continueWithPosition = async (
    prepared: Omit<PreparedReport, 'position'> & { position: GeolocationPosition },
    forceDuplicate: boolean,
  ) => {
    if (!forceDuplicate && !skipDuplicateCheck) {
      const nearby = nearestActiveReport(
        activeReports,
        prepared.position.coords.latitude,
        prepared.position.coords.longitude,
      )
      if (nearby) {
        preparedRef.current = prepared
        setNearbyDuplicate(nearby)
        setGpsWarning(null)
        setSubmitting(false)
        setStatus(null)
        return
      }
    }

    setGpsWarning(null)
    await finishInsert(prepared)
  }

  const submitReport = async (forceDuplicate = false) => {
    if (!file || !user) return
    setSubmitting(true)
    setStatus('Compressing photo…')
    setGpsWarning(null)

    try {
      // Resume after duplicate prompt with already-prepared payload
      if (forceDuplicate && preparedRef.current) {
        await continueWithPosition(preparedRef.current, true)
        return
      }

      const compressed = await compressImageFile(file)
      setStatus('Getting location & analyzing…')

      const [position, analysisOutcome] = await Promise.all([
        getPositionWithAccuracyRetry(),
        analyzeTrashImage(compressed)
          .then((analysis) => ({ ok: true as const, analysis }))
          .catch(() => ({
            ok: false as const,
            analysis: FALLBACK_ANALYSIS(manualSeverity),
          })),
      ])

      const analysis = analysisOutcome.analysis
      const aiNote = analysisOutcome.ok ? null : 'AI tagging unavailable on this connection'

      if (analysisOutcome.ok && !analysis.is_trash) {
        setStatus('No significant trash detected. Try another angle.')
        setSubmitting(false)
        return
      }

      const prepared: PreparedReport = {
        compressed,
        analysis,
        aiNote,
        position,
      }
      preparedRef.current = prepared

      if (!isGpsAccuracyAcceptable(position.coords.accuracy)) {
        setGpsWarning(prepared)
        setSubmitting(false)
        setStatus(null)
        return
      }

      await continueWithPosition(prepared, forceDuplicate)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const retryGps = async () => {
    if (!preparedRef.current) return
    setSubmitting(true)
    setStatus('Retrying location…')
    try {
      const position = await getPositionWithAccuracyRetry()
      const prepared = { ...preparedRef.current, position }
      preparedRef.current = prepared

      if (!isGpsAccuracyAcceptable(position.coords.accuracy)) {
        setGpsWarning(prepared)
        setStatus(null)
        return
      }

      await continueWithPosition(prepared, false)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not get location')
    } finally {
      setSubmitting(false)
    }
  }

  const submitWithInaccurateGps = async () => {
    if (!gpsWarning) return
    setSubmitting(true)
    try {
      await continueWithPosition(gpsWarning, false)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = () => void submitReport(false)

  const handleClose = () => {
    stopCamera()
    setPreview(null)
    setFile(null)
    setManualSeverity(5)
    setStatus(null)
    setNearbyDuplicate(null)
    setSkipDuplicateCheck(false)
    setGpsWarning(null)
    preparedRef.current = null
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Report trash">
      <div className="space-y-3">
        {nearbyDuplicate ? (
          <NearbyReportPrompt
            report={nearbyDuplicate}
            onViewExisting={() => {
              onViewExistingReport?.(nearbyDuplicate)
              handleClose()
            }}
            onReportAnyway={() => {
              setSkipDuplicateCheck(true)
              setNearbyDuplicate(null)
              void submitReport(true)
            }}
            onCancel={() => {
              setNearbyDuplicate(null)
              preparedRef.current = null
            }}
          />
        ) : gpsWarning ? (
          <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="text-sm text-[var(--text-primary)]">
              GPS accuracy is about{' '}
              <span className="font-semibold">
                {Math.round(gpsWarning.position.coords.accuracy)} m
              </span>
              . We prefer ≤{GPS_ACCURACY_LIMIT_M} m so the pin lands on the right spot.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              The first fix is often coarse — retry for a tighter reading, or submit with this
              location if you are sure you are at the pile.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={submitting} onClick={() => void retryGps()}>
                {submitting ? 'Retrying…' : 'Retry location'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={submitting}
                onClick={() => void submitWithInaccurateGps()}
              >
                Submit anyway
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={submitting}
                onClick={() => {
                  setGpsWarning(null)
                  preparedRef.current = null
                }}
              >
                Cancel
              </Button>
            </div>
            {status && <p className="text-xs text-[var(--brand-teal)]">{status}</p>}
          </div>
        ) : (
          <>
            {cameraOn ? (
              <video
                ref={videoRef}
                className="aspect-video w-full rounded-lg bg-black"
                muted
                playsInline
              />
            ) : preview ? (
              <img
                src={preview}
                alt="Preview"
                className="aspect-video w-full rounded-lg object-cover"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-gray-50 text-sm text-[var(--text-muted)]">
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

            <div className="rounded-xl border border-[var(--border-subtle)] bg-black/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Intensity (your rating)
                </p>
                <p className="text-xs font-bold text-[var(--brand-teal)]">
                  {manualSeverity}/10
                </p>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={manualSeverity}
                onChange={(e) => setManualSeverity(Number(e.target.value))}
                className="w-full accent-[var(--brand-teal)]"
              />
              <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                AI helps tag the report; your rating controls the heatmap shading.
              </p>
            </div>

            {status && <p className="text-xs text-[var(--brand-teal)]">{status}</p>}

            <Button
              type="button"
              className="w-full"
              disabled={!file || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Processing…' : 'Submit report'}
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}
