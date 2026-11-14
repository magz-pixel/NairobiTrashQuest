import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { resolvePlace } from '../../lib/wards'
import { getSessionId } from '../../lib/session'
import {
  analyzeTrashImage,
  PHOTO_UPLOAD_FAILED_MESSAGE,
  uploadReportImage,
} from '../../lib/gemini'
import { reportClientError } from '../../lib/monitoring'
import { isNetworkError, queueReport } from '../../lib/offlineQueue'
import { nearestActiveReport } from '../../lib/nearbyReports'
import { assertCanSubmitReport, recordReportSubmit } from '../../lib/reportGuard'
import { useCity } from '../../lib/CityContext'
import type { Report, ReportWasteCategory, TrashAnalysis } from '../../types/database'
import { WasteCategoryPicker } from './WasteCategoryPicker'
import { SeverityPicker } from './SeverityPicker'
import { ReportPinMap } from './ReportPinMap'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { NearbyReportPrompt } from './NearbyReportPrompt'
import { PhotoPicker } from './PhotoPicker'

interface QuickReportModalProps {
  open: boolean
  onClose: () => void
  onReported: (report?: { id: string; latitude: number; longitude: number }) => void
  activeReports?: Report[]
  onViewExistingReport?: (report: Report) => void
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

export function QuickReportModal({
  open,
  onClose,
  onReported,
  activeReports = [],
  onViewExistingReport,
}: QuickReportModalProps) {
  const city = useCity()
  const [file, setFile] = useState<File | null>(null)
  const [extraFiles, setExtraFiles] = useState<File[]>([])
  const [preview, setPreview] = useState<string | null>(null)
  const [severity, setSeverity] = useState(6)
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [note, setNote] = useState('')
  const [wasteCategories, setWasteCategories] = useState<ReportWasteCategory[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [nearbyDuplicate, setNearbyDuplicate] = useState<Report | null>(null)
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false)

  const reset = () => {
    setFile(null)
    setPreview(null)
    setSeverity(6)
    setPin(null)
    setNote('')
    setWasteCategories([])
    setStatus(null)
    setNearbyDuplicate(null)
    setSkipDuplicateCheck(false)
  }

  const handleClose = () => {
    reset()
    onClose()
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

  const submitReport = async (forceDuplicate = false) => {
    if (!file || wasteCategories.length === 0) return
    if (!pin) {
      setStatus('Still finding the pin. Drag it onto the pile once the map appears.')
      return
    }
    setSubmitting(true)
    setStatus('Checking the pin…')

    // No signal: keep the report on the phone and send it when the connection is back.
    const saveOffline = async () => {
      await queueReport({
        id: crypto.randomUUID(),
        photo: file,
        photoName: file.name,
        latitude: pin.lat,
        longitude: pin.lng,
        severity,
        wasteCategories,
        note,
        city: city.slug,
        queuedAt: new Date().toISOString(),
      })
      setStatus('📶 No signal. Saved on your phone; it will send automatically when you’re back online.')
      setTimeout(handleClose, 1800)
    }

    try {
      assertCanSubmitReport(city, pin.lat, pin.lng)
      const position = {
        coords: { latitude: pin.lat, longitude: pin.lng },
      } as GeolocationPosition

      if (!forceDuplicate && !skipDuplicateCheck) {
        const nearby = nearestActiveReport(
          activeReports,
          position.coords.latitude,
          position.coords.longitude,
        )
        if (nearby) {
          setNearbyDuplicate(nearby)
          setSubmitting(false)
          setStatus(null)
          return
        }
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await saveOffline()
        return
      }

      const reportId = crypto.randomUUID()

      setStatus('Analyzing photo…')
      let analysis: TrashAnalysis = {
        is_trash: true,
        severity,
        tags: wasteCategories,
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
      const place = await resolvePlace(position.coords.latitude, position.coords.longitude, city.slug)

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
        ward_id: place?.wardId ?? null,
        area_name: place?.areaName ?? null,
        waste_type: wasteCategories,
        approved_at: autoLive ? new Date().toISOString() : null,
        moderation_note:
          [note.trim() || null, analysis.moderation_action === 'review' ? 'Queued for human review' : null]
            .filter(Boolean)
            .join(' — ') || null,
        city: city.slug,
      })

      if (error) throw error
      recordReportSubmit()

      // Extra photos: best effort, never block the main report (needs migration 024).
      for (const extra of extraFiles) {
        try {
          const url = await uploadReportImage('anonymous', `${reportId}-${crypto.randomUUID().slice(0, 8)}`, extra)
          await supabase.from('report_photos').insert({ report_id: reportId, url, user_id: null })
        } catch {
          /* ignore */
        }
      }

      setStatus(
        nextStatus === 'pending'
          ? 'Submitted! Pending review before it appears on the map.'
          : 'Report live on the map. Thank you!',
      )
      onReported({
        id: reportId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      })
      setTimeout(handleClose, 900)
    } catch (err) {
      if (isNetworkError(err)) {
        try {
          await saveOffline()
          return
        } catch {
          /* fall through to the normal error message */
        }
      }
      console.error('Quick report failed', err)
      reportClientError(err, { source: 'QuickReportModal' })
      const raw = err instanceof Error ? err.message : ''
      if (
        raw === PHOTO_UPLOAD_FAILED_MESSAGE ||
        /row-level security|violates.*policy/i.test(raw)
      ) {
        setStatus(PHOTO_UPLOAD_FAILED_MESSAGE)
      } else {
        setStatus(raw || 'Failed to submit')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = () => submitReport(false)

  return (
    <Modal open={open} onClose={handleClose} title="Report trash (30 sec)">
      <p className="mb-3 text-sm text-[var(--text-muted)]">
        No login needed. Photo + location only.
      </p>
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
          onCancel={() => setNearbyDuplicate(null)}
        />
      ) : (
        <>
      {preview ? (
        <img src={preview} alt="Preview" className="mb-3 aspect-video w-full rounded-lg object-cover" />
      ) : (
        <div className="mb-3 flex aspect-video items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-canvas text-sm text-[var(--text-muted)]">
          Take or upload a photo
        </div>
      )}
      <div className="mb-3">
        <PhotoPicker
          hasPhoto={!!file}
          onPick={(f) => {
            setFile(f)
            setPreview(URL.createObjectURL(f))
          }}
        />
      </div>
      {file ? (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold text-[var(--text-primary)]">More photos (optional, up to 2)</p>
          <div className="flex flex-wrap gap-2">
            {extraFiles.map((f, i) => (
              <span key={i} className="relative">
                <img src={URL.createObjectURL(f)} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => setExtraFiles((xs) => xs.filter((_, j) => j !== i))}
                  className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs text-white"
                >
                  ✕
                </button>
              </span>
            ))}
            {extraFiles.length < 2 ? (
              <label className="grid h-16 w-16 cursor-pointer place-items-center rounded-lg border border-dashed border-[var(--border-subtle)] text-2xl text-[var(--text-muted)]">
                +
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f) setExtraFiles((xs) => [...xs, f].slice(0, 2))
                  }}
                />
              </label>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="mb-3">
        <SeverityPicker value={severity} onChange={setSeverity} />
      </div>
      <div className="mb-3">
        <p className="mb-1 text-xs font-semibold text-[var(--text-primary)]">Pin</p>
        {pin ? (
          <ReportPinMap lat={pin.lat} lng={pin.lng} onChange={(lat, lng) => setPin({ lat, lng })} />
        ) : (
          <p className="text-xs text-[var(--text-muted)]">Finding your location…</p>
        )}
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">Drag the pin onto the pile.</p>
      </div>
      <label className="mb-3 block text-xs font-semibold text-[var(--text-primary)]">
        Note (optional)
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={240}
          rows={2}
          className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-white px-2 py-2 text-xs font-normal"
        />
      </label>
      <div className="mb-3">
        <WasteCategoryPicker value={wasteCategories} onChange={setWasteCategories} />
      </div>
      {status && <p className="mb-2 text-xs text-[var(--brand-teal)]">{status}</p>}
      <Button
        type="button"
        className="w-full"
        disabled={!file || submitting || wasteCategories.length === 0}
        onClick={handleSubmit}
      >
        {submitting ? 'Submitting…' : 'Submit report'}
      </Button>
        </>
      )}
    </Modal>
  )
}
