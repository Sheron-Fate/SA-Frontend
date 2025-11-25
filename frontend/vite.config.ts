import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import mkcert from 'vite-plugin-mkcert'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  // Для Tauri используем '/', для GitHub Pages - '/SA-Frontend/'
  // Проверяем через переменную окружения (Tauri устанавливает TAURI_PLATFORM)
  // Или можно использовать VITE_TAURI_BUILD при сборке для Tauri
  const isTauri = Boolean(process.env.TAURI_PLATFORM) ||
                  Boolean(process.env.TAURI_ENV_PLATFORM) ||
                  Boolean(process.env.VITE_TAURI_BUILD)
  const base = isDev || isTauri ? '/' : '/SA-Frontend/'

  return {
    base,
    plugins: [
      react(),
      mkcert(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
        },
        manifest: {
          name: 'Spectroscopic Analysis',
          short_name: 'SpectroLab',
          start_url: '.',
          scope: '.',
          display: 'standalone',
          background_color: '#f7f7f7',
          theme_color: '#A6541D',
          orientation: 'portrait-primary',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-256.png', sizes: '256x256', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
      }),
    ],
    server: {
      https: {
        key: fs.readFileSync('cert-key.pem'),
        cert: fs.readFileSync('cert.pem'),
      },
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
      watch: { usePolling: true },
      host: true,
      strictPort: true,
    },
  }
})
