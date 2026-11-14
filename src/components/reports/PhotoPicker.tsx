import { useRef } from 'react'

/**
 * Two explicit choices. A single <input capture> makes many Android phones jump straight
 * to the camera and hide the gallery, so people with a photo already taken were stuck.
 */
export function PhotoPicker({
  hasPhoto,
  onPick,
}: {
  hasPhoto: boolean
  onPick: (file: File) => void
}) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = '' // let the same file be picked again after "change photo"
    if (f) onPick(f)
  }
  const btn =
    'inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 text-sm font-bold transition active:scale-[.98]'

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        className={`${btn} border-[#063b32] bg-[#063b32] text-white`}
      >
        <span aria-hidden>📷</span> {hasPhoto ? 'Retake' : 'Take photo'}
      </button>
      <button
        type="button"
        onClick={() => galleryRef.current?.click()}
        className={`${btn} border-[#cfe1da] bg-white text-[#063b32]`}
      >
        <span aria-hidden>🖼️</span> Gallery
      </button>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handle} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handle} />
    </div>
  )
}
