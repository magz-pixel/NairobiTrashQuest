import { useMap } from 'react-leaflet'
import { getCurrentPosition } from '../../lib/geo'

interface MapControlsProps {
  onLocated: (lat: number, lng: number) => void
}

export function MapControls({ onLocated }: MapControlsProps) {
  const map = useMap()

  const locate = async () => {
    try {
      const pos = await getCurrentPosition()
      onLocated(pos.coords.latitude, pos.coords.longitude)
    } catch {
      map.locate({ setView: true, maxZoom: 16 })
    }
  }

  return (
    <>
      <div className="pointer-events-auto absolute right-3 top-[5.5rem] z-[1050] hidden flex-col gap-2 md:right-4 md:top-[6.25rem] md:flex">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => map.zoomIn()}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/80 bg-white/95 text-lg font-extrabold text-[#063b32] shadow-[0_12px_30px_rgba(6,59,50,.14)]"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => map.zoomOut()}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/80 bg-white/95 text-lg font-extrabold text-[#063b32] shadow-[0_12px_30px_rgba(6,59,50,.14)]"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Use my location"
          onClick={() => void locate()}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/80 bg-[#063b32] text-white shadow-[0_12px_30px_rgba(6,59,50,.24)]"
        >
          ⌖
        </button>
      </div>

      <button
        type="button"
        aria-label="Use my location"
        onClick={() => void locate()}
        className="map-thumb-control pointer-events-auto absolute left-3 z-[1070] grid h-12 w-12 place-items-center rounded-full border border-white/80 bg-[#063b32] text-lg text-white shadow-[0_14px_32px_rgba(6,59,50,.28)] md:hidden"
      >
        ⌖
      </button>
    </>
  )
}
