import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { analyzeTrashImage, uploadReportImage } from '../../lib/gemini'
import {
  GPS_ACCURACY_LIMIT_M,
  getCurrentPosition,
  getPositionWithAccuracyRetry,
  isGpsAccuracyAcceptable,
} from '../../lib/geo'
import { compressImageFile } from '../../lib/uploads'
import { resolvePlace } from '../../lib/wards'
import { assertCanSubmitReport, recordReportSubmit } from '../../lib/reportGuard'
import { nearestActiveReport } from '../../lib/nearbyReports'
import { bumpMissionProgress } from '../../lib/missions'
import { useCity } from '../../lib/CityContext'
import { useAuth } from '../../hooks/useAuth'
import type { Report, ReportWasteCategory, TrashAnalysis } from '../../types/database'
import { WasteCategoryPicker } from './WasteCategoryPicker'
import { SeverityPicker } from './SeverityPicker'
import { ReportPinMap } from './ReportPinMap'
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
  const city = useCity()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [manualSeverity, setManualSeverity] = useState(6)
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [note, setNote] = useState('')
  const [wasteCategories, setWasteCategories] = useState<ReportWasteCategory[]>([])
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

  useEffect(() => {
    if (!open || !file || pin) return
    let cancel = false
    getCurrentPosition()
      .then((position) => {
        if (!cancel) setPin({ lat: position.coords.latitude, lng: position.coords.longitude })
      })
      .catch(() => {
        if (!cancel) setPin({ lat: city.center.lat, lng: city.center.lng })
      })
    return () => {
      cancel = true
    }
  }, [open, file, pin, city.center.lat, city.center.lng])

  const handleFileChange = (selected: File | null) => {
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    stopCamera()
  }

  const finishInsert = async (prepared: PreparedReport) => {
    if (!user) return

    const { compressed, analysis, aiNote, position } = prepared
    const latitude = pin?.lat ?? position.coords.latitude
    const longitude = pin?.lng ?? position.coords.longitude
    assertCanSubmitReport(city, latitude, longitude)
    const severity = Math.min(
      10,
      Math.max(1, Math.round(manualSeverity || analysis.severity)),
    )

    const reportId = crypto.randomUUID()
    setStatus('Uploading photo…')
    const imageUrl = await uploadReportImage(user.id, reportId, compressed)
    const place = await resolvePlace(latitude, longitude, city.slug)

    setStatus(aiNote ? `Saving report… (${aiNote})` : 'Saving report…')
    const { error } = await supabase.from('reports').insert({
      id: reportId,
      user_id: user.id,
      latitude,
      longitude,
      severity_score: severity,
      status: 'active',
      image_url: imageUrl,
      ai_tags: analysis.tags,
      ward_id: place?.wardId ?? null,
      area_name: place?.areaName ?? null,
      moderation_note: note.trim() || null,
      waste_type: wasteCategories,
      city: city.slug,
    })

    if (error) throw error
    recordReportSubmit()

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

  const handleSubmit = () => {
    if (wasteCategories.length === 0) {
      setStatus('Pick at least one waste type.')
      return
    }
    void submitReport(false)
  }

  const handleClose = () => {
    stopCamera()
    setPreview(null)
    setFile(null)
    setManualSeverity(6)
    setPin(null)
    setNote('')
    setWasteCategories([])
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
          <div className="space-y-3 rounded-[var(--radius-card)] border border-amber-500/40 bg-gold-400/10 p-3">
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
              <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-canvas text-sm text-[var(--text-muted)]">
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

            <SeverityPicker value={manualSeverity} onChange={setManualSeverity} />
            <div>
              <p className="mb-1 text-xs font-semibold text-[var(--text-primary)]">Pin</p>
              {pin ? (
                <ReportPinMap
                  lat={pin.lat}
                  lng={pin.lng}
                  onChange={(lat, lng) => setPin({ lat, lng })}
                />
              ) : (
                <p className="text-xs text-[var(--text-muted)]">
                  Add a photo and the pin will appear. Drag it onto the pile.
                </p>
              )}
            </div>
            <label className="block text-xs font-semibold text-[var(--text-primary)]">
              Note (optional)
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={240}
                rows={2}
                className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-white px-2 py-2 text-xs font-normal"
              />
            </label>

            <WasteCategoryPicker value={wasteCategories} onChange={setWasteCategories} />

            {status && <p className="text-xs text-[var(--brand-teal)]">{status}</p>}

            <Button
              type="button"
              className="w-full"
              disabled={!file || submitting || wasteCategories.length === 0}
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
