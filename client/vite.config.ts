import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  build: {
    rolldownOptions: {
      output: {
        // Libraries in their own chunks: they rarely change, so browsers keep them cached across deploys.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'router', test: /node_modules[\\/](react-router|@remix-run)/ },
            { name: 'query', test: /node_modules[\\/]@tanstack/ },
            { name: 'socket', test: /node_modules[\\/](socket\.io-client|engine\.io-client|socket\.io-parser|engine\.io-parser|@socket\.io)/ },
            { name: 'forms', test: /node_modules[\\/](zod|react-hook-form|@hookform)/ },
            { name: 'icons', test: /node_modules[\\/]lucide-react/ },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/socket.io': { target: 'http://localhost:4000', ws: true },
    },
  },
});
