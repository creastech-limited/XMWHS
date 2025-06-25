import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  
  build: {
    outDir: 'dist'
  },
  
  server: {
    host: '0.0.0.0',  // Changed from 'localhost'
    port: 5174,
  },
  
  preview: {
    host: '0.0.0.0',  // Added for production preview
    port: 5174
  },
  
  define: {
    'process.env': process.env
  },
  
  optimizeDeps: {
    include: ['@zxing/library']
  }
})