import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Root '/' for local dev + Vercel; the GitHub Pages workflow sets VITE_BASE=/ventory-/
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: parseInt(process.env.PORT ?? '5173'),
  },
})
