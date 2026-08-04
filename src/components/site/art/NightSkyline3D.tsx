import { lazy, Suspense, useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { NairobiSkyline } from './NairobiSkyline'

const NightSkylineCanvas = lazy(() =>
  import('./NightSkylineCanvas').then((m) => ({ default: m.NightSkylineCanvas })),
)

function usePreferWebGL() {
  const reduce = useReducedMotion()
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (reduce) {
      setOk(false)
      return
    }
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const narrow = window.innerWidth < 768
    setOk(!coarse && !narrow)
  }, [reduce])

  return ok
}

/** Low-poly Nairobi CBD (WebGL) or SVG fallback for mobile / reduced motion. */
export function NightSkyline3D({ parallaxY = 0 }: { parallaxY?: number }) {
  const prefer3d = usePreferWebGL()
  const reduce = useReducedMotion()

  if (!prefer3d) {
    return <NairobiSkyline parallaxY={parallaxY} />
  }

  return (
    <Suspense fallback={<NairobiSkyline parallaxY={parallaxY} />}>
      <NightSkylineCanvas reduce={Boolean(reduce)} />
    </Suspense>
  )
}
