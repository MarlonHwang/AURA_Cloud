import { defineConfig } from 'vite';

export default defineConfig({
  // 개발 서버 설정
  server: {
    port: 5173,
    open: false, // Electron이 열기 때문에 브라우저 자동 열기 비활성화
  },

  // 빌드 설정
  build: {
    outDir: 'dist',
    sourcemap: true,
  },

  // 최적화 설정
  optimizeDeps: {
    include: ['tone', 'socket.io-client'],
  },
});
