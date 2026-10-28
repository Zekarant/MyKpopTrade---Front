import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'

/** Comportements de la page Paramètres que les captures d'écran ne voient pas. */

const http = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  delete: vi.fn()
}))
const toast = vi.hoisted(() => ({ showToastSuccess: vi.fn(), showToastError: vi.fn() }))
const nav = vi.hoisted(() => ({ route: { query: {} as Record<string, string> } }))

vi.mock('@/services/http', async () => ({
  createApiClient: (await import('@/test-utils/routedApiClient')).routedApiClient(http),
  ensureAccessToken: vi.fn(async () => 'token')
}))
vi.mock('vue-router', () => ({
  useRoute: () => nav.route,
  useRouter: () => ({ replace: ({ query }: { query: Record<string, string> }) => { nav.route.query = query } })
}))
vi.mock('@/function', () => ({ func: toast }))
vi.mock('@/services/payment.service', () => ({
  default: { getPayPalAccountStatus: vi.fn(async () => ({ connected: false, scopes: [] })) }
}))
vi.mock('@/components/adherents/nav_bar.vue', () => ({ default: { template: '<nav />' } }))
vi.mock('@/components/adherents/TwoFactorCard.vue', () => ({ default: { template: '<div />' } }))

import SettingsPage from '../settings.vue'

const savedProfile = () => ({
  _id: 'me',
  username: 'MoiMeme',
  email: 'moi@example.com',
  isEmailVerified: false,
  bio: 'Bio enregistrée',
  phoneNumber: '+33612345678',
  isPhoneVerified: true,
  legalName: 'Camille Durand',
  preferences: { allowDirectMessages: true },
  accountStatus: 'active'
})

async function mountPage() {
  nav.route = reactive({ query: {} })
  const wrapper = mount(SettingsPage, {
    attachTo: document.body,
    global: {
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
      mocks: { $router: { back: vi.fn() } }
    }
  })
  await flushPromises()
  return wrapper
}

async function openSection(wrapper: Awaited<ReturnType<typeof mountPage>>, label: string) {
  const button = wrapper.findAll('.settings-nav__item').find((b) => b.text() === label)
  await button!.trigger('click')
  await flushPromises()
}

describe('page Paramètres', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    http.get.mockImplementation(async (url: string) => {
      if (url === '/api/auth/profile') return { data: { user: savedProfile() } }
      if (url === '/api/users/me/notification-preferences') {
        const on = { email: true, push: true }
        return { data: { preferences: { orders: on, offers: on, messages: on, disputes: on, reviews: on, social: on } } }
      }
      if (url === '/api/users/me/blocked') return { data: { blockedUsers: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } } }
      throw new Error(`GET inattendu : ${url}`)
    })
    http.put.mockImplementation(async (_url: string, body: Record<string, unknown>) => ({
      data: { user: body }
    }))
    http.post.mockResolvedValue({ data: {} })
  })

  it('remplit le formulaire du profil avec les valeurs enregistrées', async () => {
    const wrapper = await mountPage()
    expect((wrapper.find('#settings-bio').element as HTMLTextAreaElement).value).toBe('Bio enregistrée')
    expect(wrapper.find('.save-bar').exists()).toBe(false)
  })

  it('conserve une saisie non enregistrée quand on change de section', async () => {
    const wrapper = await mountPage()
    await wrapper.find('#settings-bio').setValue('Brouillon')
    expect(wrapper.find('.save-bar').exists()).toBe(true)

    await openSection(wrapper, 'Sécurité')
    expect(wrapper.find('#settings-bio').exists()).toBe(false)
    expect(wrapper.find('.save-bar').exists()).toBe(false)

    await openSection(wrapper, 'Profil public')
    expect((wrapper.find('#settings-bio').element as HTMLTextAreaElement).value).toBe('Brouillon')
    expect(wrapper.find('.save-bar').exists()).toBe(true)
  })

  it('une mise à jour partielle ailleurs n\'écrase pas la saisie en cours', async () => {
    const wrapper = await mountPage()
    await wrapper.find('#settings-bio').setValue('Brouillon')

    await openSection(wrapper, 'Compte')
    const phoneBadge = () => wrapper.find('.setting-row--column .setting-badge--success')
    expect(phoneBadge().exists()).toBe(true)

    await wrapper.find('input[type="tel"]').setValue('06 11 22 33 44')
    http.put.mockResolvedValueOnce({ data: { user: { phoneNumber: '+33611223344' } } })
    await wrapper.findAll('.btn-settings').find((b) => b.text() === 'Enregistrer')!.trigger('click')
    await flushPromises()

    expect((wrapper.find('input[type="tel"]').element as HTMLInputElement).value).toBe('+33611223344')
    expect(phoneBadge().exists()).toBe(false)

    await openSection(wrapper, 'Profil public')
    expect((wrapper.find('#settings-bio').element as HTMLTextAreaElement).value).toBe('Brouillon')
  })

  it('un rechargement du profil resynchronise les champs de toutes les sections', async () => {
    const wrapper = await mountPage()
    await openSection(wrapper, 'Compte')
    await wrapper.find('input[type="tel"]').setValue('0700000000')

    await openSection(wrapper, 'Profil public')
    await wrapper.find('#settings-bio').setValue('Brouillon')

    // L'envoi d'un avatar recharge le profil.
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'a.png', { type: 'image/png' })] })
    await input.trigger('change')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/api/profiles/me/picture', expect.any(FormData))
    expect((wrapper.find('#settings-bio').element as HTMLTextAreaElement).value).toBe('Bio enregistrée')
    await openSection(wrapper, 'Compte')
    expect((wrapper.find('input[type="tel"]').element as HTMLInputElement).value).toBe('+33612345678')
  })

  it('redemande l\'email de vérification pour l\'adresse du compte', async () => {
    const wrapper = await mountPage()
    await openSection(wrapper, 'Compte')

    await wrapper.findAll('.btn-settings').find((b) => b.text() === 'Vérifier')!.trigger('click')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/api/auth/resend-verification', { email: 'moi@example.com' })
  })

  it('changer d\'email exige le mot de passe actuel', async () => {
    const wrapper = await mountPage()
    await openSection(wrapper, 'Compte')
    expect(wrapper.find('#settings-current-password').exists()).toBe(false)

    await wrapper.find('#settings-email').setValue('nouveau@example.com')
    expect(wrapper.find('#settings-current-password').exists()).toBe(true)
    expect(wrapper.text()).toContain('Compte créé avec Google ou Discord')

    await wrapper.find('#settings-current-password').setValue('Secret1!')
    await wrapper.findAll('.btn-settings').find((b) => b.text() === 'Changer l\'adresse')!.trigger('click')
    await flushPromises()

    expect(http.put).toHaveBeenCalledWith('/api/auth/profile', {
      email: 'nouveau@example.com',
      currentPassword: 'Secret1!'
    })
    // L'adresse enregistrée devient la référence : le champ mot de passe disparaît.
    expect(wrapper.find('#settings-current-password').exists()).toBe(false)
    expect(wrapper.text()).toContain('nouveau@example.com')
  })

  it('un mot de passe actuel refusé s\'affiche sous le champ, sans fermer la session', async () => {
    const wrapper = await mountPage()
    await openSection(wrapper, 'Compte')
    await wrapper.find('#settings-email').setValue('nouveau@example.com')
    await wrapper.find('#settings-current-password').setValue('mauvais')
    http.put.mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Mot de passe actuel incorrect', code: 'CURRENT_PASSWORD_INVALID' } }
    })

    await wrapper.findAll('.btn-settings').find((b) => b.text() === 'Changer l\'adresse')!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.field__error').text()).toBe('Mot de passe actuel incorrect')
    expect(toast.showToastError).not.toHaveBeenCalled()
  })

  it('lie un compte avec un ticket à usage unique, jamais avec le jeton d\'accès', async () => {
    const wrapper = await mountPage()
    await openSection(wrapper, 'Sécurité')
    http.post.mockResolvedValueOnce({ data: { ticket: 'ticket-unique' } })

    await wrapper.findAll('.setting-row').find((row) => row.text().includes('Google'))!.trigger('click')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/api/auth/link/google')
  })

  describe('anonymisation', () => {
    const anonymizeButton = (wrapper: Awaited<ReturnType<typeof mountPage>>) =>
      wrapper.findAll('.btn-settings').find((b) => b.text() === 'Anonymiser définitivement')!

    async function openAnonymize() {
      const wrapper = await mountPage()
      await openSection(wrapper, 'Confidentialité')
      await wrapper.findAll('.btn-settings').find((b) => b.text() === 'Anonymiser mes données')!.trigger('click')
      return wrapper
    }

    it('exige le mot de passe actuel puis recharge le profil', async () => {
      const wrapper = await openAnonymize()
      expect(anonymizeButton(wrapper).attributes('disabled')).toBeDefined()
      http.post.mockResolvedValueOnce({ data: { message: 'Données anonymisées' } })

      await wrapper.find('#settings-anonymize-password').setValue('Secret1!')
      await anonymizeButton(wrapper).trigger('click')
      await flushPromises()

      expect(http.post).toHaveBeenCalledWith('/api/users/me/anonymize', { confirmation: true, currentPassword: 'Secret1!' })
      expect(toast.showToastSuccess).toHaveBeenCalledWith('Données anonymisées')
      expect(http.get.mock.calls.filter(([url]) => url === '/api/auth/profile')).toHaveLength(2)
    })

    it('un mot de passe refusé s\'affiche sous le champ, sans fermer la session', async () => {
      const wrapper = await openAnonymize()
      await wrapper.find('#settings-anonymize-password').setValue('mauvais')
      http.post.mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Mot de passe actuel incorrect', code: 'CURRENT_PASSWORD_INVALID' } }
      })

      await anonymizeButton(wrapper).trigger('click')
      await flushPromises()

      expect(wrapper.find('.field__error').text()).toBe('Mot de passe actuel incorrect')
      expect(toast.showToastError).not.toHaveBeenCalled()
    })
  })

  it('l\'interrupteur des messages directs revient en arrière si l\'API échoue', async () => {
    const wrapper = await mountPage()
    await openSection(wrapper, 'Préférences')
    http.put.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Indisponible' } } })

    const toggle = wrapper.find('.toggle input')
    await toggle.setValue(false)
    await flushPromises()

    expect((toggle.element as HTMLInputElement).checked).toBe(true)
    expect(toast.showToastError).toHaveBeenCalledWith('Indisponible')
  })
})
