import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/** Favoris vendus ou retirés dans une grille : grisés, non ouvrables, retirables. */

const postApi = vi.hoisted(() => ({ addFavorite: vi.fn() }))
const toast = vi.hoisted(() => ({ showToastSuccess: vi.fn(), showToastError: vi.fn() }))

vi.mock('@/services/post.service', () => ({ default: postApi }))
vi.mock('@/function', () => ({ func: toast }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/components/post.vue', () => ({ default: { name: 'PostModal', template: '<div class="post-modal" />' } }))
vi.mock('@/components/ImageCarousel.vue', () => ({ default: { template: '<div />' } }))

import Grid from '../grid.vue'
import type { Post } from '@/types/post.types'

const aFavorite = (overrides: Partial<Post> = {}) => ({
  _id: 'p1',
  title: 'Photocard Jungkook',
  condition: 'good',
  price: 20,
  currency: 'EUR',
  images: [],
  unavailableReason: null,
  ...overrides
}) as Post

function mountGrid(dataList: Post[]) {
  return mount(Grid, { props: { dataList }, global: { stubs: { Teleport: true } } })
}

describe('grille — favoris indisponibles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('grise un favori retiré et affiche « Plus disponible »', () => {
    const wrapper = mountGrid([aFavorite({ unavailableReason: 'withdrawn' })])

    expect(wrapper.get('.product-card').classes()).toContain('product-card--unavailable')
    expect(wrapper.text()).toContain('Plus disponible')
  })

  it('n\'ouvre pas la fiche d\'un favori indisponible, mais ouvre les autres', async () => {
    const wrapper = mountGrid([aFavorite({ _id: 'gone', unavailableReason: 'sold' }), aFavorite({ _id: 'ok' })])
    const [gone, available] = wrapper.findAll('.product-card')

    await gone.trigger('click')
    expect(wrapper.findComponent({ name: 'PostModal' }).exists()).toBe(false)

    await available.trigger('click')
    expect(wrapper.findComponent({ name: 'PostModal' }).exists()).toBe(true)
  })

  it('retire le favori et le masque de la grille', async () => {
    postApi.addFavorite.mockResolvedValue(true)
    const wrapper = mountGrid([aFavorite({ unavailableReason: 'withdrawn' })])

    await wrapper.get('.product-card__remove').trigger('click')
    await flushPromises()

    expect(postApi.addFavorite).toHaveBeenCalledWith('p1')
    expect(wrapper.get('.product-card').isVisible()).toBe(false)
    expect(wrapper.findComponent({ name: 'PostModal' }).exists()).toBe(false)
    expect(toast.showToastSuccess).toHaveBeenCalledWith('Retiré de vos favoris')
  })

  it('n\'affiche pas d\'action de retrait sur un favori disponible', () => {
    const wrapper = mountGrid([aFavorite()])

    expect(wrapper.find('.product-card__remove').exists()).toBe(false)
  })
})
