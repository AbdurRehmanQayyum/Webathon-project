import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.API_PROXY_TARGET || 'http://localhost:5080'
  // Same-origin API access during development keeps cookies simple
  const proxy = Object.fromEntries(
    ['/api', '/hubs', '/health'].map((path) => [path, { target, ws: path === '/hubs' }]),
  )

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        devOptions: { enabled: true, type: 'module', navigateFallback: 'index.html' },
        includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'Campus Connect',
          short_name: 'Campus',
          description: 'Clubs, discussions, announcements and events for CS students.',
          theme_color: '#8E1EA2',
          background_color: '#F8F7FA',
          display: 'standalone',
          id: '/',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: '/branding/app-icon.svg', sizes: 'any', type: 'image/svg+xml' },
          ],
        },
        workbox: {
          // Only static assets are cached; API responses always come from the network
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/hubs\//, /^\/health/, /^\/openapi\//],
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    build: {
      rolldownOptions: {
        output: {
          // Stable library chunks stay cached across application releases
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
              {
                name: 'interface',
                test: /node_modules[\\/](radix-ui|@radix-ui|@floating-ui|motion|motion-dom|motion-utils|framer-motion|lucide-react)[\\/]/,
              },
              { name: 'data', test: /node_modules[\\/](@tanstack|zod|react-hook-form|@hookform)[\\/]/ },
            ],
          },
        },
      },
    },
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  }
})
