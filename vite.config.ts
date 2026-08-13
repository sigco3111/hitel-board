import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // base: '/' — Vercel root context 호스팅용 (tech-toolkit-hub 71f + DevCanvas 패턴)
      base: '/',
      define: {
        // 사용되지 않는 API 키 참조 제거
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      css: {
        postcss: './postcss.config.js'
      }
    };
});
