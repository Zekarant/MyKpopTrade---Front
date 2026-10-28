import { describe, it, expect, vi } from 'vitest'
import { useConversationMessages } from '../useConversationMessages'
import type { ViewMessage } from '../../types'

/** Messages de la conversation ouverte : pages anciennes et doublons du temps réel. */

const message = (id: string) => ({ _id: id, content: id }) as unknown as ViewMessage

const pageOf = (ids: string[], page: number, pages: number) => ({
  messages: ids.map(message),
  pagination: { page, limit: 20, total: pages * 20, pages }
})

function setup(...responses: ReturnType<typeof pageOf>[]) {
  const fetchConversation = vi.fn()
  responses.forEach((response) => fetchConversation.mockResolvedValueOnce(response))
  const store = { fetchConversation } as unknown as Parameters<typeof useConversationMessages>[0]
  return { fetchConversation, ...useConversationMessages(store) }
}

describe('useConversationMessages', () => {
  it('ajoute la page précédente au-dessus des messages affichés', async () => {
    const { messages, load, loadOlder, fetchConversation } = setup(pageOf(['m3', 'm4'], 1, 2), pageOf(['m1', 'm2'], 2, 2))

    await load('c1')
    await loadOlder('c1')

    expect(messages.value.map((m) => m._id)).toEqual(['m1', 'm2', 'm3', 'm4'])
    expect(fetchConversation).toHaveBeenLastCalledWith('c1', { page: 2, limit: 20 })
  })

  it('ne redemande rien une fois la dernière page atteinte', async () => {
    const { pagination, load, loadOlder, fetchConversation } = setup(pageOf(['m1'], 1, 1))

    await load('c1')
    await loadOlder('c1')

    expect(pagination.value.hasMore).toBe(false)
    expect(fetchConversation).toHaveBeenCalledTimes(1)
  })

  it('arrête de charger quand le serveur renvoie une page vide', async () => {
    const { pagination, load, loadOlder, fetchConversation } = setup(pageOf(['m3'], 1, 3), pageOf([], 2, 3))
    await load('c1')

    await loadOlder('c1')
    await loadOlder('c1')

    expect(pagination.value.hasMore).toBe(false)
    expect(fetchConversation).toHaveBeenCalledTimes(2)
  })

  it('ignore un second chargement lancé pendant le premier', async () => {
    const { load, loadOlder, fetchConversation } = setup(pageOf(['m3'], 1, 3), pageOf(['m2'], 2, 3))
    await load('c1')

    await Promise.all([loadOlder('c1'), loadOlder('c1')])

    expect(fetchConversation).toHaveBeenCalledTimes(2)
  })

  it('n\'ajoute pas deux fois un message reçu par l\'envoi puis par le temps réel', () => {
    const { messages, append } = setup()

    expect(append(message('m1'))).toBe(true)
    expect(append(message('m1'))).toBe(false)
    expect(messages.value).toHaveLength(1)
  })

  it('repart de la première page quand on change de conversation', async () => {
    const { pagination, load, clear } = setup(pageOf(['m1'], 1, 1))
    await load('c1')

    clear()

    expect(pagination.value).toMatchObject({ page: 1, hasMore: true })
  })
})
