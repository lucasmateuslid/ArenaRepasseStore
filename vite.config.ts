
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Essencial para builds que rodam em subpastas ou servidores de arquivos
  server: {
    host: true,
    port: 3000,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser', // Minificação mais agressiva para produção
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs no build de produção
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['@supabase/supabase-js', '@google/genai']
        }
      }
    }
  }
})
