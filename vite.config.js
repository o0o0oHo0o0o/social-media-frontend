/* eslint-env node */
/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.VITE_PORT) || 5173
  return {
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
    ],
    server: {
      port,
      strictPort: true,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { '*': '' }
        },
        '/verification': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { '*': '' }
        },
        '/auth': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { '*': '' }
        },
        '/chat': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { '*': '' }
        },
        '/ws': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          ws: true,
          secure: false
        }
      }
    }
  }
})
