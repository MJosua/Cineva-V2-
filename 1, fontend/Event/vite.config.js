import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/event/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9999',
        changeOrigin: true,
      },
      '/sse': {
        target: 'http://127.0.0.1:9999',
        changeOrigin: true,
      },
      '/hots_auth': {
        target: 'http://127.0.0.1:9999',
        changeOrigin: true,
      },
      '/public': {
        target: 'http://127.0.0.1:9999',
        changeOrigin: true,
      },
      '/files': {
        target: 'http://127.0.0.1:9999',
        changeOrigin: true,
      },
      '/image': {
        target: 'http://127.0.0.1:9999',
        changeOrigin: true,
      }
    }
  }
})
