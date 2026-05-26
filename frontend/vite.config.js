import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,        // equivale a --host, para que Docker exponga el puerto
    port: 5173,
    watch: {
      usePolling: true // necesario en Docker Desktop (Windows/Mac) para detectar cambios del host
    }
  }
})