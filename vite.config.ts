import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site under /<repo-name>/, so the base path must match.
export default defineConfig({
  base: '/backend-interview-forge/',
  plugins: [react()],
  worker: {
    format: 'es',
  },
});
