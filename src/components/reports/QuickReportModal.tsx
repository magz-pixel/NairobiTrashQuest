import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { resolvePlace } from '../../lib/wards'
import { getSessionId } from '../../lib/session'
import { uploadReportImage, analyzeTrashImage } from '../../lib/gemini'
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
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
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
      setStatus(err instanceof Error ? err.message : 'Failed to submit')
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
