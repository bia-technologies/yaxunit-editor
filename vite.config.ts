import { defineConfig } from 'vite'
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "ES6",
    minify: true
  },
  plugins: [
    viteSingleFile()
  ],
  
})