import { useMemo } from 'react'
import { reportsToHeatPoints } from '../lib/heatmap'
import type { Report } from '../types/database'

export function useHeatmapPoints(reports: Report[]) {
  return useMemo(() => reportsToHeatPoints(reports), [reports])
}
