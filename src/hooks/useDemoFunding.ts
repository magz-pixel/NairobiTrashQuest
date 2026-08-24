import { useCallback, useSyncExternalStore } from 'react'

export interface FundingState {
  raised: number
  contributors: number
  goal: number
}

/** Initial values when session state has not been updated yet. */
export interface FundingSeed {
  goal: number
  raised?: number
  contributors?: number
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

function seedToState(seed: FundingSeed): FundingState {
  return {
    goal: seed.goal,
    raised: seed.raised ?? 0,
    contributors: seed.contributors ?? 0,
  }
}

/** Deterministic session demo funding for a race hotspot (no backend). */
export function demoHotspotFundingSeed(
  hotspotId: string,
  pointValue: number,
): FundingSeed {
  let hash = 0
  for (let i = 0; i < hotspotId.length; i++) {
    hash = (hash * 31 + hotspotId.charCodeAt(i)) >>> 0
  }
  const goalBase = Math.max(10_000, pointValue * 400)
  const goal = Math.round(goalBase / 1000) * 1000
  const raisedPct = [0.18, 0.34, 0.48, 0.62, 0.75][hash % 5]!
  const raised = Math.min(goal - 500, Math.round((goal * raisedPct) / 100) * 100)
  const contributors = 4 + (hash % 18)
  return { goal, raised, contributors }
}

/** Session-only funding state for demo contributions (reports or hotspots). */
export function useDemoFunding(
  id: string | null,
  seed: FundingSeed | null,
): {
  funding: FundingState | null
  contribute: (amount: number) => void
} {
  const map = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const funding =
    id && seed && seed.goal > 0 ? (map[id] ?? seedToState(seed)) : null

  const contribute = useCallback(
    (amount: number) => {
      if (!id || !seed || seed.goal <= 0) return
      const base = fundingMap[id] ?? seedToState(seed)
      fundingMap = {
        ...fundingMap,
        [id]: {
          goal: base.goal,
          raised: Math.min(base.goal, base.raised + amount),
          contributors: base.contributors + 1,
        },
      }
      emit()
    },
    [id, seed],
  )

  return { funding, contribute }
}
