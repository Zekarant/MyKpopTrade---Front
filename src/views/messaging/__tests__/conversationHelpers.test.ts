import { describe, it, expect } from 'vitest'
import {
  countConversationsByTab,
  filterConversations,
  findOfferStatus,
  formatMessageTimestamp,
  getOtherParticipant,
  isOwnMessage,
  messageStatusIcon,
  transactionStatusLabel,
  type ConversationLike
} from '../conversationHelpers'

const ME = 'me'

const conv = (overrides: Partial<ConversationLike> = {}): ConversationLike => ({
  _id: Math.random().toString(36).slice(2),
  participants: [{ _id: ME }, { _id: 'alice', username: 'Alice' } as never],
  favoritedBy: [],
  archivedBy: [],
  unreadCount: 0,
  ...overrides
})

describe('conversationHelpers', () => {
  describe('filterConversations', () => {
    const inbox = [
      conv({ _id: 'normal' }),
      conv({ _id: 'fav', favoritedBy: [ME] }),
      conv({ _id: 'unread', unreadCount: 2 }),
      conv({ _id: 'archived-unread', unreadCount: 3, archivedBy: [ME] })
    ]
    const ids = (list: ConversationLike[]) => list.map((c) => c._id)

    it('« toutes » exclut les conversations archivées', () => {
      expect(ids(filterConversations(inbox, { tab: 'all', query: '', userId: ME }))).toEqual(['normal', 'fav', 'unread'])
    })

    it('« non lus » exclut aussi les archivées (bug corrigé)', () => {
      expect(ids(filterConversations(inbox, { tab: 'unread', query: '', userId: ME }))).toEqual(['unread'])
    })

    it('« favoris » et « archivées » ne gardent que les conversations concernées', () => {
      expect(ids(filterConversations(inbox, { tab: 'favorites', query: '', userId: ME }))).toEqual(['fav'])
      expect(ids(filterConversations(inbox, { tab: 'archived', query: '', userId: ME }))).toEqual(['archived-unread'])
    })

    it('ne tient compte que des favoris / archives de l\'utilisateur courant', () => {
      const other = [conv({ _id: 'fav-by-bob', favoritedBy: ['bob'], archivedBy: ['bob'] })]
      expect(filterConversations(other, { tab: 'favorites', query: '', userId: ME })).toHaveLength(0)
      expect(filterConversations(other, { tab: 'all', query: '', userId: ME })).toHaveLength(1)
    })

    it('recherche dans le pseudo de l\'interlocuteur et le dernier message, sans casse', () => {
      const list = [
        conv({ _id: 'a', otherParticipant: { username: 'JinFan' } }),
        conv({ _id: 'b', lastMessage: { content: 'Photocard Jin dispo ?' } }),
        conv({ _id: 'c', lastMessage: 'Rien à voir' })
      ]
      expect(ids(filterConversations(list, { tab: 'all', query: '  jin ', userId: ME }))).toEqual(['a', 'b'])
    })

    it('les compteurs d\'onglets correspondent aux listes', () => {
      expect(countConversationsByTab(inbox, ME)).toEqual({ all: 3, favorites: 1, unread: 1, archived: 1 })
    })
  })

  describe('getOtherParticipant', () => {
    it('préfère otherParticipant fourni par l\'API', () => {
      expect(getOtherParticipant(conv({ otherParticipant: { username: 'Bob' } }), ME)).toEqual({ username: 'Bob' })
    })

    it('rend le participant qui n\'est pas l\'utilisateur courant (objets ou identifiants)', () => {
      expect(getOtherParticipant(conv(), ME)).toMatchObject({ _id: 'alice' })
      expect(getOtherParticipant({ participants: [ME, 'alice'] }, ME)).toBe('alice')
    })

    it('rend null sans participant', () => {
      expect(getOtherParticipant({ participants: [] }, ME)).toBeNull()
    })
  })

  describe('isOwnMessage', () => {
    it('reconnaît l\'expéditeur sous forme d\'identifiant ou d\'objet', () => {
      expect(isOwnMessage({ sender: ME }, ME)).toBe(true)
      expect(isOwnMessage({ sender: { _id: ME } }, ME)).toBe(true)
      expect(isOwnMessage({ sender: 'alice' }, ME)).toBe(false)
    })

    it('ne plante pas sur un message système sans expéditeur', () => {
      expect(isOwnMessage({ sender: null }, ME)).toBe(false)
      expect(isOwnMessage({ sender: null, isOwn: true }, ME)).toBe(true)
    })
  })

  it('findOfferStatus associe l\'offre créée à la même seconde que le message', () => {
    const conversation = conv({
      offerHistory: [
        { createdAt: '2026-09-28T10:00:00.900Z', status: 'rejected' },
        { createdAt: '2026-09-28T10:05:00.120Z', status: 'accepted' }
      ]
    })
    expect(findOfferStatus(conversation, { createdAt: '2026-09-28T10:05:00.480Z' })).toBe('accepted')
    expect(findOfferStatus(conversation, { createdAt: '2026-09-28T11:00:00.000Z' })).toBeNull()
    expect(findOfferStatus(null, { createdAt: '2026-09-28T10:05:00.480Z' })).toBeNull()
  })

  it('formatMessageTimestamp rend un horodatage court', () => {
    const now = new Date('2026-09-28T12:00:00Z')
    expect(formatMessageTimestamp(null, now)).toBe('')
    expect(formatMessageTimestamp('2026-09-28T11:59:30Z', now)).toBe('maintenant')
    expect(formatMessageTimestamp('2026-09-28T11:55:00Z', now)).toBe('5m')
    expect(formatMessageTimestamp('2026-09-20T12:00:00Z', now)).toBe('20/09')
  })

  it('messageStatusIcon reflète lu / distribué / envoyé', () => {
    expect(messageStatusIcon({ readBy: ['a', 'b'] })).toBe('bi-check2-all text-primary')
    expect(messageStatusIcon({ readBy: ['a'], delivered: true })).toBe('bi-check2-all')
    expect(messageStatusIcon({})).toBe('bi-check2')
  })

  describe('encadré transaction', () => {
    it('libellé du statut de négociation', () => {
      expect(transactionStatusLabel(conv({ negotiation: { status: 'pending' } }))).toBe('En attente')
      expect(transactionStatusLabel(conv({ negotiation: { status: 'custom' } }))).toBe('custom')
    })
  })
})
