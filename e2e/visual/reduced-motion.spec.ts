import { test, expect, type Locator } from '@playwright/test'
import { ME, NOW, currentUser } from './fixtures/messaging'
import { mockApi, setupSession } from './support'

/**
 * Préférence « réduire les animations » (activée pour tous les tests, voir
 * playwright.config.ts) : les animations sont coupées, sauf celles des
 * indicateurs de chargement, qui continuent de tourner lentement.
 */

const iterations = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).animationIterationCount)

test('réduire les animations — les indicateurs de chargement tournent toujours', async ({ page }) => {
  await setupSession(page, { now: NOW, userId: ME })
  // La liste des conversations ne répond jamais : l'écran reste en chargement.
  await mockApi(page, (path) => {
    if (path === '/api/users/me' || path === '/api/auth/profile') return currentUser
    if (path === '/api/messaging/' || path === '/api/messaging') return new Promise(() => {})
    return undefined
  })
  await page.goto('/adherents/messages')

  const icon = page.locator('.loading .spin').first()
  await expect(icon).toBeVisible()
  expect(await iterations(icon)).toBe('infinite')

  // Les autres animations restent coupées (une seule itération, quasi instantanée).
  await page.evaluate(() => {
    const el = document.createElement('div')
    el.id = 'other-animation'
    el.style.animation = 'spin 1s linear infinite'
    document.body.append(el)
  })
  expect(await iterations(page.locator('#other-animation'))).toBe('1')
})
