import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  define: {
    // amazon-cognito-identity-js expects Node's `global` — doesn't exist in the browser.
    global: 'globalThis',
  },
})
