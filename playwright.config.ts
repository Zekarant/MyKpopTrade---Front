import { defineConfig, devices } from '@playwright/test'

/**
 * Tests de non-régression visuelle (captures d'écran de référence).
 *
 * L'API est entièrement simulée (e2e/visual/fixtures) : les captures ne
 * dépendent ni d'un back-end, ni d'une base de données, ni du réseau.
 * Mettre à jour les références après un changement visuel VOULU :
 *   npx playwright test --update-snapshots
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  expect: {
    toHaveScreenshot: {
      // Tolérance minimale pour l'anticrénelage des polices ; toute vraie
      // régression de mise en page dépasse largement ce seuil.
      maxDiffPixelRatio: 0.001,
      animations: 'disabled',
      caret: 'hide'
    }
  },
  use: {
    baseURL: 'http://localhost:5199',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    command: 'npx vite --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: true,
    timeout: 120_000,
    env: { VITE_API_URL: 'http://localhost:3999' }
  }
})
