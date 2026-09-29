import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/**
 * Retour de connexion Google/Discord : l'URL ne porte plus qu'un code à usage
 * unique, échangé contre la session.
 */

const route = vi.hoisted(() => ({ query: {} as Record<string, string> }))
const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }))
const auth = vi.hoisted(() => ({ exchangeOAuthCode: vi.fn() }))
const session = vi.hoisted(() => ({ setSessionCookies: vi.fn() }))

vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => router }))
vi.mock('@/services/authentification.service', () => ({ default: auth }))
vi.mock('@/services/session.cookies', () => session)

import AuthCallback from '../AuthCallback.vue'

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.exchangeOAuthCode.mockResolvedValue(undefined)
  })

  it('échange le code puis ouvre le tableau de bord', async () => {
    route.query = { code: 'code-unique' }

    mount(AuthCallback)
    await flushPromises()

    expect(auth.exchangeOAuthCode).toHaveBeenCalledWith('code-unique')
    expect(router.replace).toHaveBeenCalledWith('/adherents/dashboard')
  })

  it('retire le code de l\'URL dès l\'arrivée', async () => {
    window.history.replaceState(null, '', '/auth/callback?code=code-unique')
    route.query = { code: 'code-unique' }

    mount(AuthCallback)
    await flushPromises()

    expect(window.location.search).toBe('')
  })

  it('affiche l\'erreur si le code est refusé', async () => {
    route.query = { code: 'code-expire' }
    auth.exchangeOAuthCode.mockRejectedValue(new Error('Connexion expirée. Recommencez.'))

    const wrapper = mount(AuthCallback)
    await flushPromises()

    expect(wrapper.text()).toContain('Connexion expirée. Recommencez.')
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('accepte encore les jetons d\'une API pas encore mise à jour', async () => {
    route.query = { accessToken: 'a', refreshToken: 'r', userId: 'u' }

    mount(AuthCallback)
    await flushPromises()

    expect(session.setSessionCookies).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r', userId: 'u' })
    expect(auth.exchangeOAuthCode).not.toHaveBeenCalled()
  })
})
