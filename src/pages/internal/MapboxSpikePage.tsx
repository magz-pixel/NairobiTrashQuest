import { useCallback, useMemo, useState } from 'react'
import Map, { Layer, Marker, Source } from 'react-map-gl/mapbox'
import type { LayerProps } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  DANDORA_ROUTE_ORIGIN,
  DANDORA_TEST_PIN,
  fetchMapboxDirections,
  googleDirectionsUrl,
  type MapboxDirectionsResult,
} from './mapboxSpikeData'

const token = import.meta.env.VITE_MAPBOX_TOKEN?.trim() ?? ''

const routeLayer: LayerProps = {
  id: 'spike-route',
  type: 'line',
  paint: {
    'line-color': '#0d9488',
    'line-width': 5,
    'line-opacity': 0.85,
  },
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`
}

function formatDuration(s: number): string {
  const mins = Math.round(s / 60)
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`
}

export function MapboxSpikePage() {
  const [drivingRoute, setDrivingRoute] = useState<MapboxDirectionsResult | null>(null)
  const [walkingRoute, setWalkingRoute] = useState<MapboxDirectionsResult | null>(null)
  const [routeProfile, setRouteProfile] = useState<'driving' | 'walking'>('driving')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const googleUrl = useMemo(
    () => googleDirectionsUrl(DANDORA_TEST_PIN, DANDORA_ROUTE_ORIGIN),
    [],
  )

  const googleDestinationOnlyUrl = useMemo(
    () => googleDirectionsUrl(DANDORA_TEST_PIN),
    [],
  )

  const loadRoutes = useCallback(async () => {
    if (!token) {
      setError('Set VITE_MAPBOX_TOKEN in .env and restart the dev server.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const [driving, walking] = await Promise.all([
        fetchMapboxDirections(token, DANDORA_ROUTE_ORIGIN, DANDORA_TEST_PIN, 'driving'),
        fetchMapboxDirections(token, DANDORA_ROUTE_ORIGIN, DANDORA_TEST_PIN, 'walking'),
      ])
      setDrivingRoute(driving)
      setWalkingRoute(walking)
    } catch (err) {
      setDrivingRoute(null)
      setWalkingRoute(null)
      setError(err instanceof Error ? err.message : 'Directions request failed')
    } finally {
      setBusy(false)
    }
  }, [])

  const activeRoute =
    routeProfile === 'driving' ? drivingRoute : walkingRoute

  if (!token) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0a192f] p-6 text-teal-50">
        <div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-6 text-sm">
          <p className="font-semibold text-white">Mapbox spike — token required</p>
          <p className="mt-2 text-teal-100/80">
            Add <code className="text-[#00f2fe]">VITE_MAPBOX_TOKEN</code> to{' '}
            <code>.env</code> (see <code>.env.example</code>), then reload this page.
          </p>
          <p className="mt-3 text-xs text-teal-100/60">
            Internal only · /internal/mapbox-spike
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0a192f] text-teal-50">
      <header className="border-b border-white/10 px-4 py-3 md:px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/90">
          Internal spike · not in nav
        </p>
        <h1 className="mt-1 text-lg font-bold text-white">Mapbox vs Google — Dandora routing</h1>
        <p className="mt-1 max-w-3xl text-xs text-teal-100/75">
          Compare Mapbox Directions (OSM-based) with the Google Maps link pattern used in{' '}
          <code className="text-teal-200">HotspotLayer</code> /{' '}
          <code className="text-teal-200">ReportDetailSheet</code>. Production Leaflet map is
          unchanged.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative min-h-[50vh] flex-1 lg:min-h-0">
          <Map
            mapboxAccessToken={token}
            initialViewState={{
              longitude: DANDORA_TEST_PIN.longitude,
              latitude: DANDORA_TEST_PIN.latitude,
              zoom: 15,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
          >
            <Marker
              longitude={DANDORA_ROUTE_ORIGIN.longitude}
              latitude={DANDORA_ROUTE_ORIGIN.latitude}
              anchor="bottom"
              color="#3b82f6"
            />
            <Marker
              longitude={DANDORA_TEST_PIN.longitude}
              latitude={DANDORA_TEST_PIN.latitude}
              anchor="bottom"
              color="#f97316"
            />
            {activeRoute && (
              <Source
                id="route"
                type="geojson"
                data={{ type: 'Feature', properties: {}, geometry: activeRoute.geometry }}
              >
                <Layer {...routeLayer} />
              </Source>
            )}
          </Map>
        </div>

        <aside className="w-full shrink-0 space-y-4 overflow-y-auto border-t border-white/10 p-4 text-sm lg:w-[22rem] lg:border-t-0 lg:border-l">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-300/80">
              Test points
            </p>
            <ul className="mt-2 space-y-2 text-xs text-teal-100/85">
              <li>
                <span className="font-semibold text-blue-300">Origin</span> —{' '}
                {DANDORA_ROUTE_ORIGIN.label}
                <br />
                {DANDORA_ROUTE_ORIGIN.latitude.toFixed(5)},{' '}
                {DANDORA_ROUTE_ORIGIN.longitude.toFixed(5)}
              </li>
              <li>
                <span className="font-semibold text-orange-300">Pin</span> —{' '}
                {DANDORA_TEST_PIN.label}
                <br />
                {DANDORA_TEST_PIN.latitude.toFixed(5)}, {DANDORA_TEST_PIN.longitude.toFixed(5)}
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => void loadRoutes()}
            disabled={busy}
            className="w-full rounded-lg bg-[#0d9488] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'Fetching Mapbox routes…' : 'Fetch Mapbox directions (driving + walking)'}
          </button>

          {drivingRoute && walkingRoute && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRouteProfile('driving')}
                className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold ${
                  routeProfile === 'driving'
                    ? 'border-[#0d9488] bg-teal-500/20 text-white'
                    : 'border-white/15 text-teal-100/70'
                }`}
              >
                Show driving
              </button>
              <button
                type="button"
                onClick={() => setRouteProfile('walking')}
                className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold ${
                  routeProfile === 'walking'
                    ? 'border-[#0d9488] bg-teal-500/20 text-white'
                    : 'border-white/15 text-teal-100/70'
                }`}
              >
                Show walking
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-300">{error}</p>}

          {drivingRoute && (
            <div className="rounded-lg border border-white/10 bg-black/25 p-3 text-xs">
              <p className="font-semibold text-white">Mapbox driving</p>
              <p className="mt-1 text-teal-100/80">
                {formatDistance(drivingRoute.distanceM)} · {formatDuration(drivingRoute.durationS)}
              </p>
              <p className="mt-1 text-teal-100/70">
                {drivingRoute.stepCount} steps ({drivingRoute.unnamedStepCount} unnamed) · route
                ends {Math.round(drivingRoute.endGapM)} m from pin
              </p>
            </div>
          )}

          {walkingRoute && (
            <div className="rounded-lg border border-white/10 bg-black/25 p-3 text-xs">
              <p className="font-semibold text-white">Mapbox walking</p>
              <p className="mt-1 text-teal-100/80">
                {formatDistance(walkingRoute.distanceM)} · {formatDuration(walkingRoute.durationS)}
              </p>
              <p className="mt-1 text-teal-100/70">
                {walkingRoute.stepCount} steps ({walkingRoute.unnamedStepCount} unnamed) · route
                ends {Math.round(walkingRoute.endGapM)} m from pin
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-300/80">
              Google Maps (current app)
            </p>
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-[#00f2fe] underline"
            >
              Same origin → pin (A/B compare)
            </a>
            <a
              href={googleDestinationOnlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-white/15 px-3 py-2 text-xs text-teal-100/80 underline"
            >
              Destination only (matches production HotspotLayer link)
            </a>
          </div>

          <p className="text-[11px] leading-relaxed text-teal-100/55">
            Blue = origin on Outer Ring / Kayole Rd. Orange = Dandora dumpsite pin. Teal line =
            selected Mapbox route profile.
          </p>
        </aside>
      </div>
    </div>
  )
}

export default MapboxSpikePage
