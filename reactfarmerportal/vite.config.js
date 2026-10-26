import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Auth goes through the dev server so the refresh-token cookie (SameSite=Strict) is same-origin.
  const authTarget = env.AUTH_PROXY_TARGET || 'http://127.0.0.1:8005';

  return {
    plugins: [react()],
    base: './',
    server: {
      proxy: {
        '/api/auth': { target: authTarget, changeOrigin: true },
      },
    },
    preview: {
      proxy: {
        '/api/auth': { target: authTarget, changeOrigin: true },
      },
    },
  };
});
