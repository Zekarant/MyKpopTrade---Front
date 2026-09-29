import { test, expect, type Page } from '@playwright/test'
import { ME, NOW, OTHER, followers, inventory, myProfile, otherProfile, postDetail, postsOf, reviews } from './fixtures/profile'
import { mockApi, setupSession } from './support'

async function openProfile(page: Page, who: 'me' | typeof OTHER) {
  await setupSession(page, { now: NOW, userId: ME })
  await mockApi(page, (path) => {
    if (path === '/api/auth/profile' || path === '/api/users/me') return myProfile
    if (path === `/api/profiles/user/${OTHER}`) return otherProfile
    if (path.startsWith('/api/products/inventory/')) return inventory
    if (path === `/api/posts/user/${ME}`) return postsOf({ _id: ME, username: 'MoiMeme' })
    if (path === `/api/posts/user/${OTHER}`) return postsOf({ _id: OTHER, username: 'AliceK' })
    if (path === '/api/posts/post-1') return postDetail
    if (path.startsWith('/api/profiles/ratings/')) return reviews
    if (/^\/api\/follows\/[^/]+\/followers$/.test(path)) return followers
    if (/^\/api\/follows\/[^/]+\/following$/.test(path)) return { following: [], total: 5 }
    if (/^\/api\/follows\/[^/]+\/status$/.test(path)) return { isFollowing: false }
    return undefined
  })
  await page.goto(`/adherents/profile/${who}`)
  await expect(page.locator('.feed-post')).toHaveCount(2)
  // Le bandeau bêta, fixé en bas, masquerait une partie du contenu capturé.
  await page.locator('.beta-banner__close').click()
  await page.waitForLoadState('networkidle')
}

async function openTab(page: Page, label: string) {
  await page.locator('.btn-group .btn', { hasText: label }).click()
  await page.waitForLoadState('networkidle')
}

/** Capture depuis le haut : un clic peut faire défiler la page et décaler les éléments fixes. */
async function snap(page: Page, name: string) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page).toHaveScreenshot(name, { fullPage: true })
}

test.describe('profil — rendu de référence', () => {
  test('mon profil : publications', async ({ page }) => {
    await openProfile(page, 'me')
    await snap(page, 'me-posts.png')
  })

  test('mon profil : réponses d\'une publication', async ({ page }) => {
    await openProfile(page, 'me')
    await page.locator('.feed-post').first().locator('.feed-post__action').nth(1).click()
    await expect(page.locator('.feed-reply')).toHaveCount(1)
    await snap(page, 'me-post-replies.png')
  })

  test('mon profil : annonces', async ({ page }) => {
    await openProfile(page, 'me')
    await openTab(page, 'Annonces')
    await snap(page, 'me-listings.png')
  })

  test('mon profil : à propos', async ({ page }) => {
    await openProfile(page, 'me')
    await openTab(page, 'À propos')
    await snap(page, 'me-about.png')
  })

  test('mon profil : avis', async ({ page }) => {
    await openProfile(page, 'me')
    await openTab(page, 'Avis')
    await expect(page.locator('.review-item')).toHaveCount(2)
    await snap(page, 'me-reviews.png')
  })

  test('mon profil : réponse à un avis', async ({ page }) => {
    await openProfile(page, 'me')
    await openTab(page, 'Avis')
    await page.locator('.review-item__respond-btn').click()
    await expect(page.locator('.response-popup')).toBeVisible()
    await snap(page, 'me-review-response.png')
  })

  test('mon profil : abonnés', async ({ page }) => {
    await openProfile(page, 'me')
    await openTab(page, 'Abonnés')
    await expect(page.locator('.follower-card')).toHaveCount(2)
    await snap(page, 'me-followers.png')
  })

  test('mon profil : wishlist', async ({ page }) => {
    await openProfile(page, 'me')
    await openTab(page, 'Wishlist')
    await snap(page, 'me-wishlist.png')
  })

  test('autre profil : publications', async ({ page }) => {
    await openProfile(page, OTHER)
    await snap(page, 'other-posts.png')
  })

  test('autre profil : annonces', async ({ page }) => {
    await openProfile(page, OTHER)
    await openTab(page, 'Annonces')
    await snap(page, 'other-listings.png')
  })

  test('autre profil : à propos', async ({ page }) => {
    await openProfile(page, OTHER)
    await openTab(page, 'À propos')
    await snap(page, 'other-about.png')
  })

  test('autre profil : signalement', async ({ page }) => {
    await openProfile(page, OTHER)
    await page.locator('.profile-report-btn').click()
    await page.waitForLoadState('networkidle')
    await snap(page, 'other-report.png')
  })
})
