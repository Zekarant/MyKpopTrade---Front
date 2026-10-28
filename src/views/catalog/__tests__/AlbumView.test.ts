import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { AxiosError, type AxiosResponse } from 'axios'

/** Page publique d'un album : fiche, lien vers le groupe et annonces. */

const route = vi.hoisted(() => ({ params: { id: 'a1' } as Record<string, string> }))
const albumService = vi.hoisted(() => ({ getAlbum: vi.fn() }))
const postService = vi.hoisted(() => ({ getCatalogPosts: vi.fn() }))

vi.mock('vue-router', () => ({ useRoute: () => route }))
vi.mock('@/services/album.service', () => ({ default: albumService }))
vi.mock('@/services/post.service', () => ({ default: postService }))
vi.mock('@/components/grid.vue', () => ({
  default: { name: 'ProductGrid', props: ['dataList'], template: '<div class="grid-stub">{{ dataList.length }} annonces</div>' },
}))

import AlbumView from '../AlbumView.vue'

const album = {
  _id: 'a1',
  name: 'BE',
  albumType: 'album',
  totalTracks: 8,
  releaseDate: '2020-11-20T00:00:00.000Z',
  artistId: { _id: 'g1', name: 'BTS' },
}

const mountView = () => mount(AlbumView, { global: { stubs: { 'router-link': RouterLinkStub } } })

describe('AlbumView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.params = { id: 'a1' }
    albumService.getAlbum.mockResolvedValue(album)
    postService.getCatalogPosts.mockResolvedValue({ products: [{ _id: 'p1' }], pagination: { page: 1, pages: 1 } })
  })

  it('affiche l\'album, un lien vers son groupe et ses annonces', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('h1').text()).toBe('BE')
    expect(wrapper.text()).toContain('8 titres')
    expect(wrapper.text()).toContain('20 novembre 2020')
    const groupLink = wrapper.findComponent(RouterLinkStub)
    expect(groupLink.props('to')).toEqual({ name: 'group', params: { id: 'g1' } })
    expect(groupLink.text()).toBe('BTS')
    expect(postService.getCatalogPosts).toHaveBeenCalledWith({ album: 'a1', page: 1, limit: 20 })
    expect(wrapper.text()).toContain('1 annonces')
  })

  it('indique qu\'aucune annonce n\'est en vente', async () => {
    postService.getCatalogPosts.mockResolvedValue({ products: [], pagination: { page: 1, pages: 0 } })
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Aucune annonce en vente pour cet album.')
  })

  it('affiche « Album introuvable » sur un identifiant invalide (400)', async () => {
    albumService.getAlbum.mockRejectedValue(
      new AxiosError('Erreur HTTP', undefined, undefined, undefined, { status: 400 } as AxiosResponse)
    )
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Album introuvable')
  })
})
