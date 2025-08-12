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
    host: '0.0.0.0', 
    port: 5174,
    allowedHosts: ['nodes-production-2b39.up.railway.app']
  },
  
  preview: {
    host: '0.0.0.0',  
    port: 5174,
    allowedHosts: true
  },
  
  define: {
    //'process.env': process.env
    'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL)
  },
  
  optimizeDeps: {
    include: ['@zxing/library']
  }
})
