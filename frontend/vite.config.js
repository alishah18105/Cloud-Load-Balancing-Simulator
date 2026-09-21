import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Flask backend runs at http://127.0.0.1:5000 (see backend/app.py).
// Proxying /api keeps the frontend origin-relative, so no CORS setup is
// needed during development and the build works unchanged behind any host.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
