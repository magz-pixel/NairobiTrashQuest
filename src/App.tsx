import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { CityProvider } from './lib/CityContext'
import { isCitySlug } from './lib/cities'
import { CommandCenterPage } from './pages/CommandCenterPage'
import { HomePage } from './pages/HomePage'
import { HubPage } from './pages/HubPage'
import { ImpactMePage } from './pages/ImpactMePage'
import { InstallPage } from './pages/InstallPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { BottomTabBar } from './components/layout/BottomTabBar'
import { OfflineQueueBanner } from './components/layout/OfflineQueueBanner'
import { lastCity } from './lib/pwa'
import { MissionPage } from './pages/MissionPage'
import { ReportPage } from './pages/ReportPage'

const CleanupsPage = lazy(() => import('./pages/CleanupsPage').then((m) => ({ default: m.CleanupsPage })))
const CleanupsManagePage = lazy(() =>
  import('./pages/CleanupsManagePage').then((m) => ({ default: m.CleanupsManagePage })),
)
const FundsPage = lazy(() => import('./pages/FundsPage').then((m) => ({ default: m.FundsPage })))
const FundsManagePage = lazy(() =>
  import('./pages/FundsManagePage').then((m) => ({ default: m.FundsManagePage })),
)
const FeedPage = lazy(() => import('./pages/FeedPage').then((m) => ({ default: m.FeedPage })))
const RaceAdminPage = lazy(() => import('./pages/RaceAdminPage').then((m) => ({ default: m.RaceAdminPage })))
const RaceLeaderboardPage = lazy(() =>
  import('./pages/RaceLeaderboardPage').then((m) => ({ default: m.RaceLeaderboardPage })),
)
const RaceMarshalPage = lazy(() =>
  import('./pages/RaceMarshalPage').then((m) => ({ default: m.RaceMarshalPage })),
)
const RaceRegisterPage = lazy(() =>
  import('./pages/RaceRegisterPage').then((m) => ({ default: m.RaceRegisterPage })),
)

/**
 * Mapbox routing experiment (~490 KB gzipped). Dev only: in production builds this is `null`,
 * so the chunk is never built and installed phones don't download it on every update.
 */
const MapboxTestPage = import.meta.env.DEV ? lazy(() => import('./pages/spike/MapboxTestPage')) : null

const LEGACY_TO_NAIROBI = [
  '/map',
  '/me',
  '/cleanups',
  '/cleanups/manage',
  '/race',
  '/race/leaderboard',
  '/race/marshal',
  '/race/admin',
  '/funds',
  '/funds/manage',
  '/mission',
] as const

function PageFallback() {
  return <p className="px-5 pt-28 text-sm font-bold text-[#0b8c76]">Loading…</p>
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>
}

const ROUTE_TITLES: [string, string][] = [
  ['/cleanups/manage', 'Cleanup console'],
  ['/cleanups', 'Cleanups'],
  ['/race/leaderboard', 'Leaderboard'],
  ['/race/marshal', 'Marshal login'],
  ['/race/admin', 'Race console'],
  ['/race', 'Race'],
  ['/funds/manage', 'Fund console'],
  ['/funds', 'Public ledger'],
  ['/mission', 'Mission'],
  ['/map', 'Trash map'],
  ['/me', 'My impact'],
  ['/feed', 'Feed'],
  ['/privacy', 'Privacy policy'],
  ['/install', 'Get the app'],
]

function RouteMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname.includes('/report/')) return
    const match = ROUTE_TITLES.find(([path]) => pathname.endsWith(path))
    document.title = match ? `${match[1]} · Ramani-Taka` : 'Ramani-Taka'
    const description = document.querySelector('meta[name="description"]')
    if (description && match) {
      description.setAttribute('content', `${match[1]} on Ramani-Taka.`)
    }
  }, [pathname])
  return null
}

const APP_LAUNCH_PAGES = new Set(['map', 'cleanups', 'me', 'race', 'funds'])

/**
 * Home-screen launch: go to the city this person last used. `?to=cleanups` picks the page
 * (default map); other params such as `?action=report` are passed through.
 */
function AppLaunch() {
  const params = new URLSearchParams(useLocation().search)
  const to = params.get('to') ?? 'map'
  params.delete('to')
  const page = APP_LAUNCH_PAGES.has(to) ? to : 'map'
  const query = params.toString()
  return <Navigate to={`/${lastCity()}/${page}${query ? `?${query}` : ''}`} replace />
}

function CityGate() {
  const { city } = useParams()
  if (!isCitySlug(city)) return <Navigate to="/" replace />
  return (
    <CityProvider>
      <Outlet />
      <BottomTabBar />
    </CityProvider>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <RouteMeta />
        <OfflineQueueBanner />
        <Routes>
          <Route path="/" element={<HubPage />} />
          <Route path="/app" element={<AppLaunch />} />
          <Route path="/install" element={<InstallPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          {LEGACY_TO_NAIROBI.map((path) => (
            <Route key={path} path={path} element={<Navigate to={`/nairobi${path}`} replace />} />
          ))}
          <Route path="/:city" element={<CityGate />}>
            <Route index element={<CommandCenterPage />} />
            <Route path="map" element={<CityMapPage />} />
            <Route path="report/:id" element={<ReportPage />} />
            <Route path="me" element={<ImpactMePage />} />
            <Route path="cleanups" element={<Lazy><CleanupsPage /></Lazy>} />
            <Route path="cleanups/manage" element={<Lazy><CleanupsManagePage /></Lazy>} />
            <Route path="race" element={<Lazy><RaceRegisterPage /></Lazy>} />
            <Route path="race/leaderboard" element={<Lazy><RaceLeaderboardPage /></Lazy>} />
            <Route path="race/marshal" element={<Lazy><RaceMarshalPage /></Lazy>} />
            <Route path="race/admin" element={<Lazy><RaceAdminPage /></Lazy>} />
            <Route path="funds" element={<Lazy><FundsPage /></Lazy>} />
            <Route path="funds/manage" element={<Lazy><FundsManagePage /></Lazy>} />
            <Route path="mission" element={<MissionPage />} />
            <Route path="feed" element={<Lazy><FeedPage /></Lazy>} />
          </Route>
          {MapboxTestPage ? (
            <Route
              path="/spike/mapbox-test"
              element={
                <Suspense
                  fallback={
                    <div className="flex min-h-[100dvh] items-center justify-center text-sm text-teal-700">
                      Loading Mapbox spike…
                    </div>
                  }
                >
                  <MapboxTestPage />
                </Suspense>
              }
            />
          ) : null}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

/** Remount the map page per city so nothing (focus, ward, framing) carries over from the last city. */
function CityMapPage() {
  const { city } = useParams()
  return <HomePage key={city} />
}
