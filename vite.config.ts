
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import process from 'node:process';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.JPG', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'MH Trading Journal Pro',
        short_name: 'MH Trade',
        description: '專業加密貨幣交易心理筆記本',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo.JPG',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'logo.JPG',
            sizes: '512x512',
            type: 'image/jpeg'
          },
          {
            src: 'logo.JPG',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1500, // 提高上限至 1.5MB，消除 Vercel Logs 中的黃色警告
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-ai': ['@google/genai']
        }
      }
    }
  }
});
