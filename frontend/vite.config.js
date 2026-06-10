import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'نظام جداول كلية المنار',
        short_name: 'المنار',
        description: 'نظام الجداول الذكي والإشعارات الفورية لكلية المنار الجامعية',
        theme_color: '#84cc16',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        importScripts: ['/push-sw.js'],
        // Only cache static assets — navigation always goes to network first
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Skip waiting so new SW activates immediately after update
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // API calls — always network only (no cache)
            urlPattern: /\/api\//,
            handler: 'NetworkOnly'
          },
          {
            // Navigation (page loads) — network first, fallback to cache
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'navigation-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24  // 1 day only
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Static assets — cache first, very long expiry (content-hashed)
            urlPattern: /\/assets\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365  // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
})
