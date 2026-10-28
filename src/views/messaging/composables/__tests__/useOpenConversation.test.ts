import { describe, it, expect, vi } from 'vitest'
import { useOpenConversation } from '../useOpenConversation'
import type { ViewConversation, ViewMessage } from '../../types'

/** Conversation ouverte : en changeant vite, seule la dernière demandée s'affiche. */

const conversation = (id: string, unreadCount = 0) => ({ _id: id, unreadCount, messages: [] }) as unknown as ViewConversation

const detailOf = (id: string) => ({
  conversation: { _id: id, title: `détail ${id}` },
  messages: [{ _id: `${id}-m1` } as unknown as ViewMessage],
  pagination: { page: 1, limit: 20, total: 1, pages: 1 }
})

function setup() {
  const store = {
    fetchConversation: vi.fn(),
    markAsRead: vi.fn(async () => undefined),
    $onAction: vi.fn()
  }
  const open = useOpenConversation({
    store: store as unknown as Parameters<typeof useOpenConversation>[0]['store'],
    userId: () => 'me',
    scrollToBottom: vi.fn(async () => undefined)
  })
  return { store, ...open }
}

/** Réponse de l'API que le test délivre quand il le décide. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

describe('useOpenConversation', () => {
  it('garde la conversation choisie en dernier quand la précédente répond en retard', async () => {
    const { store, select, selected, messages, loading } = setup()
    const late = deferred<ReturnType<typeof detailOf>>()
    store.fetchConversation.mockReturnValueOnce(late.promise).mockResolvedValueOnce(detailOf('b'))

    const first = select(conversation('a'))
    await select(conversation('b'))
    late.resolve(detailOf('a'))
    await first

    expect(selected.value).toMatchObject({ _id: 'b', title: 'détail b' })
    expect(messages.value.map((m) => m._id)).toEqual(['b-m1'])
    expect(loading.value).toBe(false)
  })

  it('ne charge pas une conversation quittée pendant son marquage comme lue', async () => {
    const { store, select, selected } = setup()
    const marking = deferred<undefined>()
    store.markAsRead.mockReturnValueOnce(marking.promise)
    store.fetchConversation.mockResolvedValue(detailOf('b'))

    const first = select(conversation('a', 3))
    await select(conversation('b'))
    marking.resolve(undefined)
    await first

    expect(store.fetchConversation).toHaveBeenCalledTimes(1)
    expect(store.fetchConversation).toHaveBeenCalledWith('b')
    expect(selected.value).toMatchObject({ _id: 'b' })
  })

  it('n\'affiche rien d\'une conversation fermée avant la réponse', async () => {
    const { store, select, close, selected, messages } = setup()
    const late = deferred<ReturnType<typeof detailOf>>()
    store.fetchConversation.mockReturnValueOnce(late.promise)

    const pending = select(conversation('a'))
    close()
    late.resolve(detailOf('a'))
    await pending

    expect(selected.value).toBeNull()
    expect(messages.value).toEqual([])
  })
})
