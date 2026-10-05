import { useEffect } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ReportDetailSheet } from '../components/map/ReportDetailSheet'
import { PublicShell } from '../components/site/PagePrimitives'
import { useReport } from '../hooks/useReports'
import { useCityPath } from '../lib/CityContext'
import { isCitySlug } from '../lib/cities'

export function ReportPage() {
  const { id, city: citySlug } = useParams()
  const { report, loading, notFound, error } = useReport(id)
  const navigate = useNavigate()
  const path = useCityPath()
  const wrongCity = Boolean(report && isCitySlug(report.city) && report.city !== citySlug)

  useEffect(() => {
    if (!report || wrongCity) return
    const previous = document.title
    const area = report.area_name?.trim() || 'Hotspot'
    document.title = `${area} · Ramani-Taka`
    return () => {
      document.title = previous
    }
  }, [report, wrongCity])

  if (report && wrongCity) {
    return <Navigate to={`/${report.city}/report/${report.id}`} replace />
  }

  return (
    <PublicShell footer={false}>
      <main className="relative min-h-[100dvh] bg-[#dce8e1]">
        {loading ? (
          <p className="px-5 pt-28 text-sm font-bold text-[#0b8c76]">Loading report…</p>
        ) : null}
        {!loading && error ? (
          <div className="mx-auto max-w-md px-5 pt-28">
            <p className="text-sm font-semibold text-[#8b6207]">{error}</p>
            <Link to={path('/map')} className="mt-4 inline-block text-sm font-bold text-[#0b8c76]">
              Back to the map
            </Link>
          </div>
        ) : null}
        {!loading && notFound ? (
          <div className="mx-auto max-w-md px-5 pt-28">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#063b32]">Report not found</h1>
            <p className="mt-2 text-sm leading-6 text-[#36564e]">
              This link does not match a report. It may have been removed.
            </p>
            <Link to={path('/map')} className="mt-4 inline-block text-sm font-bold text-[#0b8c76]">
              Back to the map
            </Link>
          </div>
        ) : null}
        {report && !wrongCity ? (
          <ReportDetailSheet
            key={report.id}
            report={report}
            onClose={() => navigate(path('/map'))}
          />
        ) : null}
      </main>
    </PublicShell>
  )
}
