import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { cityPath, getCity, getActiveCities, type CityConfig } from './cities'

const CityContext = createContext<CityConfig | null>(null)

export function CityProvider({ children }: { children: ReactNode }) {
  const city = getCity(useLocation().pathname.split('/')[1])
  return <CityContext.Provider value={city}>{children}</CityContext.Provider>
}

export function useCity(): CityConfig {
  const city = useContext(CityContext)
  if (!city) {
    throw new Error('useCity() must be used within a <CityProvider>')
  }
  return city
}

/** Prefix a chapter-relative path with the active city slug. */
export function useCityPath() {
  const city = useCity()
  return useCallback((path = '') => cityPath(city.slug, path), [city.slug])
}

/** Swap the city segment, keep the rest of the path (map stays map, funds stays funds). */
export function useCitySwitchPath() {
  const city = useCity()
  const { pathname } = useLocation()
  const suffix = pathname.replace(new RegExp(`^/${city.slug}`), '') || ''
  return useCallback((slug: string) => `/${slug}${suffix}`, [city.slug, suffix])
}

export function useChapterList() {
  return getActiveCities()
}
