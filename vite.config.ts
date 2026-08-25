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
        name: 'Тілашар — казахский язык шаг за шагом',
        short_name: 'Тілашар',
        description: 'Казахский язык для тех, кто говорит по-русски: диалоги, правила и семь типов упражнений. Работает офлайн.',
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

        // Страницу НЕ отдаём из кэша в первую очередь.
        //
        // По умолчанию workbox привязывает навигацию к сохранённому index.html
        // и отдаёт его, не заглядывая в сеть. Из-за этого после выкладки
        // вернувшийся посетитель видел старую версию приложения: старый
        // index.html тянул за собой старые файлы, и обновление приходило
        // только со следующего захода. Никакая правка внутри приложения это
        // вылечить не может — до нового кода браузер попросту не доходит.
        navigateFallback: null,

        // Одного navigateFallback: null оказалось мало.
        //
        // Workbox по умолчанию сопоставляет запрос каталога с сохранённым
        // index.html (directoryIndex). Правило precache регистрируется первым,
        // поэтому оно перехватывало адрес «/» раньше, чем до него доходило
        // правило NetworkFirst ниже: кэш «pages» так и оставался пустым,
        // а вернувшийся посетитель получал старую страницу с первого захода.
        // Проверяется просто: после выкладки в caches.keys() должен появиться
        // кэш «pages». Если его нет — навигацию перехватывает кто-то другой.
        directoryIndex: null,

        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        runtimeCaching: [
          {
            // Сама страница: сначала сеть, кэш — запасной путь.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              // Без интернета ждать сеть смысла нет — быстро уходим в кэш.
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 8 },
            },
          },
        ],
      }
    })
  ]
})
