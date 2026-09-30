import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  // Some dependencies expect a CommonJS-style `global` in the browser
  define: {
    global: 'window',
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy, rarely-changing vendors so phones parse/cache them independently of app code
        manualChunks: {
          pixi: ['pixi.js'],
          tone: ['tone'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
