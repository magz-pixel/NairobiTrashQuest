/**
 * Map theme: Auto (dark after sunset in the city, as before), Dark, or Light.
 * Dark styles the map itself (MapLibre night style) and the app chrome around it (map screen,
 * bottom sheet, tab bar). Marketing pages stay light for now.
 * Stored per device; the <html data-theme> attribute drives the CSS in styles/map.css.
 */
import { useSyncExternalStore } from 'react'
import { skyPhase } from './sky'

export type ThemePref = 'auto' | 'dark' | 'light'
const KEY = 'rt:theme'
const EVENT = 'rt-theme-change'

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'light' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

export function setThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(KEY, pref)
  } catch {
    /* private mode: still applies for this visit */
  }
  window.dispatchEvent(new Event(EVENT))
}

/** Next option when the toggle is tapped: Auto → Dark → Light → Auto. */
export const nextThemePref = (p: ThemePref): ThemePref => (p === 'auto' ? 'dark' : p === 'dark' ? 'light' : 'auto')

export const THEME_LABEL: Record<ThemePref, string> = { auto: 'Auto (dark at night)', dark: 'Dark', light: 'Light' }

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribe, getThemePref, () => 'auto')
}

/** Whether the map screen should be dark for this city right now. */
export function useDarkMap(citySlug: string): boolean {
  const pref = useThemePref()
  return pref === 'dark' || (pref === 'auto' && skyPhase(citySlug) === 'night')
}
