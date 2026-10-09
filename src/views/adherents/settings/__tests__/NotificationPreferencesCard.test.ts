import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const http = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
const toast = vi.hoisted(() => ({ showToastSuccess: vi.fn(), showToastError: vi.fn() }))

vi.mock('@/services/http', () => ({ createApiClient: () => http }))
vi.mock('@/function', () => ({ func: toast }))

import NotificationPreferencesCard from '../NotificationPreferencesCard.vue'

const ENDPOINT = '/api/users/me/notification-preferences'

const savedPreferences = () => ({
  orders: { email: true, push: true },
  offers: { email: true, push: true },
  messages: { email: false, push: true },
  disputes: { email: true, push: true },
  reviews: { email: false, push: true },
  social: { email: false, push: true }
})

const toggle = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper.find(`input[aria-label="${label}"]`)

describe('NotificationPreferencesCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    http.get.mockResolvedValue({ data: { preferences: savedPreferences() } })
  })

  it('affiche chaque catégorie × canal avec un libellé accessible et l\'état enregistré', async () => {
    const wrapper = mount(NotificationPreferencesCard)
    await flushPromises()

    expect(http.get).toHaveBeenCalledWith(ENDPOINT)
    expect((toggle(wrapper, 'Email — Commandes').element as HTMLInputElement).checked).toBe(true)
    expect((toggle(wrapper, 'Email — Messages').element as HTMLInputElement).checked).toBe(false)
    expect((toggle(wrapper, 'Push — Communauté').element as HTMLInputElement).checked).toBe(true)
  })

  it('présente la sécurité comme toujours activée et non modifiable', async () => {
    const wrapper = mount(NotificationPreferencesCard)
    await flushPromises()

    const security = toggle(wrapper, 'Email — Sécurité et compte (toujours activé)').element as HTMLInputElement
    expect(security.checked).toBe(true)
    expect(security.disabled).toBe(true)
  })

  it('enregistre uniquement l\'interrupteur modifié et confirme par un toast', async () => {
    const updated = { ...savedPreferences(), messages: { email: true, push: true } }
    http.put.mockResolvedValue({ data: { preferences: updated } })
    const wrapper = mount(NotificationPreferencesCard)
    await flushPromises()

    await toggle(wrapper, 'Email — Messages').setValue(true)
    await flushPromises()

    expect(http.put).toHaveBeenCalledWith(ENDPOINT, { messages: { email: true } })
    expect(toast.showToastSuccess).toHaveBeenCalled()
    expect((toggle(wrapper, 'Email — Messages').element as HTMLInputElement).checked).toBe(true)
  })

  it('remet l\'interrupteur dans son état enregistré si l\'API refuse', async () => {
    http.put.mockRejectedValue({ response: { status: 500, data: { message: 'Indisponible' } } })
    const wrapper = mount(NotificationPreferencesCard)
    await flushPromises()

    await toggle(wrapper, 'Email — Commandes').setValue(false)
    await flushPromises()

    expect((toggle(wrapper, 'Email — Commandes').element as HTMLInputElement).checked).toBe(true)
    expect(toast.showToastError).toHaveBeenCalledWith('Indisponible')
  })

  it('affiche une erreur de chargement et permet de réessayer', async () => {
    http.get.mockRejectedValueOnce(new Error('réseau'))
    const wrapper = mount(NotificationPreferencesCard)
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)

    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(wrapper.find('table').exists()).toBe(true)
  })
})
