import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import path from 'path'

// ZonaSipil Structure is an independently deployed ZonaSipil application
// (migrated from STRUKTURA, formerly a GitHub Pages project site).
// It is served from its own project root; platform routing to
// zonasipil.web.id/apps/structure is a platform-layer concern.
export default defineConfig({
  base: '/',
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
})
