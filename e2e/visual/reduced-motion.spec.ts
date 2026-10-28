import { test, expect } from '@playwright/test'
import { NOW, ME, profile } from './fixtures/settings'
import { mockApi, setupSession } from './support'

/**
 * Préférence « réduire les animations » (activée pour tous les tests, voir
 * playwright.config.ts) : les animations sont coupées, sauf celles des
 * indicateurs de chargement, qui continuent de tourner lentement.
 */
test('réduire les animations — seuls les indicateurs de chargement tournent', async ({ page }) => {
  await setupSession(page, { now: NOW, userId: ME })
  await mockApi(page, (path) => (path === '/api/auth/profile' || path === '/api/users/me' ? profile : undefined))
  await page.goto('/adherents/settings?section=profil')
  await expect(page.locator('.settings-page__title')).toHaveText('Paramètres')

  const styles = await page.evaluate(() => {
    const classes = ['spin', 'spinner', 'cart-page__spinner', 'other']
    return classes.map((cls) => {
      const el = document.createElement('div')
      el.className = cls
      el.style.animationName = 'spin'
      document.body.append(el)
      const { animationIterationCount, animationDuration } = getComputedStyle(el)
      el.remove()
      return { cls, animationIterationCount, animationDuration }
    })
  })

  expect(styles).toEqual([
    { cls: 'spin', animationIterationCount: 'infinite', animationDuration: '1.5s' },
    { cls: 'spinner', animationIterationCount: 'infinite', animationDuration: '1.5s' },
    { cls: 'cart-page__spinner', animationIterationCount: 'infinite', animationDuration: '1.5s' },
    { cls: 'other', animationIterationCount: '1', animationDuration: '1e-05s' }
  ])
})
