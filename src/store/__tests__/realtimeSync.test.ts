import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

/** Événements temps réel → stores de messagerie et de notifications. */

const ME = 'me'
const client = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), isRunning: vi.fn(() => false) }))
const messaging = vi.hoisted(() => ({ getUserConversations: vi.fn() }))

vi.mock('@/services/realtime', () => ({ createRealtimeClient: () => client }))
vi.mock('@/services/http', () => ({ ensureAccessToken: vi.fn(), refreshAccessToken: vi.fn() }))
vi.mock('@/services/session.cookies', () => ({ currentUserId: () => ME }))
vi.mock('@/services/messaging.service', () => ({ default: messaging }))
vi.mock('@/services/notification.service', () => ({ default: {} }))
vi.mock('@/services/user.service', () => ({ default: {} }))
vi.mock('@/services/cart.service', () => ({ default: {} }))

import { dispatchRealtimeEvent, startRealtimeSync } from '../realtimeSync'
import { resetSessionStores } from '../resetSessionStores'
import { useMessagingStore } from '../messaging.store'
import { useNotificationStore } from '../notification.store'
import type { Conversation, Message } from '@/types/messaging.types'

function aConversation(id: string, lastMessageAt: string, unreadCount = 0): Conversation {
  return { _id: id, participants: [], lastMessageAt, createdAt: lastMessageAt, unreadCount } as unknown as Conversation
}

function aMessage(overrides: Partial<Message> = {}): Message {
  return {
    _id: 'm1',
    conversation: 'c-old',
    sender: { _id: 'alice', username: 'Alice' },
    content: 'Toujours dispo ?',
    contentType: 'text',
    isEncrypted: false,
    readBy: ['alice'],
    createdAt: '2026-10-09T10:00:00Z',
    ...overrides
  } as Message
}

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
})

describe('message:new', () => {
  it('remonte la conversation en tête, compte le message non lu et l\'ajoute à la conversation ouverte', () => {
    const store = useMessagingStore()
    store.conversations = [aConversation('c-recent', '2026-10-09T09:00:00Z'), aConversation('c-old', '2026-10-01T09:00:00Z')]
    store.currentConversation = store.conversations[1]

    dispatchRealtimeEvent({ event: 'message:new', data: { conversationId: 'c-old', message: aMessage() } })
    dispatchRealtimeEvent({ event: 'message:new', data: { conversationId: 'c-old', message: aMessage() } })

    expect(store.sortedConversations[0]._id).toBe('c-old')
    expect(store.getConversationById('c-old')?.unreadCount).toBe(1)
    expect(store.unreadCount).toBe(1)
    expect(store.messages.map((m) => m._id)).toEqual(['m1'])
  })

  it('ne compte pas comme non lu un message envoyé depuis un autre onglet', () => {
    const store = useMessagingStore()
    store.conversations = [aConversation('c-old', '2026-10-01T09:00:00Z')]

    dispatchRealtimeEvent({
      event: 'message:new',
      data: { conversationId: 'c-old', message: aMessage({ sender: { _id: ME, username: 'Moi' } as Message['sender'], readBy: [ME] }) }
    })

    expect(store.unreadCount).toBe(0)
  })

  it('recharge la liste pour une conversation encore inconnue', () => {
    messaging.getUserConversations.mockResolvedValue({ conversations: [] })
    const store = useMessagingStore()
    store.conversations = [aConversation('c-recent', '2026-10-09T09:00:00Z')]

    dispatchRealtimeEvent({ event: 'message:new', data: { conversationId: 'c-new', message: aMessage({ conversation: 'c-new' }) } })

    expect(messaging.getUserConversations).toHaveBeenCalledTimes(1)
  })
})

describe('conversation:read', () => {
  it('ajoute l\'accusé de lecture aux messages de la conversation ouverte', () => {
    const store = useMessagingStore()
    store.currentConversation = aConversation('c-old', '2026-10-01T09:00:00Z')
    store.messages = [aMessage({ _id: 'mine', sender: { _id: ME } as Message['sender'], readBy: [ME] })]

    dispatchRealtimeEvent({ event: 'conversation:read', data: { conversationId: 'c-old', readerId: 'alice' } })

    expect(store.messages[0].readBy).toEqual([ME, 'alice'])
  })

  it('remet à zéro les non-lus d\'une conversation lue depuis un autre onglet', () => {
    const store = useMessagingStore()
    store.conversations = [aConversation('c-old', '2026-10-01T09:00:00Z', 3)]
    store.updateUnreadCount()

    dispatchRealtimeEvent({ event: 'conversation:read', data: { conversationId: 'c-old', readerId: ME } })

    expect(store.unreadCount).toBe(0)
  })
})

describe('notification:new et unread:update', () => {
  it('ajoute la notification en tête et incrémente la cloche une seule fois', () => {
    const store = useNotificationStore()
    const notification = { _id: 'n1', type: 'message', title: 'Nouveau message', content: '', isRead: false, createdAt: '' }

    dispatchRealtimeEvent({ event: 'notification:new', data: notification })
    dispatchRealtimeEvent({ event: 'notification:new', data: notification })

    expect(store.notifications.map((n) => n._id)).toEqual(['n1'])
    expect(store.unreadCount).toBe(1)
  })

  it('applique les compteurs calculés par l\'API', () => {
    dispatchRealtimeEvent({ event: 'unread:update', data: { messages: 4, notifications: 7 } })

    expect(useMessagingStore().unreadCount).toBe(4)
    expect(useNotificationStore().unreadCount).toBe(7)
  })

  it('ignore un événement inconnu', () => {
    expect(() => dispatchRealtimeEvent({ event: 'futur:evenement', data: {} })).not.toThrow()
  })
})

describe('cycle de vie', () => {
  it('ouvre le flux au démarrage et le ferme à la déconnexion', () => {
    startRealtimeSync()
    resetSessionStores()

    expect(client.start).toHaveBeenCalledTimes(1)
    expect(client.stop).toHaveBeenCalledTimes(1)
  })
})
