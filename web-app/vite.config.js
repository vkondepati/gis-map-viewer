const path = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  root: path.resolve(__dirname, '..'),
  server: {
    open: '/web-app/',
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '..', 'dist', 'web'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        web: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
