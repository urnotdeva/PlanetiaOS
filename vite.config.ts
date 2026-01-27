import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootPath = decodeURIComponent(new URL('./', import.meta.url).pathname).replace(/\/+$/, '');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: 'localhost',
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    }
  },
  resolve: {
    alias: [
      { find: '@', replacement: rootPath },
      { find: '@/components', replacement: `${rootPath}/Components` },
      { find: '@/api', replacement: `${rootPath}/api` },
      { find: '@/utils', replacement: `${rootPath}/utils.ts` }
    ]
  }
});
