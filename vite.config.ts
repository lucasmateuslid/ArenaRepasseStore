
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base relativa './' garante que o index.html encontre o JS/CSS
  // mesmo se o site estiver rodando em https://dominio.com/subpasta/id-louco/
  base: './', 
  server: {
    host: true // Necessário para expor a porta em ambientes docker/cloud
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
