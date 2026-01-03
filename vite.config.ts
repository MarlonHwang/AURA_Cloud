import { defineConfig } from 'vite';
import { resolve } from 'path'; // [추가] 경로를 확실하게 잡기 위해 필요

export default defineConfig({
  // [FIX] 상대 경로 대신 절대 경로를 써서 Vite가 길을 잃지 않게 함
  root: resolve(__dirname, 'src/renderer'),
  base: './',

  resolve: {
    alias: {
      // [FIX] '@'를 쓰면 renderer 폴더를 가리키도록 설정
      '@': resolve(__dirname, 'src/renderer'),
      // [Magic Fix] 혹시 html이 '/src/main.ts'를 찾아도 실제 파일 위치로 연결해줌
      '/src': resolve(__dirname, 'src/renderer'),
    },
  },

  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    open: false,
  },

  build: {
    // [FIX] root가 바뀌었으므로 outDir 경로도 그에 맞춰 수정
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
  },

  optimizeDeps: {
    // [FIX] 음성 인식 관련 라이브러리 추가
    include: ['tone', 'socket.io-client', '@tensorflow/tfjs', '@tensorflow-models/speech-commands'],
  },
});
