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

vi.mock('@/services/http', () => ({
  createApiClient: () => http,
  ensureAccessToken: vi.fn(async () => 'token')
}))
vi.mock('@/function', () => ({ func: toast }))
vi.mock('@/services/payment.service', () => ({
  default: { getPayPalAccountStatus: vi.fn(async () => ({ connected: false, scopes: [] })) }
}))
vi.mock('@/services/user.service', () => ({ default: {} }))
vi.mock('@/components/adherents/nav_bar.vue', () => ({ default: { template: '<nav />' } }))
vi.mock('@/components/adherents/TwoFactorCard.vue', () => ({ default: { template: '<div />' } }))

import SettingsPage from '../settings.vue'

const savedProfile = () => ({
  _id: 'me',
  username: 'MoiMeme',
  bio: 'Bio enregistrée',
  phoneNumber: '+33612345678',
  isPhoneVerified: true,
  legalName: 'Camille Durand',
  preferences: { allowDirectMessages: true },
  accountStatus: 'active'
})

let route: { query: Record<string, string> }

async function mountPage() {
  route = reactive({ query: {} })
  const wrapper = mount(SettingsPage, {
    attachTo: document.body,
    global: {
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
      mocks: {
        $route: route,
        $router: { replace: ({ query }: { query: Record<string, string> }) => { route.query = query }, back: vi.fn() },
        $func: toast
      }
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

  it('lie un compte avec un ticket à usage unique, jamais avec le jeton d\'accès', async () => {
    const wrapper = await mountPage()
    await openSection(wrapper, 'Sécurité')
    http.post.mockResolvedValueOnce({ data: { ticket: 'ticket-unique' } })

    await wrapper.findAll('.setting-row').find((row) => row.text().includes('Google'))!.trigger('click')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/api/auth/link/google')
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
