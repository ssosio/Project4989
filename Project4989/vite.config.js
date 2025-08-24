import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify(process.env.VITE_API_BASE || 'http://localhost:4989')
  },
  resolve: {
    alias: {
      'sockjs-client': 'sockjs-client/dist/sockjs.min.js',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4989', // 👈 포트 번호를 4989로 변경
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
