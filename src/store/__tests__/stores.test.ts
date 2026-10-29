import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

/** Stores de session : profil, panier, notifications, conversations, et leur remise à zéro à la déconnexion. */

const session = vi.hoisted(() => ({ currentUserId: vi.fn<() => string | null>(() => 'u1') }))
const users = vi.hoisted(() => ({ getMyInformation: vi.fn() }))
const carts = vi.hoisted(() => ({ getCart: vi.fn() }))
const notifications = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  markAsRead: vi.fn(async () => undefined),
  markAllAsRead: vi.fn(async () => undefined),
  deleteNotification: vi.fn()
}))
const messaging = vi.hoisted(() => ({ startConversation: vi.fn() }))

vi.mock('@/services/session.cookies', () => session)
vi.mock('@/services/user.service', () => ({ default: users }))
vi.mock('@/services/cart.service', () => ({ default: carts }))
vi.mock('@/services/notification.service', () => ({ default: notifications }))
vi.mock('@/services/messaging.service', () => ({ default: messaging }))

import { useUserStore } from '../user.store'
import { useCartStore } from '../cart.store'
import { useNotificationStore } from '../notification.store'
import { useMessagingStore } from '../messaging.store'
import { resetSessionStores } from '../resetSessionStores'
import type { Conversation } from '@/types/messaging.types'

beforeEach(() => {
  vi.clearAllMocks()
  session.currentUserId.mockReturnValue('u1')
  setActivePinia(createPinia())
})

describe('useUserStore', () => {
  it('ne charge le profil qu\'une fois par session', async () => {
    users.getMyInformation.mockResolvedValue({ profile: { _id: 'u1', username: 'minnie', role: 'user' } })
    const store = useUserStore()

    await Promise.all([store.fetchProfile(), store.fetchProfile()])
    await store.fetchProfile()

    expect(users.getMyInformation).toHaveBeenCalledTimes(1)
    expect(store.profile?.username).toBe('minnie')
  })

  it('expose le rôle administrateur', async () => {
    users.getMyInformation.mockResolvedValue({ profile: { _id: 'u1', username: 'admin', role: 'admin' } })
    const store = useUserStore()

    await store.fetchProfile()

    expect(store.isAdmin).toBe(true)
  })

  it('recharge le profil quand un autre compte s\'est connecté', async () => {
    users.getMyInformation.mockResolvedValueOnce({ profile: { _id: 'u1', username: 'minnie' } })
    users.getMyInformation.mockResolvedValueOnce({ profile: { _id: 'u2', username: 'jimin' } })
    const store = useUserStore()

    await store.fetchProfile()
    session.currentUserId.mockReturnValue('u2')
    await store.fetchProfile()

    expect(store.profile?.username).toBe('jimin')
  })

  it('n\'appelle pas l\'API sans session', async () => {
    session.currentUserId.mockReturnValue(null)
    const store = useUserStore()

    expect(await store.fetchProfile()).toBeNull()
    expect(users.getMyInformation).not.toHaveBeenCalled()
  })

  it('ignore une réponse arrivée après une déconnexion', async () => {
    let resolve!: (value: unknown) => void
    users.getMyInformation.mockReturnValue(new Promise((r) => { resolve = r }))
    const store = useUserStore()

    const pending = store.fetchProfile()
    store.reset()
    resolve({ profile: { _id: 'u1', username: 'minnie' } })
    await pending

    expect(store.profile).toBeNull()
  })
})

describe('useCartStore', () => {
  it('compte les articles du panier', async () => {
    carts.getCart.mockResolvedValue({ items: [{}, {}, {}] })
    const store = useCartStore()

    await store.refresh()

    expect(store.count).toBe(3)
  })

  it('garde le compte connu si le panier est injoignable', async () => {
    carts.getCart.mockRejectedValue(new Error('réseau'))
    const store = useCartStore()
    store.setCount(2)

    await store.refresh()

    expect(store.count).toBe(2)
  })
})

const list = () => [
  { _id: 'n1', type: 'message', title: '', content: 'Salut', isRead: false, createdAt: '' },
  { _id: 'n2', type: 'offer', title: '', content: 'Offre', isRead: false, createdAt: '' }
]

describe('useNotificationStore', () => {

  it('charge la liste et le total de non-lues de l\'API', async () => {
    notifications.getNotifications.mockResolvedValue({ notifications: list(), pagination: { unreadCount: 7 } })
    const store = useNotificationStore()

    await store.fetch()

    expect(store.notifications).toHaveLength(2)
    expect(store.unreadCount).toBe(7)
  })

  it('marque une notification lue une seule fois', async () => {
    notifications.getNotifications.mockResolvedValue({ notifications: list(), pagination: { unreadCount: 2 } })
    const store = useNotificationStore()
    await store.fetch()

    store.markRead('n1')
    store.markRead('n1')

    expect(store.unreadCount).toBe(1)
    expect(notifications.markAsRead).toHaveBeenCalledTimes(1)
  })

  it('marque tout comme lu', async () => {
    notifications.getNotifications.mockResolvedValue({ notifications: list(), pagination: { unreadCount: 2 } })
    const store = useNotificationStore()
    await store.fetch()

    await store.markAllRead()

    expect(store.unreadCount).toBe(0)
    expect(store.notifications.every((n) => n.isRead)).toBe(true)
  })

  it('supprime une notification non lue et décompte le badge', async () => {
    notifications.getNotifications.mockResolvedValue({ notifications: list(), pagination: { unreadCount: 2 } })
    notifications.deleteNotification.mockResolvedValue(undefined)
    const store = useNotificationStore()
    await store.fetch()

    await store.remove('n1')

    expect(notifications.deleteNotification).toHaveBeenCalledWith('n1')
    expect(store.notifications.map((n) => n._id)).toEqual(['n2'])
    expect(store.unreadCount).toBe(1)
  })

  it('garde la notification si l\'API refuse la suppression', async () => {
    notifications.getNotifications.mockResolvedValue({ notifications: list(), pagination: { unreadCount: 2 } })
    notifications.deleteNotification.mockRejectedValue(new Error('réseau'))
    const store = useNotificationStore()
    await store.fetch()

    await store.remove('n1')

    expect(store.notifications).toHaveLength(2)
    expect(store.unreadCount).toBe(2)
  })
})

describe('useMessagingStore.startConversation', () => {
  const conversation = (id: string, otherId: string, productId?: string) =>
    ({ _id: id, participants: [{ _id: 'u1' }, { _id: otherId }], productId }) as unknown as Conversation

  it('ajoute une nouvelle conversation en tête de liste', async () => {
    const store = useMessagingStore()
    store.conversations = [conversation('c1', 'u2')]
    messaging.startConversation.mockResolvedValue({ conversation: conversation('c2', 'u3') })

    const response = await store.startConversation('u3', undefined, 'Coucou')

    expect(messaging.startConversation).toHaveBeenCalledWith({ recipientId: 'u3', productId: undefined, initialMessage: 'Coucou' })
    expect(store.conversations.map((c) => c._id)).toEqual(['c2', 'c1'])
    expect(response.conversation._id).toBe('c2')
  })

  it.each([
    ['même identifiant', conversation('c1', 'u2', 'p1')],
    ['même interlocuteur et même annonce', conversation('autre-id', 'u2', 'p1')]
  ])('n\'ajoute pas de doublon (%s) et rend la conversation déjà listée', async (_, returned) => {
    const store = useMessagingStore()
    const listed = conversation('c1', 'u2', 'p1')
    store.conversations = [listed]
    messaging.startConversation.mockResolvedValue({ conversation: returned })

    const response = await store.startConversation('u2', 'p1', 'Toujours dispo ?')

    expect(store.conversations).toHaveLength(1)
    expect(response.conversation).toBe(store.conversations[0])
  })
})

describe('resetSessionStores', () => {
  it('vide les données du compte qui se déconnecte', async () => {
    users.getMyInformation.mockResolvedValue({ profile: { _id: 'u1', username: 'minnie' } })
    carts.getCart.mockResolvedValue({ items: [{}] })
    notifications.getNotifications.mockResolvedValue({ notifications: list(), pagination: { unreadCount: 2 } })
    await useUserStore().fetchProfile()
    await useCartStore().refresh()
    await useNotificationStore().fetch()
    useMessagingStore().unreadCount = 4

    resetSessionStores()

    expect(useUserStore().profile).toBeNull()
    expect(useCartStore().count).toBe(0)
    expect(useNotificationStore().notifications).toEqual([])
    expect(useMessagingStore().unreadCount).toBe(0)
  })
})
