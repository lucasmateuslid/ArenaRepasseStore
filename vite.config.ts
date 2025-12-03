import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Garante caminhos relativos para ativos (css, js, imagens) funcionarem em qualquer subdiretório
  base: './', 
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})