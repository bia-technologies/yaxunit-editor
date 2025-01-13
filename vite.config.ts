import { defineConfig } from 'vite'
import { viteSingleFile } from "vite-plugin-singlefile"
// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "es2015",
    minify: true
  },
  plugins: [
    viteSingleFile()
  ],
  
})