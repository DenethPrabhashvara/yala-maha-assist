import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// `npm run dev:phone` serves https:// on the LAN with a self-signed certificate,
// because phones only allow GPS (needed for farm registration) on https:// pages.
export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === 'phone' && basicSsl()].filter(Boolean),
  base: './',
}));
