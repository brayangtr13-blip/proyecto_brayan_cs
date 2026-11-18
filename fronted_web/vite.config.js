// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()], // tailwindcss(): genera las clases de Tailwind al compilar
  server: {
    port: 5173,
    open: true // Abre automáticamente el navegador
  },
  define: {
    'process.env': {} // Para compatibilidad con variables de entorno
  }
})
