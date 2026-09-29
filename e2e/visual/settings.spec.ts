import { test, expect, type Page } from '@playwright/test'
import { ME, NOW, paypalStatus, profile, twoFactorStatus } from './fixtures/settings'
import { mockApi, setupSession } from './support'

async function openSettings(page: Page, section: string) {
  await setupSession(page, { now: NOW, userId: ME })
  await mockApi(page, (path, method) => {
    if (path === '/api/auth/profile' || path === '/api/users/me') return profile
    if (path === '/api/payments/paypal/account-status') return paypalStatus
    if (path === '/api/auth/2fa/status') return twoFactorStatus
    // Aucune demande de vérification d'identité : premier dépôt.
    if (path.startsWith('/api/verification/identity/status')) return { __status: 404, message: 'Aucune demande' }
    if (path === '/api/auth/send-phone-verification' && method === 'POST') return { message: 'Code envoyé' }
    return undefined
  })
  await page.goto(`/adherents/settings?section=${section}`)
  await expect(page.locator('.settings-page__title')).toHaveText('Paramètres')
  await page.waitForLoadState('networkidle')
}

const snap = (page: Page, name: string) => expect(page).toHaveScreenshot(name, { fullPage: true })

test.describe('paramètres — rendu de référence', () => {
  for (const section of ['profil', 'securite', 'compte', 'paiements', 'preferences', 'donnees']) {
    test(`section « ${section} »`, async ({ page }) => {
      await openSettings(page, section)
      await snap(page, `section-${section}.png`)
    })
  }

  test('profil modifié : barre d\'enregistrement', async ({ page }) => {
    await openSettings(page, 'profil')
    await page.locator('textarea').first().fill('Nouvelle présentation')
    await expect(page.locator('.save-bar')).toBeVisible()
    await snap(page, 'profil-save-bar.png')
  })

  test('formulaire de mot de passe', async ({ page }) => {
    await openSettings(page, 'securite')
    await page.locator('.setting-row--clickable', { hasText: 'Changer le mot de passe' }).click()
    await expect(page.locator('.password-form')).toBeVisible()
    await snap(page, 'securite-password.png')
  })

  test('étape du code SMS', async ({ page }) => {
    await openSettings(page, 'compte')
    await page.locator('.btn-settings', { hasText: 'Vérifier' }).first().click()
    await expect(page.locator('input[autocomplete="one-time-code"]')).toBeVisible()
    await snap(page, 'compte-sms-code.png')
  })

  test('formulaire de vérification d\'identité', async ({ page }) => {
    await openSettings(page, 'compte')
    await page.locator('.setting-row--clickable', { hasText: 'Identité vérifiée' }).click()
    await expect(page.locator('.identity-form')).toBeVisible()
    await snap(page, 'compte-identity-form.png')
  })

  test('fenêtre de pré-remplissage PayPal', async ({ page }) => {
    await openSettings(page, 'paiements')
    await page.locator('.btn-settings', { hasText: 'Connecter mon compte PayPal' }).click()
    await expect(page.locator('.modal-card')).toBeVisible()
    await snap(page, 'paiements-paypal-modal.png')
  })

  test('confirmation de suppression du compte', async ({ page }) => {
    await openSettings(page, 'donnees')
    await page.locator('.btn-settings--danger', { hasText: 'Supprimer mon compte' }).click()
    await expect(page.locator('.delete-confirm')).toBeVisible()
    await snap(page, 'donnees-delete-confirm.png')
  })
})
