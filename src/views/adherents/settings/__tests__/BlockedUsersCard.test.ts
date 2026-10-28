import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/** Membres bloqués : « Afficher plus » après des déblocages ne saute personne. */

const server = vi.hoisted(() => ({
  blocked: [] as { _id: string; username: string; blockedAt: string; deleted?: boolean }[]
}))

vi.mock('@/services/block.service', () => ({
  default: {
    // Pagination de l'API : `page` et `limit`, sur la liste telle qu'elle est au moment de l'appel.
    // Comme l'API, le blocage d'un compte supprimé est écarté après la pagination,
    // mais reste compté dans le total.
    listBlocked: vi.fn(async (page = 1, limit = 20) => ({
      blockedUsers: server.blocked.slice((page - 1) * limit, page * limit).filter((user) => !user.deleted),
      pagination: { page, limit, total: server.blocked.length, pages: Math.ceil(server.blocked.length / limit) }
    })),
    unblock: vi.fn(async (id: string) => {
      server.blocked = server.blocked.filter((user) => user._id !== id)
    })
  }
}))
vi.mock('@/function', () => ({ func: { showToastSuccess: vi.fn(), showToastError: vi.fn() } }))

import BlockedUsersCard from '../BlockedUsersCard.vue'

const member = (n: number) => ({ _id: `u${n}`, username: `membre${n}`, blockedAt: '2026-09-01T10:00:00Z' })

async function mountCard() {
  const wrapper = mount(BlockedUsersCard, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, UserAvatar: true } }
  })
  await flushPromises()
  return wrapper
}

const shownIds = (wrapper: Awaited<ReturnType<typeof mountCard>>) =>
  wrapper.findAll('.blocked-users__name').map((link) => link.text().replace('membre', 'u'))

const moreButton = (wrapper: Awaited<ReturnType<typeof mountCard>>) =>
  wrapper.findAll('button').find((button) => button.text() === 'Afficher plus')

describe('BlockedUsersCard', () => {
  beforeEach(() => {
    server.blocked = Array.from({ length: 45 }, (_, i) => member(i + 1))
  })

  it('affiche la suite sans sauter de membre après des déblocages', async () => {
    const wrapper = await mountCard()
    expect(shownIds(wrapper)).toHaveLength(20)

    await wrapper.find('[aria-label="Débloquer membre3"]').trigger('click')
    await wrapper.find('[aria-label="Débloquer membre7"]').trigger('click')
    await flushPromises()
    await moreButton(wrapper)!.trigger('click')
    await flushPromises()

    // Fin de la page 1 décalée (u21, u22), puis la page 2 entière : aucun trou.
    expect(shownIds(wrapper)).toEqual(server.blocked.slice(0, 40).map((user) => user._id))

    await moreButton(wrapper)!.trigger('click')
    await flushPromises()

    expect(shownIds(wrapper)).toEqual(server.blocked.map((user) => user._id))
    expect(moreButton(wrapper)).toBeUndefined()
  })

  it('va jusqu\'au bout quand une page est raccourcie par un compte supprimé', async () => {
    server.blocked = server.blocked.slice(0, 25)
    server.blocked[4].deleted = true

    const wrapper = await mountCard()
    expect(shownIds(wrapper)).toHaveLength(19)

    await moreButton(wrapper)!.trigger('click')
    await flushPromises()

    expect(shownIds(wrapper)).toEqual(server.blocked.filter((user) => !user.deleted).map((user) => user._id))
    expect(moreButton(wrapper)).toBeUndefined()
  })

  it('n\'affiche plus « Afficher plus » une fois tous les membres listés', async () => {
    server.blocked = server.blocked.slice(0, 5)

    const wrapper = await mountCard()

    expect(shownIds(wrapper)).toHaveLength(5)
    expect(moreButton(wrapper)).toBeUndefined()
  })
})
