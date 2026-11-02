import { defineConfig } from 'vite';

// Relative base so the same build works at a repository subpath (GitHub Pages)
// and at a host root.
// The entry page lives in site/ so the repository root can hold a plain
// forwarding page; public/ and the output folders stay at the repository root.
export default defineConfig({
  root: 'site',
  publicDir: '../public',
  base: './',
  build: { outDir: '../dist', emptyOutDir: true, chunkSizeWarningLimit: 900 },
});
