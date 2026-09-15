import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  assessInformalSettlementRouting,
  DANDORA_ROUTE_ORIGIN,
  DANDORA_TEST_PIN,
  fetchMapboxDirectionsRaw,
  type MapboxProfile,
  type SanityVerdict,
} from './mapboxTest'

const token = import.meta.env.VITE_MAPBOX_TOKEN?.trim() ?? ''

/**
 * Isolated PoC — not linked from SiteNav or production pages.
 * Route: /spike/mapbox-test
 */
export default function MapboxTestPage() {
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [profile, setProfile] = useState<MapboxProfile>('driving')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null)
  const [verdict, setVerdict] = useState<SanityVerdict | null>(null)

  useEffect(() => {
    if (!token || !mapEl.current || mapRef.current) return

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: mapEl.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [DANDORA_TEST_PIN.longitude, DANDORA_TEST_PIN.latitude],
      zoom: 15,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    new mapboxgl.Marker({ color: '#3b82f6' })
      .setLngLat([DANDORA_ROUTE_ORIGIN.longitude, DANDORA_ROUTE_ORIGIN.latitude])
      .setPopup(new mapboxgl.Popup().setText(DANDORA_ROUTE_ORIGIN.label))
      .addTo(map)

    new mapboxgl.Marker({ color: '#f97316' })
      .setLngLat([DANDORA_TEST_PIN.longitude, DANDORA_TEST_PIN.latitude])
      .setPopup(new mapboxgl.Popup().setText(DANDORA_TEST_PIN.label))
      .addTo(map)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !raw) return

    const routes = raw.routes as
      | { geometry?: GeoJSON.LineString }[]
      | undefined
    const geometry = routes?.[0]?.geometry
    if (!geometry) return

    const draw = () => {
      if (map.getSource('spike-route')) {
        ;(map.getSource('spike-route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry,
        })
        return
      }
      map.addSource('spike-route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry },
      })
      map.addLayer({
        id: 'spike-route-line',
        type: 'line',
        source: 'spike-route',
        paint: {
          'line-color': '#0d9488',
          'line-width': 5,
          'line-opacity': 0.9,
        },
      })
    }

    if (map.isStyleLoaded()) draw()
    else map.once('load', draw)
  }, [raw])

  const runRoute = async () => {
    if (!token) {
      setError('Set VITE_MAPBOX_TOKEN in .env and restart the dev server.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload = await fetchMapboxDirectionsRaw(
        token,
        DANDORA_ROUTE_ORIGIN,
        DANDORA_TEST_PIN,
        profile,
      )
      setRaw(payload)
      setVerdict(
        assessInformalSettlementRouting(
          payload,
          DANDORA_TEST_PIN,
          DANDORA_ROUTE_ORIGIN,
        ),
      )
    } catch (err) {
      setRaw(null)
      setVerdict(null)
      setError(err instanceof Error ? err.message : 'Directions request failed')
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0a192f] p-6 text-teal-50">
        <div className="max-w-lg rounded-xl border border-white/10 bg-white/5 p-6 text-sm">
          <p className="font-semibold text-white">Mapbox spike — token required</p>
          <p className="mt-2 text-teal-100/80">
            Add <code className="text-[#00f2fe]">VITE_MAPBOX_TOKEN</code> to{' '}
            <code>.env</code>, restart Vite, then open{' '}
            <code>/spike/mapbox-test</code>.
          </p>
          <p className="mt-3 text-xs text-teal-100/55">
            Isolated PoC · not linked from nav · Leaflet production map untouched
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a192f] text-teal-50">
      <header className="border-b border-white/10 px-4 py-3 md:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/90">
          Spike only · /spike/mapbox-test
        </p>
        <h1 className="mt-1 text-lg font-bold text-white">
          Mapbox Directions — Dandora informal settlement
        </h1>
        <p className="mt-1 max-w-3xl text-xs text-teal-100/75">
          Single test pin at the dumpsite + fixed paved-road origin. Production
          Leaflet map and <code>geo.ts</code> are untouched.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div ref={mapEl} className="relative min-h-[45vh] flex-1 lg:min-h-0" />

        <aside className="w-full shrink-0 space-y-4 overflow-y-auto border-t border-white/10 p-4 text-sm lg:w-[26rem] lg:border-t-0 lg:border-l">
          <div className="text-xs text-teal-100/85">
            <p>
              <span className="font-semibold text-blue-300">Origin</span> —{' '}
              {DANDORA_ROUTE_ORIGIN.label}
              <br />
              {DANDORA_ROUTE_ORIGIN.latitude}, {DANDORA_ROUTE_ORIGIN.longitude}
            </p>
            <p className="mt-2">
              <span className="font-semibold text-orange-300">Pin</span> —{' '}
              {DANDORA_TEST_PIN.label}
              <br />
              {DANDORA_TEST_PIN.latitude}, {DANDORA_TEST_PIN.longitude}
            </p>
          </div>

          <div className="flex gap-2">
            {(['driving', 'walking'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProfile(p)}
                className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold capitalize ${
                  profile === p
                    ? 'border-[#0d9488] bg-teal-500/20 text-white'
                    : 'border-white/15 text-teal-100/70'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void runRoute()}
            disabled={busy}
            className="w-full rounded-lg bg-[#0d9488] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'Calling Directions API…' : 'Run Mapbox Directions'}
          </button>

          {error && (
            <p className="rounded-lg border border-red-400/40 bg-red-950/40 px-3 py-2 text-xs text-red-100">
              {error}
            </p>
          )}

          {verdict && (
            <div
              className={`rounded-lg border px-3 py-3 ${
                verdict.saneForInformalSettlement
                  ? 'border-teal-400/40 bg-teal-950/40'
                  : 'border-amber-400/40 bg-amber-950/40'
              }`}
            >
              <p className="text-sm font-bold text-white">
                Sane for informal-settlement network?{' '}
                {verdict.saneForInformalSettlement ? 'YES' : 'NO'}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-teal-100/85">
                {verdict.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {raw && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-300/80">
                Raw Directions response
              </p>
              <pre className="mt-2 max-h-[40vh] overflow-auto rounded-lg bg-black/50 p-3 text-[10px] leading-relaxed text-teal-50/90">
                {JSON.stringify(raw, null, 2)}
              </pre>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
