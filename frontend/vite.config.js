import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Menggunakan path relatif agar jalan di domain, IP publik, maupun IP lokal:port
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
