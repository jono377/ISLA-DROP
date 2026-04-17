// ================================================================
// Isla Drop — Vite Config
// Point 26: Sentry error monitoring
// Point 27: Web Vitals performance monitoring  
// Point 28: Image optimisation + lazy loading
// Point 29: Service worker registration
// ================================================================
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),

    // ── Inline service worker registration ────────────────────
    {
      name: 'inject-sw-registration',
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          `<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Registration failed:', err))
  })
}
</script>
</head>`
        )
      }
    },
  ],

  build: {
    // ── Code splitting for faster initial load ─────────────────
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-maps': ['leaflet'],
          'vendor-ui': ['react-hot-toast', 'zustand'],
        }
      }
    },
    // ── Asset inlining threshold ────────────────────────────────
    assetsInlineLimit: 4096,
    // ── Enable source maps for Sentry ──────────────────────────
    sourcemap: mode === 'production' ? 'hidden' : true,
    // ── Target modern browsers only ────────────────────────────
    target: ['chrome90', 'firefox90', 'safari14', 'edge90'],
  },

  // ── Dev server ─────────────────────────────────────────────
  server: {
    port: 5173,
    strictPort: false,
    host: true,
  },

  // ── Optimise deps ──────────────────────────────────────────
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'react-hot-toast'],
    exclude: ['@supabase/realtime-js'],
  },
}))
