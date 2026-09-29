import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/** Panneau admin K-pop : payloads envoyés au back, vignettes et followers. */

const albums = vi.hoisted(() => ({
  getAlbums: vi.fn(),
  searchAlbums: vi.fn(),
  createAlbum: vi.fn(),
  updateAlbum: vi.fn(),
  deleteAlbum: vi.fn()
}))
const groups = vi.hoisted(() => ({
  getGroups: vi.fn(),
  searchGroups: vi.fn(),
  getFollowers: vi.fn(),
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroup: vi.fn()
}))
const toast = vi.hoisted(() => ({ showToastSuccess: vi.fn(), showToastError: vi.fn() }))

vi.mock('@/services/album.service', () => ({ default: albums }))
vi.mock('@/services/group.service', () => ({ default: groups }))
vi.mock('@/function', () => ({ func: toast }))

import KpopPanel from '../panels/KpopPanel.vue'

const GROUPS = [
  { _id: 'g1', name: 'NewJeans', profileImage: 'https://example.com/nj.jpg', followersCount: 2 },
  { _id: 'g2', name: 'IVE', profileImage: '/images/groups/default-group.jpg', followersCount: 0 }
]
const ALBUM = {
  _id: 'a1',
  name: 'Get Up',
  artistId: { _id: 'g1', name: 'NewJeans' },
  artistName: 'NewJeans',
  albumType: 'ep',
  releaseDate: '2023-07-21T00:00:00.000Z',
  coverImage: 'https://example.com/get-up.jpg'
}

async function mountPanel() {
  const wrapper = mount(KpopPanel, { attachTo: document.body })
  await flushPromises()
  return wrapper
}

async function showAlbums(wrapper: Awaited<ReturnType<typeof mountPanel>>) {
  await wrapper.findAll('.admin__toolbar button')[1].trigger('click')
}

async function openCreateForm(wrapper: Awaited<ReturnType<typeof mountPanel>>) {
  const add = wrapper.findAll('button').find((button) => button.text() === 'Ajouter')
  await add!.trigger('click')
}

describe('KpopPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    groups.getGroups.mockResolvedValue(GROUPS)
    albums.getAlbums.mockResolvedValue([ALBUM])
    albums.createAlbum.mockResolvedValue(ALBUM)
    albums.updateAlbum.mockResolvedValue(ALBUM)
    groups.createGroup.mockResolvedValue(GROUPS[0])
  })

  it('crée un album avec artistId et albumType', async () => {
    const wrapper = await mountPanel()
    await showAlbums(wrapper)
    await openCreateForm(wrapper)

    await wrapper.find('#album-name').setValue('Supernatural')
    await wrapper.find('#album-group').setValue('g1')
    await wrapper.find('#album-type').setValue('single')
    await wrapper.find('#album-date').setValue('2024-06-21')
    await wrapper.find('.admin__modal-footer .admin__btn--primary').trigger('click')
    await flushPromises()

    expect(albums.createAlbum).toHaveBeenCalledWith({
      name: 'Supernatural',
      artistId: 'g1',
      albumType: 'single',
      releaseDate: '2024-06-21'
    })
    expect(toast.showToastSuccess).toHaveBeenCalledWith('Album créé')
    wrapper.unmount()
  })

  it('bloque la création d\'un album sans groupe', async () => {
    const wrapper = await mountPanel()
    await showAlbums(wrapper)
    await openCreateForm(wrapper)

    await wrapper.find('#album-name').setValue('Sans groupe')
    await wrapper.find('.admin__modal-footer .admin__btn--primary').trigger('click')
    await flushPromises()

    expect(albums.createAlbum).not.toHaveBeenCalled()
    expect(toast.showToastError).toHaveBeenCalledWith('Choisissez le groupe de l\'album')
    wrapper.unmount()
  })

  it('modifie un album en renvoyant artistId et albumType', async () => {
    const wrapper = await mountPanel()
    await showAlbums(wrapper)
    await wrapper.find('.admin__table [title="Modifier"]').trigger('click')

    expect((wrapper.find('#album-group').element as HTMLSelectElement).value).toBe('g1')
    await wrapper.find('#album-group').setValue('g2')
    await wrapper.find('.admin__modal-footer .admin__btn--primary').trigger('click')
    await flushPromises()

    expect(albums.updateAlbum).toHaveBeenCalledWith('a1', {
      name: 'Get Up',
      artistId: 'g2',
      albumType: 'ep',
      releaseDate: '2023-07-21',
      coverImage: 'https://example.com/get-up.jpg'
    })
    wrapper.unmount()
  })

  it('envoie l\'image d\'un groupe sous profileImage', async () => {
    const wrapper = await mountPanel()
    await openCreateForm(wrapper)

    await wrapper.find('#group-name').setValue('aespa')
    await wrapper.find('#group-image').setValue('https://example.com/aespa.jpg')
    await wrapper.find('.admin__modal-footer .admin__btn--primary').trigger('click')
    await flushPromises()

    expect(groups.createGroup).toHaveBeenCalledWith({ name: 'aespa', profileImage: 'https://example.com/aespa.jpg' })
    wrapper.unmount()
  })

  it('affiche profileImage en vignette, l\'initiale pour l\'image par défaut ou cassée', async () => {
    const wrapper = await mountPanel()
    const rows = wrapper.findAll('.admin__table tbody tr')

    expect(rows[0].find('img').attributes('src')).toBe('https://example.com/nj.jpg')
    expect(rows[1].find('img').exists()).toBe(false)
    expect(rows[1].find('.admin__avatar-letter').text()).toBe('I')

    await rows[0].find('img').trigger('error')
    expect(rows[0].find('img').exists()).toBe(false)
    expect(rows[0].find('.admin__avatar-letter').text()).toBe('N')
    wrapper.unmount()
  })

  it('liste les followers renvoyés par l\'API', async () => {
    groups.getFollowers.mockResolvedValue({
      groupId: 'g1',
      groupName: 'NewJeans',
      followers: [{ _id: 'u1', username: 'bunny' }, { _id: 'u2', username: 'tokki' }],
      pagination: { page: 1, limit: 50, total: 2, pages: 1 }
    })
    const wrapper = await mountPanel()

    await wrapper.find('.admin__table [title="Voir les followers"]').trigger('click')
    await flushPromises()

    expect(groups.getFollowers).toHaveBeenCalledWith('g1', 1, 50)
    expect(wrapper.findAll('.admin__definition dt').map((dt) => dt.text())).toEqual(['B bunny', 'T tokki'])
    wrapper.unmount()
  })
})
