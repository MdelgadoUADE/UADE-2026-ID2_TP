import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',        // equivale a --host, para que Docker exponga el puerto
    port: 5173,
    allowedHosts: ['reportit.ar'],
    watch: {
      usePolling: true // necesario en Docker Desktop (Windows/Mac) para detectar cambios del host
    },
    proxy: {
      '/api':{
        target: 'http://backend:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})