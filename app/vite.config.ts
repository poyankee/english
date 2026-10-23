import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages'te uygulama /english/ altında yayınlanıyor
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    VitePWA({
      // Android uygulamasında dosyalar zaten pakette; service worker gereksiz
      disable: !!process.env.CAPACITOR,
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        // Türkçe için latin ve latin-ext yeterli; diğer alfabelerin font dosyaları önbelleğe alınmaz
        globIgnores: ['**/nunito-cyrillic*', '**/nunito-vietnamese*', '**/nunito-greek*'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'Kelime — Oxford 5000',
        short_name: 'Kelime',
        description: 'Oxford 5000 kelime ve kalıplarını aralıklı tekrarla öğren',
        lang: 'tr',
        theme_color: '#6c5ce7',
        background_color: '#f4f2ff',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
