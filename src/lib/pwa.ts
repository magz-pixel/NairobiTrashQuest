/**
 * Installable-app helpers: remember the user's city, capture Chrome's install prompt,
 * and detect iPhone / already-installed so the install page can show the right steps.
 */
import { useEffect, useState } from 'react'
import { isCitySlug } from './cities'

const LAST_CITY_KEY = 'rt:last-city'

export function rememberCity(slug: string) {
  try {
    localStorage.setItem(LAST_CITY_KEY, slug)
  } catch {
    /* private mode / storage blocked */
  }
}

export function lastCity(): string {
  try {
    const slug = localStorage.getItem(LAST_CITY_KEY)
    if (slug && isCitySlug(slug)) return slug
  } catch {
    /* ignore */
  }
  return 'nairobi'
}

/** Chrome/Edge/Samsung fire this once, early. Keep it so a button can trigger it later. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/** TikTok / Instagram / Facebook in-app browsers can't install web apps — the user must open the link in Chrome or Safari. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /musical_ly|bytedancewebview|tiktok|instagram|fban|fbav|fb_iab|snapchat|twitter|line\//i.test(
    navigator.userAgent,
  )
}

export type InstallState = 'installed' | 'ready' | 'ios' | 'manual'

/** 'ready' = we can show the native install dialog; 'ios' = Share → Add to Home Screen; 'manual' = browser menu. */
export function useInstallPrompt() {
  const compute = (): InstallState =>
    isStandalone() ? 'installed' : deferredPrompt ? 'ready' : isIOS() ? 'ios' : 'manual'
  const [state, setState] = useState<InstallState>(compute)

  useEffect(() => {
    const update = () => setState(compute())
    listeners.add(update)
    update()
    return () => {
      listeners.delete(update)
    }
  }, [])

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false
    const prompt = deferredPrompt
    deferredPrompt = null
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    notify()
    return outcome === 'accepted'
  }

  return { state, install }
}
