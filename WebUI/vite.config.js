import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Forwards API calls to the backend so the session cookie works in dev.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
