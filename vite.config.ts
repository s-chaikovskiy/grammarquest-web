import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['characters/*.webp', 'icons/*.png', 'fonts/*.woff2'],
      manifest: {
        name: 'GrammarQuest — тренажёр казахской грамматики',
        short_name: 'GrammarQuest',
        description: 'Диалоги, правила и семь типов упражнений по казахской грамматике. Работает офлайн.',
        lang: 'ru',
        theme_color: '#0064B9',
        background_color: '#0064B9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Данные уроков лежат внутри бандла, поэтому кэшируем всё сразу:
        // после первой загрузки приложение полностью работает офлайн.
        globPatterns: ['**/*.{js,css,html,woff2,webp,png,svg}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      }
    })
  ]
})
