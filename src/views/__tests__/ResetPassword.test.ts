import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/** Lien « mot de passe oublié » reçu par email : /reset-password/:token. */

const route = vi.hoisted(() => ({ params: { token: 'jeton-recu' } as Record<string, string> }))
const http = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('vue-router', () => ({ useRoute: () => route }))
vi.mock('@/services/http', () => ({ createApiClient: () => http }))

import ResetPassword from '../ResetPassword.vue'

function mountPage() {
  return mount(ResetPassword, {
    global: { stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }
  })
}

async function fillAndSubmit(wrapper: ReturnType<typeof mountPage>, password: string, confirmation = password) {
  await wrapper.find('#reset-password').setValue(password)
  await wrapper.find('#reset-password-confirm').setValue(confirmation)
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('envoie le nouveau mot de passe et sa confirmation avec le jeton du lien', async () => {
    http.post.mockResolvedValue({ data: { message: 'Mot de passe réinitialisé avec succès.' } })
    const wrapper = mountPage()

    await fillAndSubmit(wrapper, 'Secret1!')

    expect(http.post).toHaveBeenCalledWith('/api/auth/reset-password/jeton-recu', {
      password: 'Secret1!',
      confirmPassword: 'Secret1!'
    })
    expect(wrapper.text()).toContain('Mot de passe réinitialisé avec succès.')
    expect(wrapper.find('a[href="/login"]').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it.each([
    ['Sec1!', '8 caractères'],
    ['secret1!', 'majuscule'],
    ['SECRET1!', 'minuscule'],
    ['Secret!!', 'chiffre'],
    // « - » n'est pas un caractère spécial pour l'API.
    ['Secret1-', 'caractère spécial']
  ])('refuse « %s » sans appeler l\'API (règle : %s)', async (password, rule) => {
    const wrapper = mountPage()

    await fillAndSubmit(wrapper, password)

    expect(wrapper.find('.auth-message--error').text()).toContain(rule)
    expect(http.post).not.toHaveBeenCalled()
  })

  it('refuse une confirmation différente', async () => {
    const wrapper = mountPage()

    await fillAndSubmit(wrapper, 'Secret1!', 'Secret2!')

    expect(wrapper.find('.auth-message--error').text()).toContain('ne correspondent pas')
    expect(http.post).not.toHaveBeenCalled()
  })

  it('affiche le message de l\'API pour un lien expiré', async () => {
    http.post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { message: 'Token de réinitialisation invalide ou expiré' } }
    })
    const wrapper = mountPage()

    await fillAndSubmit(wrapper, 'Secret1!')

    expect(wrapper.find('.auth-message--error').text()).toContain('Token de réinitialisation invalide ou expiré')
    expect(wrapper.find('a[href="/forgot_psw"]').exists()).toBe(true)
  })
})
