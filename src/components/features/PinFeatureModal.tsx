import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { PhotoPicker } from '../reports/PhotoPicker'
import { ReportPinMap } from '../reports/ReportPinMap'
import { SignInButton } from '../auth/SignInButton'
import { useAuth } from '../../hooks/useAuth'
import { useCity } from '../../lib/CityContext'
import { getCurrentPosition } from '../../lib/geo'
import { compressImageFile, uploadCleanupMedia } from '../../lib/uploads'
import { addMapFeature, STATUS_OPTIONS, type FeatureKind } from '../../lib/mapFeatures'

/** "Pin a bin" / "Pin a tree" (roadmap #5 and #6). Signed-in users only, to keep the data clean. */
export function PinFeatureModal({
  kind,
  onClose,
  onSaved,
}: {
  kind: FeatureKind | null
  onClose: () => void
  onSaved: (at: { lat: number; lng: number }) => void
}) {
  const { user } = useAuth()
  const city = useCity()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [status, setStatus] = useState('ok')
  const [origin, setOrigin] = useState<'planted' | 'existing'>('existing')
  const [species, setSpecies] = useState('')
  const [plantedOn, setPlantedOn] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Reset when opened for a kind, and find where the person is standing.
  useEffect(() => {
    if (!kind) return
    let cancelled = false
    void getCurrentPosition()
      .then((p) => !cancelled && setPin({ lat: p.coords.latitude, lng: p.coords.longitude }))
      .catch(() => !cancelled && setPin({ lat: city.center.lat, lng: city.center.lng }))
    return () => {
      cancelled = true
    }
  }, [kind, city.center.lat, city.center.lng])

  const reset = () => {
    setFile(null)
    setPreview(null)
    setPin(null)
    setStatus(kind === 'tree' ? 'alive' : 'ok')
    setOrigin('existing')
    setSpecies('')
    setPlantedOn('')
    setNote('')
    setMessage(null)
  }

  const close = () => {
    reset()
    onClose()
  }

  if (!kind) return null
  const isTree = kind === 'tree'
  const current = STATUS_OPTIONS[kind].some((o) => o.value === status) ? status : STATUS_OPTIONS[kind][0].value

  const save = async () => {
    if (!user || !pin) return
    setBusy(true)
    setMessage(null)
    try {
      let image_url: string | null = null
      if (file) {
        const small = await compressImageFile(file)
        image_url = await uploadCleanupMedia(user.id, `${kind}-${Date.now()}`, small)
      }
      const error = await addMapFeature({
        city: city.slug,
        kind,
        latitude: pin.lat,
        longitude: pin.lng,
        status: current as never,
        origin: isTree ? origin : null,
        species: isTree && species.trim() ? species.trim() : null,
        planted_on: isTree && origin === 'planted' && plantedOn ? plantedOn : null,
        image_url,
        note: note.trim() || null,
        created_by: user.id,
      })
      if (error) {
        setMessage(/map_features/.test(error) ? 'Bins and trees go live once the database update (migration 023) is run.' : error)
        return
      }
      onSaved(pin)
      close()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const chip = (on: boolean) =>
    `inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 text-sm font-bold ${
      on ? 'border-[#0b8c76] bg-[#d9f7e9] text-[#087766]' : 'border-[#d9e9e4] bg-white text-[#36564e]'
    }`

  return (
    <Modal open onClose={close} title={isTree ? '🌳 Pin a tree' : '🗑️ Pin a bin'}>
      {!user ? (
        <div className="space-y-3">
          <p className="text-sm text-[#36564e]">
            Sign in to add {isTree ? 'trees' : 'bins'}. It keeps the public dataset trustworthy.
          </p>
          <SignInButton variant="dark" label="Sign in to continue" className="w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {preview ? <img src={preview} alt="" className="aspect-video w-full rounded-lg object-cover" /> : null}
          <PhotoPicker
            hasPhoto={!!file}
            onPick={(f) => {
              setFile(f)
              setPreview(URL.createObjectURL(f))
            }}
          />

          {isTree ? (
            <div>
              <p className="mb-1.5 text-xs font-bold text-[#36564e]">This tree is…</p>
              <div className="flex gap-2">
                <button type="button" className={chip(origin === 'planted')} onClick={() => setOrigin('planted')}>
                  🌱 Newly planted
                </button>
                <button type="button" className={chip(origin === 'existing')} onClick={() => setOrigin('existing')}>
                  🌳 Existing
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  placeholder="Species (if known)"
                  className="fn-field mt-0 text-sm"
                />
                {origin === 'planted' ? (
                  <input type="date" value={plantedOn} onChange={(e) => setPlantedOn(e.target.value)} className="fn-field mt-0 text-sm" aria-label="Planted on" />
                ) : null}
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-1.5 text-xs font-bold text-[#36564e]">{isTree ? 'How is it doing?' : 'Condition'}</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS[kind].map((o) => (
                <button key={o.value} type="button" className={chip(current === o.value)} onClick={() => setStatus(o.value)}>
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-bold text-[#36564e]">Location</p>
            {pin ? (
              <ReportPinMap lat={pin.lat} lng={pin.lng} onChange={(lat, lng) => setPin({ lat, lng })} />
            ) : (
              <p className="text-xs text-[#71867f]">Finding your location…</p>
            )}
            <p className="mt-1 text-[11px] text-[#71867f]">Drag the pin onto the exact spot.</p>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional), e.g. near the stage, behind the market"
            rows={2}
            className="fn-field text-sm"
          />

          {message ? <p className="fn-warn">{message}</p> : null}

          <button
            type="button"
            disabled={busy || !pin}
            onClick={() => void save()}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#063b32] text-sm font-extrabold text-white disabled:opacity-60"
          >
            {busy ? 'Saving…' : isTree ? 'Add tree to the map' : 'Add bin to the map'}
          </button>
        </div>
      )}
    </Modal>
  )
}
