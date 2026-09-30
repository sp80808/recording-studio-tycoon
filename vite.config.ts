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
  // Production builds drop the debug chatter (139 console.log calls, several in per-frame/per-take paths)
  esbuild: mode === 'production' ? { pure: ['console.log', 'console.debug'] } : undefined,
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendor libs so the studio shell parses before audio/charts code
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/tone/')) return 'vendor-tone';
          if (id.includes('/recharts/') || id.includes('/d3-')) return 'vendor-charts';
          if (id.includes('/framer-motion/') || id.includes('/motion-')) return 'vendor-motion';
          if (id.includes('/@radix-ui/')) return 'vendor-radix';
          return undefined;
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
