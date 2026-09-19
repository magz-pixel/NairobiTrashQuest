import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { CityProvider } from './lib/CityContext'
import { isCitySlug } from './lib/cities'
import { CleanupsManagePage } from './pages/CleanupsManagePage'
import { CleanupsPage } from './pages/CleanupsPage'
import { CommandCenterPage } from './pages/CommandCenterPage'
import { FundsManagePage } from './pages/FundsManagePage'
import { FundsPage } from './pages/FundsPage'
import { HomePage } from './pages/HomePage'
import { HubPage } from './pages/HubPage'
import { ImpactMePage } from './pages/ImpactMePage'
import { MissionPage } from './pages/MissionPage'
import { RaceAdminPage } from './pages/RaceAdminPage'
import { RaceLeaderboardPage } from './pages/RaceLeaderboardPage'
import { RaceMarshalPage } from './pages/RaceMarshalPage'
import { RaceRegisterPage } from './pages/RaceRegisterPage'

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
        <Routes>
          <Route path="/" element={<HubPage />} />
          {LEGACY_TO_NAIROBI.map((path) => (
            <Route key={path} path={path} element={<Navigate to={`/nairobi${path}`} replace />} />
          ))}
          <Route path="/:city" element={<CityGate />}>
            <Route index element={<CommandCenterPage />} />
            <Route path="map" element={<HomePage />} />
            <Route path="me" element={<ImpactMePage />} />
            <Route path="cleanups" element={<CleanupsPage />} />
            <Route path="cleanups/manage" element={<CleanupsManagePage />} />
            <Route path="race" element={<RaceRegisterPage />} />
            <Route path="race/leaderboard" element={<RaceLeaderboardPage />} />
            <Route path="race/marshal" element={<RaceMarshalPage />} />
            <Route path="race/admin" element={<RaceAdminPage />} />
            <Route path="funds" element={<FundsPage />} />
            <Route path="funds/manage" element={<FundsManagePage />} />
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
