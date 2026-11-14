import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        // Never make phones pre-download experiments or admin-only bulk; they load on demand if opened.
        globIgnores: ['**/MapboxTestPage-*', '**/MapView-*', '**/node_modules/**'],
      },
      manifest: {
        id: '/',
        name: 'Ramani-Taka — community trash map',
        short_name: 'Ramani-Taka',
        description: 'Report trash in 30 seconds, join cleanups near you, and see your street change.',
        lang: 'en',
        theme_color: '#063b32',
        background_color: '#063b32',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        // /app sends people to the map of the city they last used.
        start_url: '/app?source=pwa',
        categories: ['social', 'lifestyle', 'utilities'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        // Long-press the home-screen icon on Android.
        shortcuts: [
          {
            name: 'Report trash',
            short_name: 'Report',
            url: '/app?action=report&source=pwa-shortcut',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Upcoming cleanups',
            short_name: 'Cleanups',
            url: '/app?to=cleanups&source=pwa-shortcut',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
