import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// `npm run dev:phone` serves https:// on the LAN with a self-signed certificate,
// because phones only allow GPS (needed for farm registration) on https:// pages.
//
// /api is proxied to the Express API so the auth refresh cookie stays same-origin.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = { '/api': { target: env.AUTH_API_PROXY || 'http://127.0.0.1:8005', changeOrigin: true } };
  return {
    plugins: [react(), mode === 'phone' && basicSsl()].filter(Boolean),
    base: './',
    server: { proxy },
    preview: { proxy },
  };
});
