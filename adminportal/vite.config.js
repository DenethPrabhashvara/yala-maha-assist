import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The API (API/server.js) runs on 8005. Proxying /admin keeps the refresh cookie same-origin.
const API_URL = process.env.API_URL || 'http://localhost:8005'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/admin': { target: API_URL, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
})
