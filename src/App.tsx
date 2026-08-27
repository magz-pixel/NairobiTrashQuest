import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { CleanupsManagePage } from './pages/CleanupsManagePage'
import { CleanupsPage } from './pages/CleanupsPage'
import { FundsManagePage } from './pages/FundsManagePage'
import { FundsPage } from './pages/FundsPage'
import { HomePage } from './pages/HomePage'
import { ImpactMePage } from './pages/ImpactMePage'
import { LandingPage } from './pages/LandingPage'
import { MissionPage } from './pages/MissionPage'
import { RaceAdminPage } from './pages/RaceAdminPage'
import { RaceLeaderboardPage } from './pages/RaceLeaderboardPage'
import { RaceMarshalPage } from './pages/RaceMarshalPage'
import { RaceRegisterPage } from './pages/RaceRegisterPage'

/** Isolated Mapbox PoC — not linked from nav. */
const MapboxTestPage = lazy(() => import('./pages/spike/MapboxTestPage'))

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/map" element={<HomePage />} />
          <Route path="/me" element={<ImpactMePage />} />
          <Route path="/cleanups" element={<CleanupsPage />} />
          <Route path="/cleanups/manage" element={<CleanupsManagePage />} />
          <Route path="/race" element={<RaceRegisterPage />} />
          <Route path="/race/leaderboard" element={<RaceLeaderboardPage />} />
          <Route path="/race/marshal" element={<RaceMarshalPage />} />
          <Route path="/race/admin" element={<RaceAdminPage />} />
          <Route path="/funds" element={<FundsPage />} />
          <Route path="/funds/manage" element={<FundsManagePage />} />
          <Route path="/mission" element={<MissionPage />} />
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
