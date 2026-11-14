import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/rebuild-v2.css'
import './styles/sky.css'
import './styles/map.css'
import App from './App.tsx'
import { initMonitoring } from './lib/monitoring'
// Side-effect import: start listening for Chrome's install prompt before any page renders.
import './lib/pwa'
import { registerSW } from 'virtual:pwa-register'

initMonitoring()

// Ensure mobile clients recover cleanly after deploys (service worker cache).

registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload()
  },
  onRegisteredSW(_swUrl, registration) {
    // Installed apps sit in the background for days; check for a new deploy whenever the
    // app comes back to the foreground (at most every 10 minutes) instead of only on cold start.
    let lastCheck = Date.now()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastCheck < 10 * 60 * 1000) return
      lastCheck = Date.now()
      void registration?.update().catch(() => {})
    })
    registration?.addEventListener('updatefound', () => {
      const worker = registration.installing
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'activated') window.location.reload()
      })
    })
  },
  onOfflineReady() {},
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
