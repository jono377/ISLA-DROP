import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React + routing
          'vendor-react': ['react', 'react-dom'],
          // Toast library
          'vendor-toast': ['react-hot-toast'],
          // Core customer app features
          'features-core': [
            './src/components/customer/CustomerFeatures_16',
            './src/components/customer/CustomerFeatures_extra',
            './src/components/customer/CustomerFeatures_polish',
          ],
          // World features (loyalty, notifications, etc.)
          'features-world': [
            './src/components/customer/CustomerFeatures_world',
            './src/components/customer/CustomerFeatures_15',
          ],
          // Final + getir features
          'features-final': [
            './src/components/customer/CustomerFeatures_final',
            './src/components/customer/CustomerFeatures_getir',
            './src/components/customer/CustomerFeatures_v2',
            './src/components/customer/CustomerFeatures_launch',
          ],
          // New features
          'features-new': [
            './src/components/customer/CustomerFeatures_world2',
            './src/components/customer/CustomerFeatures_polish2',
            './src/components/customer/CustomerFeatures_perf',
          ],
          // Heavy AI sections (lazy-loaded)
          'features-concierge': [
            './src/components/customer/Concierge_final',
            './src/components/customer/AssistBot',
            './src/components/customer/PartyBuilder',
          ],
        },
      },
    },
    // Target modern browsers (smaller bundle)
    target: 'es2020',
    // Minify for production
    minify: 'esbuild',
    // Remove console.log in production
    esbuildOptions: {
      drop: ['console', 'debugger'],
    },
    // Warn if chunks > 500kb
    chunkSizeWarningLimit: 500,
  },
  // Faster local dev
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-hot-toast'],
  },
})
