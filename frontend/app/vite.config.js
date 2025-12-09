import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/service-worker.js',
          dest: '.',
        },
        {
          src: 'public/manifest.json',
          dest: '.',
        },
      ],
    }),
  ],
  base: '/static/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  publicDir: 'public',
})
