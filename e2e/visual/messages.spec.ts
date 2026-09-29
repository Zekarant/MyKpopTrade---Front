import { test, expect, type Page } from '@playwright/test'
import { ME, NOW, conversations, conversationDetailFor, currentUser } from './fixtures/messaging'
import { mockApi, setupSession } from './support'

/**
 * Non-régression visuelle de la messagerie : références prises AVANT le
 * découpage de MessagesView.vue en sous-composants. Toute différence de mise
 * en page fait échouer le test.
 */

async function openMessaging(page: Page) {
  await setupSession(page, { now: NOW, userId: ME })
  await mockApi(page, (path, method, url) => {
    if (path === '/api/users/me' || path === '/api/auth/profile') return currentUser
    if (path === '/api/messaging/attachment-token') return { token: 'test-attachment', expiresIn: 3600 }
    if (path === '/api/messaging/' || path === '/api/messaging') {
      return { conversations, pagination: { page: 1, pages: 1, total: conversations.length } }
    }
    const detail = path.match(/^\/api\/messaging\/(conv-[\w-]+)$/)
    if (detail && method === 'GET') {
      // Comme la vraie API : au-delà de la dernière page, plus aucun message.
      const page = Number(url.searchParams.get('page') ?? 1)
      const body = conversationDetailFor(detail[1])
      return page > 1 ? { ...body, messages: [] } : body
    }
    return undefined
  })
  await page.goto('/adherents/messages')
  await expect(page.locator('.messages-area .message')).toHaveCount(6)
  await page.waitForLoadState('networkidle')
}

/**
 * Sur mobile, la discussion ouverte recouvre la liste (comportement voulu) :
 * on revient à la liste avec le bouton retour, comme un utilisateur.
 */
async function showConversationList(page: Page) {
  const back = page.locator('.chat-header .back-btn')
  if (await back.isVisible()) {
    await back.click()
    await expect(page.locator('.chat-area.active')).toHaveCount(0)
  }
}

test.describe('messagerie — rendu de référence', () => {
  test('vue par défaut : liste, conversation ouverte, offres, barre latérale', async ({ page }) => {
    await openMessaging(page)
    await expect(page).toHaveScreenshot('default.png', { fullPage: true })
  })

  test('onglet « Archivées »', async ({ page }) => {
    await openMessaging(page)
    await showConversationList(page)
    await page.locator('.tab', { hasText: 'Archivées' }).click()
    await expect(page.locator('.conversation-item')).toHaveCount(1)
    await expect(page).toHaveScreenshot('tab-archived.png', { fullPage: true })
  })

  test('recherche', async ({ page }) => {
    await openMessaging(page)
    await showConversationList(page)
    await page.locator('.search-input input').fill('merci')
    await expect(page.locator('.conversation-item')).toHaveCount(1)
    await expect(page).toHaveScreenshot('search.png', { fullPage: true })
  })

  test('menu d\'une conversation de la liste', async ({ page }) => {
    await openMessaging(page)
    await showConversationList(page)
    await page.locator('.conversation-item .action-dots-btn').first().click()
    await expect(page.locator('.conversation-dropdown')).toBeVisible()
    await expect(page).toHaveScreenshot('conversation-menu.png', { fullPage: true })
  })

  test('options de la discussion', async ({ page }) => {
    await openMessaging(page)
    await page.locator('.chat-actions .action-btn[title="Options"]').click()
    await expect(page.locator('.chat-actions .dropdown-menu')).toBeVisible()
    await expect(page).toHaveScreenshot('chat-options.png', { fullPage: true })
  })

  test('options de vente', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Bouton réservé à l\'affichage ordinateur')
    await openMessaging(page)
    await page.locator('.chat-actions .action-btn[title="sold"]').click()
    await expect(page.locator('.chat-actions .dropdown-menu')).toBeVisible()
    await expect(page).toHaveScreenshot('sales-options.png', { fullPage: true })
  })

  test('popup de refus d\'une offre reçue', async ({ page }) => {
    await openMessaging(page)
    await page.locator('.btns-offers button', { hasText: 'Refuser' }).click()
    await expect(page.locator('.popup-overlay .popup-title')).toHaveText('Refuser l\'offre')
    await expect(page).toHaveScreenshot('decline-offer.png', { fullPage: true })
  })

  test('visionneuse de pièces jointes', async ({ page }) => {
    await openMessaging(page)
    await page.locator('.message-attachement').first().click()
    await expect(page.locator('.popup-overlay .close-btn')).toBeVisible()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('image-viewer.png', { fullPage: true })
  })

  test('sélecteur d\'emojis', async ({ page }) => {
    await openMessaging(page)
    await page.locator('.emoji-btn').click()
    await expect(page.locator('.emoji-picker-popup')).toBeVisible()
    // Le clic fait défiler la page : la barre de navigation fixe apparaîtrait
    // à une hauteur variable dans une capture pleine page.
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page).toHaveScreenshot('emoji-picker.png', { fullPage: true })
  })

  test('panneau « Information » (mobile)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Panneau toujours visible sur ordinateur')
    await openMessaging(page)
    await page.locator('.chat-actions .action-btn[title="Options"]').click()
    await page.locator('.dropdown-item.information').click()
    await expect(page.locator('.right-sidebar.active')).toBeVisible()
    await expect(page).toHaveScreenshot('info-panel.png', { fullPage: true })
  })

  test('popup de contre-offre (vendeur)', async ({ page }, testInfo) => {
    await openMessaging(page)
    await showConversationList(page)
    await page.locator('.conversation-item', { hasText: 'DanBuyer' }).click()
    await expect(page.locator('.messages-area .message')).toHaveCount(2)
    if (testInfo.project.name === 'mobile') {
      await page.locator('.chat-actions .action-btn[title="Options"]').click()
      await page.locator('.dropdown-item.btn_mobile', { hasText: 'Faire une offre' }).click()
    } else {
      await page.locator('.chat-actions .action-btn[title="sold"]').click()
      await page.locator('.dropdown-item', { hasText: 'Faire une offre' }).click()
    }
    await expect(page.locator('.counter-popup-content')).toBeVisible()
    await expect(page).toHaveScreenshot('counter-offer.png', { fullPage: true })
  })

  test('autre conversation, sans produit', async ({ page }) => {
    await openMessaging(page)
    await showConversationList(page)
    await page.locator('.conversation-item', { hasText: 'BobCollect' }).click()
    await expect(page.locator('.messages-area .message')).toHaveCount(2)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('conversation-bob.png', { fullPage: true })
  })
})
