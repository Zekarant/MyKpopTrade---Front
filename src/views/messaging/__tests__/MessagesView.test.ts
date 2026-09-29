import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import Cookies from 'js-cookie'

/** Test de montage de MessagesView : vérifie le comportement visible, pas l'implémentation. */

const ME = 'me-id'

const conversations = [
  {
    _id: 'c-alice',
    otherParticipant: { _id: 'alice', username: 'Alice' },
    lastMessage: { content: 'Photocard dispo ?' },
    unreadCount: 2,
    favoritedBy: [ME],
    archivedBy: []
  },
  {
    _id: 'c-bob',
    otherParticipant: { _id: 'bob', username: 'Bob' },
    lastMessage: { content: 'Merci pour l\'envoi' },
    unreadCount: 0,
    favoritedBy: [],
    archivedBy: []
  },
  {
    _id: 'c-old',
    otherParticipant: { _id: 'carol', username: 'Carol' },
    lastMessage: { content: 'Vieille discussion' },
    unreadCount: 5,
    favoritedBy: [],
    archivedBy: [ME]
  }
]

const defaultFetchConversation = async (id: string, _params?: { page?: number }): Promise<Record<string, unknown>> => ({
  conversation: { ...conversations.find((c) => c._id === id) },
  messages: [],
  media: []
})

const store = reactive({
  conversations: [] as typeof conversations,
  sortedConversations: [] as typeof conversations,
  fetchConversations: vi.fn(async () => {
    store.conversations = conversations.map((c) => ({ ...c }))
    store.sortedConversations = store.conversations
  }),
  fetchConversation: vi.fn(defaultFetchConversation),
  markAsRead: vi.fn(async () => undefined)
})

const route = { params: {} as Record<string, string> }

vi.mock('@/store/messaging.store', () => ({ useMessagingStore: () => store }))
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/user.service', () => ({
  default: {
    getMyInformation: vi.fn(async () => ({ user: { id: ME, username: 'Moi' } })),
    renderUserAvatar: () => '<span></span>'
  }
}))
vi.mock('@/services/payment.service', () => ({ default: {} }))
vi.mock('@/services/messaging.service', () => ({ default: { getAttachmentUrl: () => '' } }))
vi.mock('vue3-emoji-picker', () => ({ default: { template: '<div />' } }))
vi.mock('vue3-emoji-picker/css', () => ({}))
vi.mock('@/components/adherents/nav_bar.vue', () => ({ default: { template: '<nav />' } }))
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

const listedUsernames = (wrapper: Awaited<ReturnType<typeof mountView>>) =>
  wrapper.findAll('.conversation-item .username').map((el) => el.text())

const tabCount = (wrapper: Awaited<ReturnType<typeof mountView>>, label: string) =>
  wrapper.findAll('.tab').find((tab) => tab.text().includes(label))?.find('.tab-count')

describe('MessagesView', () => {
  beforeEach(() => {
    Cookies.set('id_user', ME)
    route.params = {}
    store.fetchConversation.mockClear()
    document.body.innerHTML = ''
  })

  it('liste les conversations non archivées et affiche les compteurs d\'onglets', async () => {
    const wrapper = await mountView()

    expect(listedUsernames(wrapper)).toEqual(['Alice', 'Bob'])
    expect(tabCount(wrapper, 'Tous')?.text()).toBe('2')
    expect(tabCount(wrapper, 'Favoris')?.text()).toBe('1')
    expect(tabCount(wrapper, 'Non lus')?.text()).toBe('1')
    expect(tabCount(wrapper, 'Archivées')?.text()).toBe('1')
    wrapper.unmount()
  })

  it('l\'onglet « Non lus » n\'affiche pas les conversations archivées', async () => {
    const wrapper = await mountView()

    await wrapper.findAll('.tab').find((tab) => tab.text().includes('Non lus'))!.trigger('click')

    expect(listedUsernames(wrapper)).toEqual(['Alice'])
    wrapper.unmount()
  })

  it('filtre par la recherche', async () => {
    const wrapper = await mountView()

    await wrapper.find('.search-input input').setValue('merci')

    expect(listedUsernames(wrapper)).toEqual(['Bob'])
    wrapper.unmount()
  })

  it('ouvre la plus récente conversation par défaut', async () => {
    const wrapper = await mountView()

    expect(store.fetchConversation).toHaveBeenCalledWith('c-alice')
    wrapper.unmount()
  })

  it('garde la lecture en place en chargeant les messages plus anciens', async () => {
    const message = (id: string, minute: number) => ({
      _id: id,
      content: `message ${id}`,
      contentType: 'text',
      sender: { _id: 'alice', username: 'Alice' },
      createdAt: `2026-09-28T10:${String(minute).padStart(2, '0')}:00Z`
    })
    store.fetchConversation.mockImplementation(async (id: string, params?: { page?: number }) => ({
      conversation: { ...conversations.find((c) => c._id === id) },
      messages: params?.page === 2 ? [message('m1', 1), message('m2', 2)] : [message('m3', 3), message('m4', 4), message('m5', 5)],
      media: [],
      pagination: { page: params?.page ?? 1, pages: 2, total: 5 }
    }))
    const wrapper = await mountView()
    const area = wrapper.find('.messages-area').element as HTMLElement
    // jsdom ne calcule aucune mise en page : 100 px par message affiché.
    let scrollTop = 0
    Object.defineProperty(area, 'scrollHeight', { get: () => area.querySelectorAll('.message').length * 100 })
    Object.defineProperty(area, 'scrollTop', { get: () => scrollTop, set: (value: number) => { scrollTop = value } })

    area.scrollTop = 10
    area.dispatchEvent(new Event('scroll'))
    await flushPromises()

    expect(store.fetchConversation).toHaveBeenCalledWith('c-alice', expect.objectContaining({ page: 2 }))
    expect(area.querySelectorAll('.message')).toHaveLength(5)
    // Deux messages ajoutés au-dessus : la lecture descend d'autant (10 + 2 × 100).
    expect(area.scrollTop).toBe(210)
    wrapper.unmount()
    store.fetchConversation.mockImplementation(defaultFetchConversation)
  })

  it('ouvre la conversation demandée par /adherents/messages/:id', async () => {
    route.params = { id: 'c-bob' }
    const wrapper = await mountView()

    expect(store.fetchConversation).toHaveBeenCalledWith('c-bob')
    expect(store.fetchConversation).not.toHaveBeenCalledWith('c-alice')
    wrapper.unmount()
  })
})
