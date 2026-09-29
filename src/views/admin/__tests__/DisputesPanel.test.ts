import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/** Pagination des litiges : l'API renvoie `pagination.pages`. */

const disputes = vi.hoisted(() => ({ adminList: vi.fn(), adminTake: vi.fn(), adminResolve: vi.fn() }))
const router = vi.hoisted(() => ({ replace: vi.fn() }))

vi.mock('@/services/dispute.service', () => ({ default: disputes }))
vi.mock('@/function', () => ({ func: { showToastSuccess: vi.fn(), showToastError: vi.fn() } }))
vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }), useRouter: () => router }))

import DisputesPanel from '../panels/DisputesPanel.vue'

const dispute = {
  _id: 'd1',
  buyer: { _id: 'b1', username: 'acheteur' },
  seller: { _id: 's1', username: 'vendeur' },
  reason: 'not_received',
  status: 'opened',
  description: 'Rien reçu',
  createdAt: '2026-09-01T10:00:00.000Z'
}

const listResponse = (pages: number) => ({
  success: true,
  disputes: [dispute],
  pagination: { page: 1, limit: 20, total: pages * 20, pages }
})

describe('DisputesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche la pagination quand l\'API annonce plusieurs pages', async () => {
    disputes.adminList.mockResolvedValue(listResponse(3))
    const wrapper = mount(DisputesPanel)
    await flushPromises()

    expect(wrapper.find('.admin__pagination').text()).toContain('1 / 3')

    await wrapper.findAll('.admin__pagination button')[1].trigger('click')
    await flushPromises()
    expect(disputes.adminList).toHaveBeenLastCalledWith({ status: 'opened', page: 2, limit: 20 })
  })

  it('masque la pagination sur une seule page ou aucune', async () => {
    disputes.adminList.mockResolvedValue(listResponse(1))
    const single = mount(DisputesPanel)
    await flushPromises()
    expect(single.find('.admin__pagination').exists()).toBe(false)

    disputes.adminList.mockResolvedValue({ ...listResponse(0), disputes: [] })
    const empty = mount(DisputesPanel)
    await flushPromises()
    expect(empty.find('.admin__pagination').exists()).toBe(false)
  })
})
