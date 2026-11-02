import { defineConfig } from 'vite';

// Relative base so the same build works at a repository subpath (GitHub Pages)
// and at a host root.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 900 },
});
