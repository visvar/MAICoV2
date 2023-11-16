import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  base:"",//"/maico/"
  plugins: [svelte()],
  build: { chunkSizeWarningLimit: 6000, }
})
