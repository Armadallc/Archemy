import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { serviceWorkerPlugin } from "./vite-plugin-service-worker";

export default defineConfig({
  plugins: [
    react({
      // Ensure proper JSX runtime and Fast Refresh
      jsxRuntime: 'automatic',
    }),
    runtimeErrorOverlay(),
    serviceWorkerPlugin(), // Serve service worker with correct MIME type
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react/jsx-runtime', 
      '@tanstack/react-query',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-switch',
      '@radix-ui/react-dropdown-menu',
      'leaflet',
      'chart.js',
      'react-chartjs-2'
    ],
    exclude: [],
    force: true, // Force re-optimization on every start
    esbuildOptions: {
      // Ensure React is properly resolved
      jsx: 'automatic',
      // Ensure proper dependency resolution to avoid circular dependencies
      resolveExtensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "assets"),
      // Ensure single React instance - dedupe React
      "react": path.resolve(import.meta.dirname, "node_modules/react"),
      "react-dom": path.resolve(import.meta.dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(import.meta.dirname, "node_modules/react/jsx-runtime"),
      "react-is": path.resolve(import.meta.dirname, "node_modules/react-is"),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname, "client"),
  envDir: path.resolve(import.meta.dirname), // Look for .env in project root
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - separate large dependencies
          if (id.includes('node_modules')) {
            // CRITICAL: Force React into a single chunk to prevent multiple instances
            // This is especially important for Cursor's browser which seems to load multiple React versions
            if (id.includes('/react/') || 
                id.includes('/react-dom/') || 
                id.includes('/react/jsx-runtime') || 
                id.includes('/react-is/') || 
                id.includes('/scheduler/') ||
                id.includes('next-themes') || // Include next-themes to ensure it uses the same React instance
                id === 'react' ||
                id === 'react-dom') {
              // Force all React-related code into a single 'react-vendor' chunk
              return 'react-vendor';
            }
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-react-query';
            }
            // UI Libraries (Radix UI) - Keep together to avoid circular dependencies
            // All Radix UI packages share common dependencies and should be bundled together
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            // Icons (Lucide)
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // Date libraries
            if (id.includes('date-fns') || id.includes('react-day-picker')) {
              return 'vendor-dates';
            }
            // Router
            if (id.includes('wouter')) {
              return 'vendor-router';
            }
            // Other node_modules
            return 'vendor-other';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit after optimization
  },
  server: {
    host: '0.0.0.0', // Allow access from network (for mobile devices)
    port: 5173,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    middlewareMode: false,
    hmr: {
      protocol: 'ws',
      host: '0.0.0.0', // Allow HMR from network
      port: 5173,
      clientPort: 5173,
    },
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  // Configure MIME types for font files
  assetsInclude: ['**/*.woff2', '**/*.woff', '**/*.otf', '**/*.ttf'],
});
