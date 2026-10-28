import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'

/** Grille d'annonces : rendu stable, ouverture au clavier, « Charger plus » vers la recherche. */

const router = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('@/services/post.service', () => ({ default: { addFavorite: vi.fn() } }))
vi.mock('@/function', () => ({ func: { showToastSuccess: vi.fn(), showToastError: vi.fn() } }))
vi.mock('vue-router', () => ({ useRouter: () => router }))
vi.mock('@/components/post.vue', () => ({ default: { name: 'PostModal', props: ['idPost'], template: '<div class="post-modal" />' } }))
vi.mock('@/components/ImageCarousel.vue', () => ({ default: { template: '<div />' } }))

import Grid from '../grid.vue'
import type { Post } from '@/types/post.types'

const aPost = (_id: string, title = `Annonce ${_id}`) =>
  ({ _id, title, condition: 'good', price: 20, currency: 'EUR', images: [] }) as unknown as Post

function mountGrid(props: { dataList: Post[] } & Record<string, unknown>) {
  return mount(Grid, { props, global: { stubs: { Teleport: true } } })
}

describe('grille d\'annonces', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('garde chaque carte attachée à son annonce quand la liste change', async () => {
    const wrapper = mountGrid({ dataList: [aPost('a'), aPost('b')] })
    const cardOfB = wrapper.findAll('.product-card')[1].element

    await wrapper.setProps({ dataList: [aPost('b')] })

    expect(wrapper.findAll('.product-card')[0].element).toBe(cardOfB)
  })

  it('ouvre la fiche au clavier avec Entrée', async () => {
    const wrapper = mountGrid({ dataList: [aPost('a')] })
    const card = wrapper.get('.product-card')
    expect(card.attributes('role')).toBe('button')
    expect(card.attributes('tabindex')).toBe('0')

    await card.trigger('keydown', { key: 'Enter' })

    expect(wrapper.findComponent({ name: 'PostModal' }).props('idPost')).toBe('a')
  })

  it('« Charger plus » transmet la liste à la recherche et y navigue par paramètre de requête', async () => {
    const pagination = { page: 1, pages: 3, limit: 20, total: 60 }
    const wrapper = mountGrid({ dataList: [aPost('a')], pagination, moreBtn: true })

    await wrapper.get('.load-more-btn').trigger('click')

    expect(router.push).toHaveBeenCalledWith({ name: 'searchList', query: { event: 'morePage' } })
    expect(JSON.parse(sessionStorage.getItem('pagination_str')!)).toEqual(pagination)
    expect(JSON.parse(sessionStorage.getItem('posts_str')!)).toHaveLength(1)
  })

  it('applique le style transmis par le parent à la grille', () => {
    const wrapper = mountGrid({ dataList: [aPost('a')], style: { width: '100%' } })

    expect(wrapper.get('.product-grid').attributes('style')).toContain('width: 100%')
  })
})
