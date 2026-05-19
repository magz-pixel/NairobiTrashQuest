import { lazy, Suspense, useState } from 'react'
import { useActiveReports } from '../hooks/useActiveReports'
import { useHeatmapPoints } from '../hooks/useHeatmapPoints'
import { AuthGate } from '../components/auth/AuthGate'
import { ProfileBadge } from '../components/auth/ProfileBadge'
import { ReportTrashModal } from '../components/reports/ReportTrashModal'
import { ClearTrashModal } from '../components/reports/ClearTrashModal'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

const MapView = lazy(() =>
  import('../components/map/MapView').then((m) => ({ default: m.MapView })),
)

interface HomePageProps {
  onNavigateEvents: () => void
}

export function HomePage({ onNavigateEvents }: HomePageProps) {
  const { user } = useAuth()
  const { reports, loading, refetch } = useActiveReports()
  const heatPoints = useHeatmapPoints(reports)
  const [reportOpen, setReportOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-[var(--neon-clean)]">
            Loading map…
          </div>
        }
      >
        <MapView reports={reports} heatPoints={heatPoints} />
      </Suspense>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between p-4">
        <div className="pointer-events-auto">
          <h1 className="text-lg font-bold tracking-tight text-[var(--text-sharp)] drop-shadow-lg">
            Nairobi Trash Locator
          </h1>
          <p className="text-xs text-white/60">
            {loading ? 'Syncing hotspots…' : `${reports.length} active hotspots`}
          </p>
        </div>
        <div className="pointer-events-auto">
          <ProfileBadge />
        </div>
      </header>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex flex-col items-center gap-2 p-4">
        <div className="pointer-events-auto flex w-full max-w-md gap-2">
          <AuthGate onAuthenticated={() => setReportOpen(true)}>
            <Button
              type="button"
              className="flex-1"
              onClick={() => user && setReportOpen(true)}
            >
              Report trash
            </Button>
          </AuthGate>
          <AuthGate onAuthenticated={() => setClearOpen(true)}>
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => user && setClearOpen(true)}
            >
              Verify cleared
            </Button>
          </AuthGate>
        </div>
        <button
          type="button"
          onClick={onNavigateEvents}
          className="pointer-events-auto text-xs text-white/50 underline hover:text-[var(--neon-clean)]"
        >
          Community events
        </button>
      </footer>

      {user && (
        <>
          <ReportTrashModal
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            onReported={refetch}
          />
          <ClearTrashModal
            open={clearOpen}
            onClose={() => setClearOpen(false)}
            activeReports={reports}
            onCleared={refetch}
          />
        </>
      )}
    </div>
  )
}
