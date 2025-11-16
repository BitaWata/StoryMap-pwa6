import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: "/StoryMap-pwa5/",
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),

  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      }
    }
  },

  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.png',
        'images/icons/icon-96x96.png',
        'images/icons/icon-192x192.png',
        'images/icons/iconn-512x512.png',
        'images/icons/logo.png',
      ],
      manifest: {
        name: "Story Map",
        short_name: "StoryMap",
        start_url: "/StoryMap-pwa5/",
        display: "standalone",
        background_color: "#ffffff",
        icons: [
          {
            src: "images/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "images/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          }
        ]
      }
    })
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});