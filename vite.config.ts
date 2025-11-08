import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : undefined,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      onwarn(warning, handler) {
        const isSignalRAnnotation = warning?.code === 'ANNOTATION_POSITION'
          && typeof warning?.id === 'string'
          && warning.id.includes('@microsoft/signalr/dist/esm/Utils.js');

        if (isSignalRAnnotation) {
          return;
        }

        handler(warning);
      }
    }
  }
}))