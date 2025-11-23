import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',  // Use relative paths for assets (needed for file:// protocol in CEF)
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/auth/google': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/auth/me': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/auth/logout': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});
