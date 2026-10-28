import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConversationSidebar from '../ConversationSidebar.vue'
import type { ViewConversation } from '../../types'

/** Liste des conversations : utilisable au clavier. */

const conversation = (id: string) => ({ _id: id, participants: [], unreadCount: 0 }) as unknown as ViewConversation

function mountSidebar(selected: ViewConversation | null = null) {
  return mount(ConversationSidebar, {
    props: {
      userInfo: null,
      userId: 'me',
      conversations: [conversation('a'), conversation('b')],
      counts: { all: 2, favorites: 0, unread: 0, archived: 0 },
      activeTab: 'all',
      searchQuery: '',
      loading: false,
      selectedConversation: selected,
      openMenuId: null
    },
    global: { stubs: { UserAvatar: true } }
  })
}

describe('ConversationSidebar', () => {
  it('ouvre une conversation avec Entrée ou Espace', async () => {
    const wrapper = mountSidebar()
    const items = wrapper.findAll('.conversation-item')

    expect(items[0].attributes('tabindex')).toBe('0')
    await items[0].trigger('keydown', { key: 'Enter' })
    await items[1].trigger('keydown', { key: ' ' })

    expect(wrapper.emitted('select')?.map(([c]) => (c as ViewConversation)._id)).toEqual(['a', 'b'])
  })

  it('signale la conversation ouverte et l\'état du menu d\'options', () => {
    const wrapper = mount(ConversationSidebar, {
      props: { ...mountSidebar(conversation('b')).props(), openMenuId: 'b' },
      global: { stubs: { UserAvatar: true } }
    })
    const items = wrapper.findAll('.conversation-item')

    expect(items[1].attributes('aria-current')).toBe('true')
    expect(items[0].attributes('aria-current')).toBeUndefined()
    expect(items[1].find('.action-dots-btn').attributes('aria-expanded')).toBe('true')
  })
})
