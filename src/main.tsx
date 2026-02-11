import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register SW and expose update trigger globally
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // New version available — signal the UI
    window.dispatchEvent(new CustomEvent('sw-update-ready'));
  },
});

// Expose for UI to call
(window as unknown as Record<string, unknown>).__updateSW = updateSW;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
