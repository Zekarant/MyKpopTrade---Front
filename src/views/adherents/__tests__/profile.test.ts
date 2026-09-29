import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, reactive } from 'vue'

/**
 * Comportements de la page profil que les captures d'écran ne voient pas.
 */

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }))
const feed = vi.hoisted(() => ({ getUserPosts: vi.fn(), getPost: vi.fn(), createPost: vi.fn(), deletePost: vi.fn(), toggleLike: vi.fn(), replyToPost: vi.fn() }))
const reviewsApi = vi.hoisted(() => ({ getProfileReviews: vi.fn() }))

// Route réactive, exposée pour simuler une navigation d'un profil à l'autre.
vi.mock('vue-router', async () => {
  const { reactive: makeReactive } = await import('vue')
  const route = makeReactive({ params: { id: 'me' } as Record<string, string> })
  return { useRoute: () => route, useRouter: () => ({ push: vi.fn() }), testRoute: route }
})
vi.mock('@/services/http', () => ({ createApiClient: () => http }))
vi.mock('@/services/feedPost.service', () => ({ default: feed }))
vi.mock('@/services/review.service', () => ({ default: reviewsApi }))
vi.mock('@/services/follow.service', () => ({ default: { getFollowers: vi.fn(async () => ({ followers: [], total: 0 })) } }))
vi.mock('@/services/authentification.service', () => ({ default: { verifSession: vi.fn(async () => undefined) } }))
vi.mock('@/components/adherents/nav_bar.vue', () => ({ default: { template: '<nav />' } }))
vi.mock('@/components/adherents/banner.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/grid.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/report_card.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/review_card.vue', () => ({
  default: defineComponent({ props: ['review'], setup: (props) => () => h('p', { class: 'avis' }, props.review.review) })
}))
vi.mock('@/components/filter_review.vue', () => ({
  default: defineComponent({
    emits: ['filter'],
    setup: (_props, { emit }) => () =>
      h('button', { class: 'tri-ancien', onClick: () => emit('filter', { rating: '', sort: 'oldest' }) })
  })
}))

import * as router from 'vue-router'
import Profile from '../profile.vue'

const reactiveRoute = () => (router as unknown as { testRoute: { params: Record<string, string> } }).testRoute

const me = { _id: 'me-id', username: 'MoiMeme' }
const alice = { id: 'alice-id', username: 'AliceK' }

async function mountProfile() {
  const wrapper = mount(Profile, {
    global: {
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
      mocks: { $router: { push: vi.fn() } }
    }
  })
  await flushPromises()
  return wrapper
}

async function openTab(wrapper: Awaited<ReturnType<typeof mountProfile>>, label: string) {
  await wrapper.findAll('.btn-group .btn').find((b) => b.text() === label)!.trigger('click')
  await flushPromises()
}

describe('page profil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    reactiveRoute().params.id = 'me'
    http.get.mockImplementation(async (url: string) => {
      if (url === '/api/auth/profile') return { data: { user: me } }
      if (url === '/api/profiles/user/alice-id') return { data: { profile: alice } }
      return { data: { products: [] } }
    })
    feed.getUserPosts.mockImplementation(async (userId: string) => ({
      posts: [{ _id: `post-${userId}`, author: { username: userId }, content: `publication de ${userId}`, createdAt: new Date().toISOString() }]
    }))
    reviewsApi.getProfileReviews.mockResolvedValue({
      stats: { averageRating: 4.5, totalRatings: 2 },
      ratings: reactive([
        { _id: 'recent', rating: 5, review: 'avis récent', createdAt: '2026-09-20T10:00:00Z' },
        { _id: 'ancien', rating: 4, review: 'avis ancien', createdAt: '2026-01-10T10:00:00Z' }
      ])
    })
    http.post.mockResolvedValue({ status: 201 })
  })

  it('affiche mes publications une fois le profil chargé', async () => {
    const wrapper = await mountProfile()

    expect(feed.getUserPosts).toHaveBeenCalledWith('me-id')
    expect(wrapper.text()).toContain('publication de me-id')
  })

  it('recharge les publications quand on revient sur l\'onglet', async () => {
    const wrapper = await mountProfile()
    await openTab(wrapper, 'À propos')

    await openTab(wrapper, 'Posts')

    expect(feed.getUserPosts).toHaveBeenCalledTimes(2)
  })

  it('garde le brouillon de publication d\'un onglet à l\'autre', async () => {
    const wrapper = await mountProfile()
    await wrapper.find('.post-create__textarea').setValue('Brouillon')

    await openTab(wrapper, 'Avis')
    await openTab(wrapper, 'Posts')

    expect((wrapper.find('.post-create__textarea').element as HTMLTextAreaElement).value).toBe('Brouillon')
  })

  it('affiche les publications du nouveau profil quand on change de profil', async () => {
    const wrapper = await mountProfile()

    reactiveRoute().params.id = 'alice-id'
    await flushPromises()

    expect(wrapper.text()).toContain('publication de alice-id')
    expect(wrapper.text()).not.toContain('publication de me-id')
  })

  it('affiche mes publications en revenant d\'un autre profil vers le mien', async () => {
    reactiveRoute().params.id = 'alice-id'
    const wrapper = await mountProfile()
    expect(wrapper.text()).toContain('publication de alice-id')

    reactiveRoute().params.id = 'me'
    await flushPromises()

    expect(wrapper.text()).toContain('publication de me-id')
    expect(wrapper.text()).not.toContain('publication de alice-id')
  })

  it('rattache la réponse au bon avis même après un tri', async () => {
    const wrapper = await mountProfile()
    await openTab(wrapper, 'Avis')
    await wrapper.find('.tri-ancien').trigger('click')

    // Premier avis affiché après le tri : le plus ancien.
    await wrapper.findAll('.review-item__respond-btn')[0].trigger('click')
    await wrapper.find('.response-popup__textarea').setValue('Merci !')
    await wrapper.find('.response-popup__btn--primary').trigger('click')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/api/profiles/ratings/ancien/response', { response: 'Merci !' })
    const items = wrapper.findAll('.review-item')
    expect(items[0].text()).toContain('avis ancien')
    expect(items[0].text()).toContain('Merci !')
    expect(items[1].text()).not.toContain('Merci !')
  })
})
