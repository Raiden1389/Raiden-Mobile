import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Bind to 0.0.0.0 — accessible from LAN (Android)
  },
  build: {
    outDir: '../Exe/mobile-dist',
    emptyOutDir: true,
  },
})
