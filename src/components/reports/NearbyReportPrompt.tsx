import type { Report } from '../../types/database'
import { Button } from '../ui/Button'

interface NearbyReportPromptProps {
  report: Report
  onViewExisting: () => void
  onReportAnyway: () => void
  onCancel: () => void
}

export function NearbyReportPrompt({
  report,
  onViewExisting,
  onReportAnyway,
  onCancel,
}: NearbyReportPromptProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-semibold text-amber-900">Already reported nearby</p>
      <p className="mt-1 text-xs text-amber-800">
        <strong>{report.area_name ?? 'This hotspot'}</strong> is on the map within 50 m.
        Corroborate instead of creating a duplicate pin.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <Button type="button" onClick={onViewExisting}>
          View & corroborate
        </Button>
        <Button type="button" variant="ghost" onClick={onReportAnyway}>
          Report anyway (different spot)
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
