import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useOfferActions } from '../useOfferActions'
import type { ViewConversation, ViewMessage } from '../../types'

/** Réponse d'une action sur une offre : elle ne s'applique qu'à la conversation encore ouverte. */

const conversation = (id: string) => ({ _id: id }) as unknown as ViewConversation

function setup() {
  let answer!: (value: { conversation: ViewConversation }) => void
  const store = {
    respondToNegotiation: vi.fn(() => new Promise((resolve) => { answer = resolve }))
  }
  const selected = ref<ViewConversation | null>(conversation('a'))
  const reload = vi.fn()
  const actions = useOfferActions({
    store: store as unknown as Parameters<typeof useOfferActions>[0]['store'],
    selected,
    toast: { showToastSuccess: vi.fn(), showToastError: vi.fn() },
    reload,
    onOfferPosted: vi.fn()
  })
  return { selected, reload, actions, answer: (value: { conversation: ViewConversation }) => answer(value) }
}

describe('useOfferActions', () => {
  it('recharge la conversation après une acceptation', async () => {
    const { reload, actions, answer } = setup()

    const accepting = actions.accept({ conversation: 'a' } as unknown as ViewMessage)
    answer({ conversation: conversation('a') })
    await accepting

    expect(reload).toHaveBeenCalledWith(conversation('a'))
  })

  it('ne ramène pas vers la conversation quittée avant la réponse', async () => {
    const { selected, reload, actions, answer } = setup()

    const accepting = actions.accept({ conversation: 'a' } as unknown as ViewMessage)
    selected.value = conversation('b')
    answer({ conversation: conversation('a') })
    await accepting

    expect(reload).not.toHaveBeenCalled()
    expect(selected.value).toEqual(conversation('b'))
  })
})
