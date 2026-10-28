import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/** Lien de vérification reçu par email : /verify-email/:token. */

const route = vi.hoisted(() => ({ params: { token: 'jeton-recu' } as Record<string, string> }))
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
const session = vi.hoisted(() => ({ hasSession: vi.fn(() => false) }))

vi.mock('vue-router', () => ({ useRoute: () => route }))
vi.mock('@/services/http', () => ({ createApiClient: () => http }))
vi.mock('@/services/session.cookies', () => session)

import VerifyEmail from '../VerifyEmail.vue'

function mountPage() {
  return mount(VerifyEmail, {
    global: { stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }
  })
}

const expiredToken = {
  isAxiosError: true,
  response: { status: 400, data: { message: 'Token de vérification invalide ou expiré' } }
}

describe('VerifyEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session.hasSession.mockReturnValue(false)
  })

  it('vérifie le jeton dès l\'arrivée, avec un état de chargement', async () => {
    http.get.mockResolvedValue({ data: { message: 'Email vérifié avec succès.' } })
    const wrapper = mountPage()

    expect(wrapper.text()).toContain('Vérification en cours')
    await flushPromises()

    expect(http.get).toHaveBeenCalledWith('/api/auth/verify-email/jeton-recu')
    expect(wrapper.text()).toContain('Email vérifié avec succès.')
    expect(wrapper.find('a[href="/login"]').exists()).toBe(true)
  })

  it('renvoie vers le tableau de bord si une session est ouverte', async () => {
    session.hasSession.mockReturnValue(true)
    http.get.mockResolvedValue({ data: { message: 'Email vérifié avec succès.' } })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('a[href="/adherents/dashboard"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/login"]').exists()).toBe(false)
  })

  it('affiche l\'erreur de l\'API et permet de redemander un lien', async () => {
    http.get.mockRejectedValue(expiredToken)
    http.post.mockResolvedValue({ data: { message: 'Un nouveau lien de vérification a été envoyé' } })
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Token de vérification invalide ou expiré')

    await wrapper.find('#verify-email').setValue('moi@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/api/auth/resend-verification', { email: 'moi@example.com' })
    expect(wrapper.find('.auth-message--success').text()).toContain('Un nouveau lien de vérification a été envoyé')
  })

  it('affiche l\'erreur du renvoi, par exemple trop de demandes', async () => {
    http.get.mockRejectedValue(expiredToken)
    http.post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 429, data: { message: 'Trop de demandes d\'envoi d\'email. Veuillez patienter avant de réessayer.' } }
    })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('#verify-email').setValue('moi@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const errors = wrapper.findAll('.auth-message--error')
    expect(errors[errors.length - 1].text()).toContain('Trop de demandes d\'envoi d\'email')
  })
})
