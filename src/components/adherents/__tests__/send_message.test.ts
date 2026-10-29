import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

/** Fenêtre « Nouvelle conversation » : avatar du destinataire, dialogue accessible. */

const messagingService = vi.hoisted(() => ({ getUserByName: vi.fn(), startConversation: vi.fn() }))
vi.mock('@/services/messaging.service', () => ({ default: messagingService }))
vi.mock('@/function', () => ({ func: { showToastSuccess: vi.fn(), showToastError: vi.fn() } }))

import SendMessage from '../send_message.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useMessagingStore } from '@/store/messaging.store'

let wrapper: VueWrapper | undefined

function mountDialog() {
  wrapper = mount(SendMessage, { props: { idUser: 'u2', pseudoUser: 'minnie' }, attachTo: document.body })
  return wrapper
}

describe('send_message', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('montre l\'avatar du destinataire (initiale sans photo) au lieu d\'une image de remplacement', () => {
    const dialog = mountDialog()

    expect(dialog.findComponent(UserAvatar).props('user')).toMatchObject({ username: 'minnie' })
    expect(dialog.find('.msg-modal__recipient').text()).toContain('M')
    expect(dialog.find('img[src*="placeholder"]').exists()).toBe(false)
  })

  it('s\'annonce comme dialogue modal et place le focus sur le message', async () => {
    const dialog = mountDialog()
    await flushPromises()

    const box = dialog.get('[role="dialog"]')
    expect(box.attributes('aria-modal')).toBe('true')
    expect(dialog.get(`#${box.attributes('aria-labelledby')}`).text()).toContain('Nouvelle conversation')
    expect(document.activeElement).toBe(dialog.get('textarea').element)
  })

  it('ouvre la conversation par le store, avec l\'annonce concernée', async () => {
    messagingService.startConversation.mockResolvedValue({ conversation: { _id: 'c1' } })
    wrapper = mount(SendMessage, { props: { idUser: 'u2', pseudoUser: 'minnie', idPost: 'p1' }, attachTo: document.body })

    await wrapper.get('textarea').setValue('Toujours dispo ?')
    await wrapper.get('.msg-modal__btn--primary').trigger('click')
    await flushPromises()

    expect(messagingService.startConversation).toHaveBeenCalledWith({ recipientId: 'u2', productId: 'p1', initialMessage: 'Toujours dispo ?' })
    expect(useMessagingStore().conversations).toEqual([{ _id: 'c1' }])
    expect(wrapper.emitted('newConversationCreated')?.[0]).toEqual([{ _id: 'c1' }])
  })

  it('se ferme avec Échap', async () => {
    const dialog = mountDialog()

    await dialog.get('textarea').trigger('keydown', { key: 'Escape' })

    expect(dialog.emitted('closeSendMessage')).toHaveLength(1)
  })
})
