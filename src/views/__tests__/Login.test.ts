import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'

/** Page /login : mot de passe, puis code de double authentification si le compte l'exige. */

const route = vi.hoisted(() => ({ query: {} as Record<string, string> }))
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }))
const auth = vi.hoisted(() => ({ login: vi.fn(), verifyTwoFactor: vi.fn() }))

vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => router }))
vi.mock('@/services/authentification.service', () => ({ default: auth }))

import Login from '../Login.vue'

// Monté dans le document pour vérifier le focus : à démonter entre deux tests.
enableAutoUnmount(afterEach)

function mountPage() {
  return mount(Login, {
    attachTo: document.body,
    global: { stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }
  })
}

type Page = ReturnType<typeof mountPage>

async function submitPassword(wrapper: Page, username = 'minnie', password = 'Secret1!') {
  await wrapper.find('#login-username').setValue(username)
  await wrapper.find('#login-password').setValue(password)
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

async function submitCode(wrapper: Page, code: string) {
  await wrapper.find('#twofa-code').setValue(code)
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.query = {}
  })

  it('ouvre le tableau de bord après un mot de passe accepté', async () => {
    auth.login.mockResolvedValue({ requiresTwoFactor: false })
    const wrapper = mountPage()

    await submitPassword(wrapper)

    expect(auth.login).toHaveBeenCalledWith('minnie', 'Secret1!')
    expect(router.push).toHaveBeenCalledWith('/adherents/dashboard')
  })

  it('renvoie vers la page protégée demandée dans ?redirect=', async () => {
    route.query = { redirect: '/messages?c=1' }
    auth.login.mockResolvedValue({ requiresTwoFactor: false })
    const wrapper = mountPage()

    await submitPassword(wrapper)

    expect(router.push).toHaveBeenCalledWith('/messages?c=1')
  })

  it.each(['https://pirate.example', '//pirate.example', '/\\pirate.example'])(
    'ignore une redirection externe (%s) et ouvre le tableau de bord',
    async (redirect) => {
      route.query = { redirect }
      auth.login.mockResolvedValue({ requiresTwoFactor: false })
      const wrapper = mountPage()

      await submitPassword(wrapper)

      expect(router.push).toHaveBeenCalledWith('/adherents/dashboard')
    }
  )

  it('accepte un pseudo de 3 caractères, la longueur minimale de l\'API', async () => {
    auth.login.mockResolvedValue({ requiresTwoFactor: false })
    const wrapper = mountPage()

    await submitPassword(wrapper, 'jin')

    expect(auth.login).toHaveBeenCalledWith('jin', 'Secret1!')
  })

  it.each([
    ['un pseudo trop court', 'ab', 'Secret1!', 'Le pseudo doit être plus long'],
    ['un mot de passe vide', 'minnie', '', 'Le mot de passe ne peut pas être vide']
  ])('refuse %s sans appeler l\'API', async (_cas, username, password, message) => {
    const wrapper = mountPage()

    await submitPassword(wrapper, username, password)

    expect(wrapper.find('.auth-message--error').text()).toContain(message)
    expect(auth.login).not.toHaveBeenCalled()
  })

  it('affiche l\'erreur de l\'API sur des identifiants refusés', async () => {
    auth.login.mockRejectedValue(new Error('Identifiants invalides'))
    const wrapper = mountPage()

    await submitPassword(wrapper)

    expect(wrapper.find('.auth-message--error').text()).toContain('Identifiants invalides')
    expect(router.push).not.toHaveBeenCalled()
  })

  it('demande le code de double authentification puis le vérifie avec le jeton de défi', async () => {
    route.query = { redirect: '/panier' }
    auth.login.mockResolvedValue({ requiresTwoFactor: true, twoFactorToken: 'defi-123' })
    auth.verifyTwoFactor.mockResolvedValue(undefined)
    const wrapper = mountPage()

    await submitPassword(wrapper)

    expect(router.push).not.toHaveBeenCalled()
    expect(wrapper.find('#login-password').exists()).toBe(false)
    expect(wrapper.find('#twofa-code').exists()).toBe(true)
    expect(document.activeElement).toBe(wrapper.find('#twofa-code').element)

    await submitCode(wrapper, ' 123456 ')

    expect(auth.verifyTwoFactor).toHaveBeenCalledWith('defi-123', '123456')
    expect(router.push).toHaveBeenCalledWith('/panier')
  })

  it('affiche l\'erreur du code refusé et vide le champ', async () => {
    auth.login.mockResolvedValue({ requiresTwoFactor: true, twoFactorToken: 'defi-123' })
    auth.verifyTwoFactor.mockRejectedValue(new Error('Code invalide'))
    const wrapper = mountPage()

    await submitPassword(wrapper)
    await submitCode(wrapper, '000000')

    expect(wrapper.find('.auth-message--error').text()).toContain('Code invalide')
    expect((wrapper.find('#twofa-code').element as HTMLInputElement).value).toBe('')
    expect(router.push).not.toHaveBeenCalled()
  })

  it('refuse un code vide sans appeler l\'API', async () => {
    auth.login.mockResolvedValue({ requiresTwoFactor: true, twoFactorToken: 'defi-123' })
    const wrapper = mountPage()

    await submitPassword(wrapper)
    await submitCode(wrapper, '   ')

    expect(wrapper.find('.auth-message--error').text()).toContain('Saisissez le code de vérification.')
    expect(auth.verifyTwoFactor).not.toHaveBeenCalled()
  })

  it('« Annuler » revient au mot de passe en gardant le pseudo, mais pas le mot de passe', async () => {
    auth.login.mockResolvedValue({ requiresTwoFactor: true, twoFactorToken: 'defi-123' })
    const wrapper = mountPage()

    await submitPassword(wrapper)
    const cancel = wrapper.findAll('button.twofa-link').find((button) => button.text() === 'Annuler')
    await cancel!.trigger('click')

    expect(wrapper.find('#twofa-code').exists()).toBe(false)
    expect((wrapper.find('#login-username').element as HTMLInputElement).value).toBe('minnie')
    expect((wrapper.find('#login-password').element as HTMLInputElement).value).toBe('')
  })

  it('ouvre directement l\'étape du code au retour d\'OAuth sur un compte protégé', async () => {
    route.query = { twoFactorToken: 'defi-oauth' }
    auth.verifyTwoFactor.mockResolvedValue(undefined)
    const wrapper = mountPage()
    await flushPromises()

    expect(router.replace).toHaveBeenCalledWith({ path: '/login', query: {} })
    await submitCode(wrapper, '123456')

    expect(auth.verifyTwoFactor).toHaveBeenCalledWith('defi-oauth', '123456')
  })

  it('traduit le code d\'erreur OAuth reçu dans ?error=', async () => {
    route.query = { error: 'discord_email_unverified' }
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('.auth-message--error').text()).toContain('Vérifie d\'abord ton adresse e-mail sur Discord')
    expect(router.replace).toHaveBeenCalledWith({ path: '/login', query: {} })
  })
})
