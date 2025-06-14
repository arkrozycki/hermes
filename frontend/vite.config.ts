import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  define: {
    // Ensure env variables are properly exposed
    'process.env': {}
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  base: './',
  build: {
    outDir: 'dist-react',
  },
  server: {
    port: 3524,
    strictPort: true,
  },
  envPrefix: 'VITE_' // Ensure Vite picks up our env variables
});