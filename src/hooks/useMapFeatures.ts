import { useCallback, useEffect, useState } from 'react'
import { fetchMapFeatures, type MapFeature } from '../lib/mapFeatures'

/** Bins and trees for a city. `ready` is false until migration 023 has been run. */
export function useMapFeatures(city: string) {
  const [state, setState] = useState<{ city: string; features: MapFeature[]; ready: boolean } | null>(null)

  const load = useCallback(async () => {
    const data = await fetchMapFeatures(city)
    setState({ city, features: data ?? [], ready: data !== null })
  }, [city])

  useEffect(() => {
    let cancelled = false
    void fetchMapFeatures(city).then((data) => {
      if (!cancelled) setState({ city, features: data ?? [], ready: data !== null })
    })
    return () => {
      cancelled = true
    }
  }, [city])

  const current = state?.city === city ? state : null
  return { features: current?.features ?? [], ready: current?.ready ?? false, reload: load }
}
