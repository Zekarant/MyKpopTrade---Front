import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { AxiosError, type AxiosResponse } from 'axios'

/** Page publique d'un groupe : fiche, suivi, membres, albums et annonces. */

const route = vi.hoisted(() => ({ params: { id: 'g1' } as Record<string, string>, fullPath: '/groups/g1' }))
const router = vi.hoisted(() => ({ push: vi.fn() }))
const groupService = vi.hoisted(() => ({ getGroupDetail: vi.fn(), getFollowStatus: vi.fn(), toggleFollow: vi.fn() }))
const postService = vi.hoisted(() => ({ getCatalogPosts: vi.fn() }))
const session = vi.hoisted(() => ({ hasSession: vi.fn() }))

vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => router }))
vi.mock('@/services/group.service', () => ({ default: groupService }))
vi.mock('@/services/post.service', () => ({ default: postService }))
vi.mock('@/services/session.cookies', () => session)
vi.mock('@/function', () => ({ func: { showToastError: vi.fn() } }))
vi.mock('@/components/grid.vue', () => ({
  default: { name: 'ProductGrid', props: ['dataList'], template: '<div class="grid-stub">{{ dataList.length }} annonces</div>' },
}))

import GroupView from '../GroupView.vue'

const detail = {
  group: { _id: 'g1', name: 'BTS', members: ['Jimin', 'Jungkook'], followersCount: 3, genres: ['K-pop'] },
  albums: [{ _id: 'a1', name: 'BE', coverImage: '/albums/be.jpg' }],
}
const listingPage = (count: number, page = 1, pages = 1) => ({
  products: Array.from({ length: count }, (_, i) => ({ _id: `p${page}-${i}` })),
  pagination: { page, pages, limit: 20 },
})

const mountView = () => mount(GroupView, { global: { stubs: { 'router-link': RouterLinkStub } } })

describe('GroupView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.params = { id: 'g1' }
    session.hasSession.mockReturnValue(false)
    groupService.getGroupDetail.mockResolvedValue(detail)
    postService.getCatalogPosts.mockResolvedValue(listingPage(2))
  })

  it('affiche le groupe, ses membres, ses albums et ses annonces', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('h1').text()).toBe('BTS')
    expect(wrapper.text()).toContain('3 abonnés')
    expect(wrapper.findAll('.catalog-chip').map((chip) => chip.text())).toEqual(['Jimin', 'Jungkook'])
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({ name: 'album', params: { id: 'a1' } })
    expect(postService.getCatalogPosts).toHaveBeenCalledWith({ group: 'g1', page: 1, limit: 20 })
    expect(wrapper.text()).toContain('2 annonces')
    expect(document.title).toBe('BTS · MyKpopTrade')
  })

  it('filtre les annonces sur le membre choisi, puis retire le filtre au second clic', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('.catalog-chip')[0].trigger('click')
    expect(postService.getCatalogPosts).toHaveBeenLastCalledWith({ group: 'g1', member: 'Jimin', page: 1, limit: 20 })

    await wrapper.findAll('.catalog-chip')[0].trigger('click')
    expect(postService.getCatalogPosts).toHaveBeenLastCalledWith({ group: 'g1', page: 1, limit: 20 })
  })

  it('charge la page suivante d\'annonces à la demande', async () => {
    postService.getCatalogPosts.mockResolvedValueOnce(listingPage(20, 1, 2)).mockResolvedValueOnce(listingPage(5, 2, 2))
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('button').find((b) => b.text().includes('Voir plus'))!.trigger('click')
    await flushPromises()

    expect(postService.getCatalogPosts).toHaveBeenLastCalledWith({ group: 'g1', page: 2, limit: 20 })
    expect(wrapper.text()).toContain('25 annonces')
  })

  it('envoie un visiteur anonyme vers la connexion pour suivre le groupe', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('button').find((b) => b.text().includes('Suivre'))!.trigger('click')

    expect(groupService.toggleFollow).not.toHaveBeenCalled()
    expect(groupService.getFollowStatus).not.toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith({ name: 'login', query: { redirect: '/groups/g1' } })
  })

  it('laisse un membre connecté suivre puis ne plus suivre le groupe', async () => {
    session.hasSession.mockReturnValue(true)
    groupService.getFollowStatus.mockResolvedValue(false)
    groupService.toggleFollow
      .mockResolvedValueOnce({ isFollowing: true, followersCount: 4 })
      .mockResolvedValueOnce({ isFollowing: false, followersCount: 3 })
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('button').find((b) => b.text().includes('Suivre'))!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Suivi')
    expect(wrapper.text()).toContain('4 abonnés')

    await wrapper.findAll('button').find((b) => b.text().includes('Suivi'))!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('3 abonnés')
  })

  it('affiche « Groupe introuvable » sur un 404', async () => {
    groupService.getGroupDetail.mockRejectedValue(
      new AxiosError('Erreur HTTP', undefined, undefined, undefined, { status: 404 } as AxiosResponse)
    )
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Groupe introuvable')
    expect(postService.getCatalogPosts).not.toHaveBeenCalled()
  })
})
