import { defineConfig } from 'vite'
import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig({
  build: {
    target: 'es2018'
  },
  esbuild: {
    // Configure this value when the browser version of the development environment is lower
    target: 'es2018',
    include: /\.(ts|jsx|tsx)$/,
  },
  plugins: [
    viteSingleFile()
  ]
})