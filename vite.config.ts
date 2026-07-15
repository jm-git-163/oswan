import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Public root deploy. For GitHub Pages subdirectory set VITE_BASE=/oswan/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icon-192.png', 'icon-512.png', 'og-challenge.png'],
      manifest: {
        name: '오스완 — 오늘 스쿼트 완료',
        short_name: '오스완',
        description: '친구에게 스쿼트 도전장을 보내고, 카메라로 목표 개수를 클리어하세요.',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'ko',
        categories: ['health', 'fitness', 'sports'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Large MediaPipe / BGM — network first, don't bloat SW precache
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /\.(?:mp3|wasm)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'oswan-media-v2',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  base: process.env.VITE_BASE || '/',
  server: {
    allowedHosts: true,
  },
  preview: {
    allowedHosts: true,
  },
});
