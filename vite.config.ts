import { defineConfig } from 'vite';

export default defineConfig({
  // ê°œë°œ ?œë²„ ?¤ì •
  server: {
    port: 5173,
    open: false, // Electron???´ê¸° ?Œë¬¸??ë¸Œë¼?°ì? ?ë™ ?´ê¸° ë¹„í™œ?±í™”
  },

  // ë¹Œë“œ ?¤ì •
  build: {
    outDir: 'dist',
    sourcemap: true,
  },

  // ìµœì ???¤ì •
  optimizeDeps: {
    include: ['tone', 'socket.io-client'],
  },
});
