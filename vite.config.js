/* eslint-env node */
/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.VITE_PORT) || 5173
  const apiTarget = env.VITE_API_BASE || 'https://social-media-backend-s3qe.onrender.com'
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
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { '*': '' }
        },
        '/verification': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { '*': '' }
        },
        '/auth': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { '*': '' }
        },
        '/chat': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: { '*': '' }
        },
        '/ws': {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
          secure: false
        }
      }
    }
  }
})
