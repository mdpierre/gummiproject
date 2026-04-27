import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'onnxruntime-web': fileURLToPath(
        new URL('./node_modules/onnxruntime-web/dist/ort.min.js', import.meta.url),
      ),
      'onnxruntime-common': fileURLToPath(
        new URL('./node_modules/onnxruntime-common/dist/ort-common.js', import.meta.url),
      ),
    },
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
  },
  build: {
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'pdf-vendor': ['@react-pdf/renderer'],
          // @xenova/transformers is loaded lazily via dynamic import in whisper.ts
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
