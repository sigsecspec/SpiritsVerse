import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
    return {
      envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: false,
          includeAssets: ['logo.svg', 'logo-mark.svg', 'icon.svg', 'favicon.ico', 'favicon-16.png', 'favicon-32.png', 'favicon-48.png', 'apple-touch-icon.png', 'pwa-192.png', 'pwa-512.png', 'pwa-192x192.png', 'pwa-512x512.png'],
          manifest: {
            id: '/',
            name: 'SpiritsVerse',
            short_name: 'SpiritsVerse',
            description: 'The social network for drink lovers. Explore cocktails, connect with drinking buddies, and share your digital bar.',
            theme_color: '#0a0a0a',
            background_color: '#0a0a0a',
            display: 'standalone',
            display_override: ['standalone', 'browser'],
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            categories: ['social', 'lifestyle', 'food'],
            icons: [
              {
                src: 'pwa-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: 'pwa-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: 'pwa-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,webmanifest}'],
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/api/],
          },
          devOptions: {
            enabled: true,
            navigateFallback: '/index.html',
          },
        }),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
