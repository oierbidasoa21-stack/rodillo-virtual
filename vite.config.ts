import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// GitHub Pages serves the site under /<repo>/; the Docker image serves it at the root
// (BASE_PATH=/). Always with a trailing slash.
const BASE = process.env.BASE_PATH ?? '/rodillo-virtual/';

/**
 * Content-Security-Policy as a <meta> in the built index.html, for GitHub Pages,
 * which cannot send headers. The policy comes from docker/security-headers.conf,
 * so nginx and the meta never drift apart. frame-ancestors is header-only and
 * is dropped here. Only in builds: the dev server needs inline scripts for HMR.
 */
function cspMeta(): Plugin {
  const conf = readFileSync(new URL('./docker/security-headers.conf', import.meta.url), 'utf8');
  const match = conf.match(/add_header Content-Security-Policy "([^"]+)"/);
  if (!match) throw new Error('No Content-Security-Policy in docker/security-headers.conf');
  const policy = match[1]
    .split(';')
    .map((d) => d.trim())
    .filter((d) => d && !d.startsWith('frame-ancestors'))
    .join('; ');
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig({
  base: BASE,
  build: {
    // The 3D view (Three.js, ~930 kB) is its own lazy chunk, loaded only when opened.
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react(),
    cspMeta(),
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
