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
  server: {
    port: 8080
  },
  build: {
    rolldownOptions: {
      treeshake: {
        // console.log / console.debug sont retirés du build de production :
        // déclarés « purs », leurs appels disparaissent au tree-shaking.
        // console.warn / console.error restent, pour le diagnostic en prod.
        manualPureFunctions: ['console.log', 'console.debug']
      }
    }
  },
  // Toute modification ici se reporte dans `paths` de tsconfig.app.json.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@c': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@c_a': fileURLToPath(new URL('./src/components/adherents', import.meta.url)),
      '@p_v': fileURLToPath(new URL('./src/views/adherents', import.meta.url)),
      '@css': fileURLToPath(new URL('./src/css', import.meta.url)),
    }
  }
})
