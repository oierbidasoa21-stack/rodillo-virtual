import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// GitHub Pages serves the site under /<repo>/
const BASE = '/rodillo-virtual/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      // Never reload on its own: the app shows a prompt, deferred while a session runs.
      registerType: 'prompt',
      injectRegister: false,
      // Icons are already precached by globPatterns; avoid duplicate entries.
      includeManifestIcons: false,
      manifest: {
        id: BASE,
        start_url: BASE,
        scope: BASE,
        name: 'Rodillo Virtual',
        short_name: 'Rodillo',
        description: 'Entrenamiento en rodillo por zonas de pulso.',
        lang: 'es',
        display: 'standalone',
        background_color: '#f2f4f7',
        theme_color: '#1f5fd1',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Only latin and latin-ext glyphs are needed for Spanish.
        globIgnores: ['**/*-cyrillic-*', '**/*-greek-*', '**/*-vietnamese-*'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      // A service worker in dev would serve stale code while editing.
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
