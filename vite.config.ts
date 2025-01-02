import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@c': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@c_a': fileURLToPath(new URL('./src/components/adherents', import.meta.url)),
      '@p': fileURLToPath(new URL('./src/pages', import.meta.url)),    
      '@css': fileURLToPath(new URL('./src/css', import.meta.url)),
    }
  }
})
