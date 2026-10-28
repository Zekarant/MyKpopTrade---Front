import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

/** Fenêtre « Nouvelle conversation » : avatar du destinataire, dialogue accessible. */

vi.mock('@/services/messaging.service', () => ({ default: { getUserByName: vi.fn(), startConversation: vi.fn() } }))
vi.mock('@/function', () => ({ func: { showToastSuccess: vi.fn(), showToastError: vi.fn() } }))

import SendMessage from '../send_message.vue'
import UserAvatar from '@/components/UserAvatar.vue'

let wrapper: VueWrapper | undefined

function mountDialog() {
  wrapper = mount(SendMessage, { props: { idUser: 'u2', pseudoUser: 'minnie' }, attachTo: document.body })
  return wrapper
}

describe('send_message', () => {
  beforeEach(() => vi.clearAllMocks())
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

  it('se ferme avec Échap', async () => {
    const dialog = mountDialog()

    await dialog.get('textarea').trigger('keydown', { key: 'Escape' })

    expect(dialog.emitted('closeSendMessage')).toHaveLength(1)
  })
})
