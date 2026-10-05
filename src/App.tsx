import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { CityProvider } from './lib/CityContext'
import { isCitySlug } from './lib/cities'
import { CommandCenterPage } from './pages/CommandCenterPage'
import { HomePage } from './pages/HomePage'
import { HubPage } from './pages/HubPage'
import { ImpactMePage } from './pages/ImpactMePage'
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

const MapboxTestPage = lazy(() => import('./pages/spike/MapboxTestPage'))

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

function CityGate() {
  const { city } = useParams()
  if (!isCitySlug(city)) return <Navigate to="/" replace />
  return (
    <CityProvider>
      <Outlet />
    </CityProvider>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <RouteMeta />
        <Routes>
          <Route path="/" element={<HubPage />} />
          {LEGACY_TO_NAIROBI.map((path) => (
            <Route key={path} path={path} element={<Navigate to={`/nairobi${path}`} replace />} />
          ))}
          <Route path="/:city" element={<CityGate />}>
            <Route index element={<CommandCenterPage />} />
            <Route path="map" element={<HomePage />} />
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
          </Route>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
