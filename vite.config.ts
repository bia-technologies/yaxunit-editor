import { defineConfig } from 'vite'
import { viteSingleFile } from "vite-plugin-singlefile"
import wasm from "vite-plugin-wasm"

export default defineConfig({
  build: {
    target: 'es2018',
  },
  esbuild: {
    // Configure this value when the browser version of the development environment is lower
    target: 'es2018',
    include: /\.(ts|jsx|tsx)$/,
  },
  plugins: [
    wasm(),
    // viteSingleFile()
  ],  optimizeDeps: {
    exclude: [
      "web-tree-sitter"
    ]
  },
  assetsInclude: ['/assets/*.wasm'],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
