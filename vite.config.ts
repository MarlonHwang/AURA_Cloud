import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/renderer',
  base: './',

  server: {
    host: '127.0.0.1', // [FIX] Force IPv4 (Fixes "Cannot connect")
    port: 5173,
    strictPort: true,
    open: false, // [FIX] Disable Auto-open (Electron Mode)
  },

  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    sourcemap: true,
  },

  optimizeDeps: {
    include: ['tone', 'socket.io-client'],
  },
});
