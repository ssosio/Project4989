import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
                define: {
                global: 'globalThis',
                // 환경변수를 직접 정의
                'import.meta.env.VITE_API_BASE': JSON.stringify('http://localhost:4989'),
                'import.meta.env.VITE_WS_URL': JSON.stringify('http://localhost:4989/ws'),
              },
  resolve: {
    alias: {
      'sockjs-client': 'sockjs-client/dist/sockjs.min.js',
    },
  },
                server: {
                proxy: {
                  '/api': {
                    target: 'http://localhost:4989',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, ''),
                  },
                  '/auction': {
                    target: 'http://localhost:4989',
                    changeOrigin: true,
                  },
                },
              },
})
