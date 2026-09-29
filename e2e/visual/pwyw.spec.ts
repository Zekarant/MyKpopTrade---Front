import { test, expect, type Page } from '@playwright/test'
import { ME, NOW, OTHER, inventory, myProfile, otherProfile, postsOf } from './fixtures/profile'
import { connectedPayPal, pwywProduct } from './fixtures/pwyw'
import { mockApi, setupSession } from './support'

async function mockPwywApi(page: Page) {
  await setupSession(page, { now: NOW, userId: ME })
  await mockApi(page, (path) => {
    if (path === '/api/auth/profile' || path === '/api/users/me') return myProfile
    if (path === `/api/profiles/user/${OTHER}`) return otherProfile
    if (path.startsWith('/api/products/inventory/')) return inventory
    if (path === `/api/posts/user/${OTHER}`) return postsOf({ _id: OTHER, username: 'AliceK' })
    if (path === `/api/products/${pwywProduct._id}`) return { product: pwywProduct, isFavorite: false }
    if (path === '/api/payments/paypal/account-status') return connectedPayPal
    if (path === '/api/groups') return { groups: [{ _id: 'group-bts', name: 'BTS' }] }
    if (path.startsWith('/api/albums/group/')) return { albums: [] }
    return undefined
  })
}

/** Ouvre l'annonce prix libre depuis les annonces d'un autre vendeur. */
async function openPwywListing(page: Page) {
  await mockPwywApi(page)
  await page.goto(`/adherents/profile/${OTHER}`)
  await page.locator('.beta-banner__close').click()
  await page.locator('.btn-group .btn', { hasText: 'Annonces' }).click()
  await page.locator('.product-card').first().click()
  await expect(page.locator('.post-modal__pwyw')).toBeVisible()
  await page.waitForLoadState('networkidle')
}

async function openOfferWindow(page: Page) {
  await openPwywListing(page)
  await page.locator('.post-modal__btn', { hasText: 'Faire une offre' }).click()
  await expect(page.locator('.offer-modal')).toBeVisible()
}

test.describe('prix libre — rendu de référence', () => {
  test('réglage vendeur : fourchette de prix', async ({ page }) => {
    await mockPwywApi(page)
    const postData = { ...pwywProduct, seller: ME }
    await page.goto(`/adherents/modify?postData=${encodeURIComponent(JSON.stringify(postData))}`)
    await page.locator('.beta-banner__close').click()
    for (let step = 1; step < 4; step++) {
      await page.locator('.sell-nav .btn-primary', { hasText: 'Continuer' }).click()
    }
    await expect(page.locator('#pwywMin')).toHaveValue('5')
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page).toHaveScreenshot('seller-setting.png', { fullPage: true })
  })

  test('annonce : fourchette affichée', async ({ page }) => {
    await openPwywListing(page)
    await expect(page).toHaveScreenshot('listing-range.png')
  })

  test('fenêtre d\'offre', async ({ page }) => {
    await openOfferWindow(page)
    await expect(page).toHaveScreenshot('offer-window.png')
  })

  test('fenêtre d\'offre : montant hors fourchette', async ({ page }) => {
    await openOfferWindow(page)
    await page.locator('#offerAmount').fill('2')
    await expect(page.locator('.offer-error')).toHaveText('Le prix libre commence à 5 €.')
    await expect(page).toHaveScreenshot('offer-out-of-range.png')
  })
})
