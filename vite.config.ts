import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Public root deploy (Cloudflare Tunnel / custom domain). For GitHub Pages subdirectory set VITE_BASE=/oswan/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
  server: {
    // Cloudflare / ngrok 등 터널 호스트 허용
    allowedHosts: true,
  },
  preview: {
    allowedHosts: true,
  },
})
