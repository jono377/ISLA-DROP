import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['mapbox-gl'],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mapbox': ['mapbox-gl', 'react-map-gl'],
          'stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
