import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    root: fileURLToPath(new URL('./src', import.meta.url)),
    build: {
      outDir: '../dist'
    },
    server: {
      port: 8080
    },
    test: {
      environment: 'jsdom',
      // Un seul jsdom par worker, isolation par fichier conservée : ~5 s au lieu de ~30 s.
      pool: 'vmThreads',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url))
    }
  })
)
