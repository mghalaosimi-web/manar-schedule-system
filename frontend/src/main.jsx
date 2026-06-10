import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './i18n'


import { registerSW } from 'virtual:pwa-register'

// Register Service Worker for PWA with auto-update logic
try {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // New version available — auto-reload to apply
      updateSW(true);
    },
    onOfflineReady() {
      console.log('[PWA] App ready to work offline.');
    },
    onRegistered(r) {
      if (r) {
        console.log('[PWA] Service Worker registered:', r);
      }
    },
    onRegisterError(error) {
      console.warn('[PWA] Service Worker registration failed:', error);
    },
  });
} catch (e) {
  console.warn('[PWA] registerSW failed (possibly in dev mode):', e);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
