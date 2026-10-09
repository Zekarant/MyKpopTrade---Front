import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { AxiosError, type AxiosResponse } from 'axios'

/** Page /products/:id : lien partageable vers une annonce, consultable sans compte. */

const route = vi.hoisted(() => ({ params: { id: 'p1' } as Record<string, string> }))
const router = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }))
const postService = vi.hoisted(() => ({ getPost: vi.fn() }))

vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => router }))
vi.mock('@/services/post.service', () => ({ default: postService }))
vi.mock('@/components/adherents/nav_bar.vue', () => ({ default: { template: '<nav />' } }))
vi.mock('@/components/post.vue', () => ({
  default: {
    name: 'PostDetail',
    props: ['idPost', 'product'],
    emits: ['closePost', 'sold'],
    template: '<article class="post-stub">{{ product.product.title }}</article>',
  },
}))

import ProductView from '../ProductView.vue'

const productResponse = {
  product: { _id: 'p1', title: 'Photocard Jimin', seller: { _id: 's1', username: 'minnie' } },
  isFavorite: false,
}

function httpError(status: number) {
  return new AxiosError('Erreur HTTP', undefined, undefined, undefined, { status } as AxiosResponse)
}

const mountView = () => mount(ProductView, { global: { stubs: { 'router-link': RouterLinkStub } } })

describe('ProductView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.params = { id: 'p1' }
  })

  it('affiche le chargement puis l\'annonce, sans la recharger dans la fiche', async () => {
    postService.getPost.mockResolvedValue(productResponse)

    const wrapper = mountView()
    expect(wrapper.text()).toContain('Chargement de l\'annonce')

    await flushPromises()

    expect(postService.getPost).toHaveBeenCalledWith('p1')
    expect(postService.getPost).toHaveBeenCalledTimes(1)
    const detail = wrapper.findComponent({ name: 'PostDetail' })
    expect(detail.props()).toMatchObject({ idPost: 'p1', product: productResponse })
    expect(wrapper.text()).toContain('Photocard Jimin')
    expect(document.title).toBe('Photocard Jimin · MyKpopTrade')
  })

  it('affiche « Annonce introuvable » et un lien vers l\'accueil sur un 404', async () => {
    postService.getPost.mockRejectedValue(httpError(404))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Annonce introuvable')
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe('/')
    expect(wrapper.findComponent({ name: 'PostDetail' }).exists()).toBe(false)
  })

  it('propose de réessayer quand le serveur ne répond pas', async () => {
    postService.getPost.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce(productResponse)

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Impossible de charger l\'annonce')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Photocard Jimin')
  })

  it('ramène à l\'accueil à la fermeture quand on est arrivé par le lien', async () => {
    postService.getPost.mockResolvedValue(productResponse)
    window.history.replaceState(null, '', '/products/p1')

    const wrapper = mountView()
    await flushPromises()
    wrapper.findComponent({ name: 'PostDetail' }).vm.$emit('closePost')

    expect(router.push).toHaveBeenCalledWith('/')
    expect(router.back).not.toHaveBeenCalled()
  })
})
