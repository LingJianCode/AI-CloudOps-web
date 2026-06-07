import { defineConfig } from '@vben/vite-config';
import path from 'path'; // 引入 path 模块

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api/v1': {
            changeOrigin: true,
            target: 'http://localhost:8080',
            ws: true,
          },
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            target: 'http://localhost:8889/api',
            ws: true,
          },
        },
      },
      resolve: {
        alias: {
          '#': path.resolve(__dirname, 'src'),
        },
      },
    },
  };
});
