import { useCallback, useSyncExternalStore } from 'react'
import type { Report } from '../types/database'

export interface FundingState {
  raised: number
  contributors: number
  goal: number
}

type FundingMap = Record<string, FundingState>

let fundingMap: FundingMap = {}
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return fundingMap
}

function defaultsFromReport(report: Report): FundingState | null {
  const goal = report.funding_goal_tzs
  if (goal == null || goal <= 0) return null
  return {
    goal,
    raised: report.funding_raised_tzs ?? 0,
    contributors: report.funding_contributors ?? 0,
  }
}

/** Session-only funding state for Ramani Taka demo contributions. */
export function useDemoFunding(report: Report | null): {
  funding: FundingState | null
  contribute: (amount: number) => void
} {
  const map = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const funding = report ? (map[report.id] ?? defaultsFromReport(report)) : null

  const contribute = useCallback(
    (amount: number) => {
      if (!report) return
      const base = fundingMap[report.id] ?? defaultsFromReport(report)
      if (!base) return
      fundingMap = {
        ...fundingMap,
        [report.id]: {
          goal: base.goal,
          raised: Math.min(base.goal, base.raised + amount),
          contributors: base.contributors + 1,
        },
      }
      emit()
    },
    [report],
  )

  return { funding, contribute }
}
