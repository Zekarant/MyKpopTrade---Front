import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import Cookies from 'js-cookie'

/** Saisie de la messagerie quand un blocage existe entre les participants. */

const ME = 'me-id'

const conversation = {
  _id: 'c-alice',
  otherParticipant: { _id: 'alice', username: 'Alice' },
  lastMessage: { content: 'Ancien message' },
  unreadCount: 0,
  favoritedBy: [],
  archivedBy: []
}

const detail = vi.hoisted(() => ({ flags: {} as Record<string, boolean> }))

const store = reactive({
  conversations: [] as (typeof conversation)[],
  sortedConversations: [] as (typeof conversation)[],
  fetchConversations: vi.fn(async () => {
    store.conversations = [{ ...conversation }]
    store.sortedConversations = store.conversations
  }),
  fetchConversation: vi.fn(async () => ({
    conversation: { ...conversation, ...detail.flags },
    messages: [{ _id: 'm1', content: 'Ancien message', contentType: 'text', sender: { _id: 'alice' }, createdAt: '2026-10-01T10:00:00Z' }],
    media: []
  })),
  markAsRead: vi.fn(async () => undefined),
  sendMessage: vi.fn(),
  $onAction: vi.fn(() => () => {})
})

vi.mock('@/store/messaging.store', () => ({ useMessagingStore: () => store, applyReadReceipt: vi.fn() }))
vi.mock('vue-router', () => ({ useRoute: () => ({ params: {} }), useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/user.service', () => ({
  default: { getMyInformation: vi.fn(async () => ({ user: { id: ME, username: 'Moi' } })) }
}))
vi.mock('@/services/payment.service', () => ({ default: {} }))
vi.mock('@/services/messaging.service', () => ({ default: { getAttachmentUrl: () => '' } }))
vi.mock('@/services/block.service', () => ({ default: { getStatus: vi.fn() }, BLOCKED_ERROR_CODE: 'BLOCKED' }))
vi.mock('vue3-emoji-picker', () => ({ default: { template: '<div />' } }))
vi.mock('vue3-emoji-picker/css', () => ({}))
vi.mock('@/components/ImageCarousel.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/adherents/send_message.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/send_offer.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/checkout/CheckoutDialog.vue', () => ({ default: { template: '<div />' } }))

import MessagesView from '../MessagesView.vue'

async function mountView() {
  const wrapper = mount(MessagesView, {
    attachTo: document.body,
    global: {
      config: {
        globalProperties: { $func: { showToastSuccess: vi.fn(), showToastError: vi.fn() } } as never
      }
    }
  })
  await flushPromises()
  return wrapper
}

describe('MessagesView — conversation bloquée', () => {
  beforeEach(() => {
    Cookies.set('id_user', ME)
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    detail.flags = {}
  })

  it('laisse écrire quand aucun blocage n\'existe', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('.message-input').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.composer-blocked-notice').exists()).toBe(false)
    wrapper.unmount()
  })

  it('désactive la saisie et explique pourquoi quand l\'interlocuteur m\'a bloqué', async () => {
    detail.flags = { isBlocked: true, blockedByMe: false }
    const wrapper = await mountView()

    expect(wrapper.find('.message-input').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.send-btn').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.attach-btn').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.composer-blocked-notice').text()).toContain('Vous ne pouvez plus envoyer de messages')
    // L'historique reste lisible.
    expect(wrapper.text()).toContain('Ancien message')
    wrapper.unmount()
  })

  it('invite à débloquer quand c\'est moi qui ai bloqué', async () => {
    detail.flags = { isBlocked: true, blockedByMe: true }
    const wrapper = await mountView()

    expect(wrapper.find('.composer-blocked-notice').text()).toContain('débloquez-le')
    expect(wrapper.find('.right-sidebar .block-user-btn').text()).toBe('Débloquer')
    wrapper.unmount()
  })
})
