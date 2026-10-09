import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

/** Page « Recherches sauvegardées » : liste, alertes, renommage, suppression et lien « Lancer ». */

const api = vi.hoisted(() => ({ list: vi.fn(), update: vi.fn(), remove: vi.fn(), create: vi.fn() }))
const toast = vi.hoisted(() => ({ showToastSuccess: vi.fn(), showToastError: vi.fn() }))

const catalog = vi.hoisted(() => ({ getGroup: vi.fn(), getAlbum: vi.fn() }))

vi.mock('@/services/savedSearch.service', () => ({ default: api }))
vi.mock('@/function', () => ({ func: toast }))
vi.mock('@/services/group.service', () => ({ default: { getGroup: catalog.getGroup } }))
vi.mock('@/services/album.service', () => ({ default: { getAlbum: catalog.getAlbum } }))

import SavedSearchesPage from '../savedSearches.vue'

const aSearch = (overrides = {}) => ({
  _id: 's1',
  name: 'BTS pas chères',
  criteria: { query: 'golden', groups: ['BTS'], type: 'photocard', priceRange: { max: 30 } },
  alertsEnabled: true,
  lastNotifiedAt: null,
  createdAt: '2026-10-01T10:00:00Z',
  ...overrides
})

/** Expose la cible du lien pour vérifier ce que « Lancer » ouvre. */
const RouterLinkStub = defineComponent({
  props: { to: { type: [Object, String], required: true } },
  setup(props, { slots, attrs }) {
    return () => h('a', { ...attrs, 'data-to': JSON.stringify(props.to) }, slots.default?.())
  }
})

async function mountPage() {
  const wrapper = mount(SavedSearchesPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
  await flushPromises()
  return wrapper
}

describe('page Recherches sauvegardées', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.list.mockResolvedValue([aSearch()])
  })

  it('liste les recherches avec le résumé de leurs critères', async () => {
    const wrapper = await mountPage()

    const item = wrapper.get('[data-test="saved-search"]')
    expect(item.text()).toContain('BTS pas chères')
    expect(item.text()).toContain('Groupe : BTS')
    expect(item.text()).toContain('Prix : jusqu\'à 30')
  })

  it('« Lancer » ouvre la recherche avec ses critères dans l\'URL', async () => {
    const wrapper = await mountPage()

    const target = JSON.parse(wrapper.get('[data-test="launch"]').attributes('data-to')!)

    expect(target).toEqual({
      name: 'searchList',
      query: { q: 'golden', group: 'BTS', type: 'photocard', max: '30' }
    })
  })

  it('affiche les noms des groupes et albums du catalogue, et les rejoue par identifiant', async () => {
    api.list.mockResolvedValue([aSearch({ criteria: { group: 'g1', member: 'Felix', album: 'a1' } })])
    catalog.getGroup.mockResolvedValue({ _id: 'g1', name: 'Stray Kids' })
    catalog.getAlbum.mockRejectedValue(new Error('404'))
    const wrapper = await mountPage()

    const target = JSON.parse(wrapper.get('[data-test="launch"]').attributes('data-to')!)
    expect(wrapper.text()).toContain('Groupe : Stray Kids')
    expect(wrapper.text()).toContain('Album : album du catalogue')
    expect(target.query).toEqual({ groupId: 'g1', member: 'Felix', albumId: 'a1' })
  })

  it('coupe les alertes et affiche l\'état renvoyé par l\'API', async () => {
    api.update.mockResolvedValue(aSearch({ alertsEnabled: false }))
    const wrapper = await mountPage()

    await wrapper.get('[data-test="alerts-toggle"]').trigger('click')
    await flushPromises()

    expect(api.update).toHaveBeenCalledWith('s1', { alertsEnabled: false })
    expect((wrapper.get('[data-test="alerts-toggle"]').element as HTMLInputElement).checked).toBe(false)
    expect(toast.showToastSuccess).toHaveBeenCalledWith('Alertes désactivées')
  })

  it('renomme une recherche', async () => {
    api.update.mockResolvedValue(aSearch({ name: 'Golden' }))
    const wrapper = await mountPage()

    await wrapper.get('[data-test="rename"]').trigger('click')
    await wrapper.get('[data-test="rename-input"]').setValue('  Golden ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(api.update).toHaveBeenCalledWith('s1', { name: 'Golden' })
    expect(wrapper.get('.saved-search__name').text()).toBe('Golden')
  })

  it('supprime une recherche après confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    api.remove.mockResolvedValue(undefined)
    const wrapper = await mountPage()

    await wrapper.get('[data-test="delete"]').trigger('click')
    await flushPromises()

    expect(api.remove).toHaveBeenCalledWith('s1')
    expect(wrapper.findAll('[data-test="saved-search"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('Aucune recherche sauvegardée')
  })

  it('affiche le message de l\'API quand une modification échoue', async () => {
    api.update.mockRejectedValue({ isAxiosError: true, response: { data: { message: 'Recherche sauvegardée introuvable' } } })
    const wrapper = await mountPage()

    await wrapper.get('[data-test="alerts-toggle"]').trigger('click')
    await flushPromises()

    expect(toast.showToastError).toHaveBeenCalledWith('Recherche sauvegardée introuvable')
    expect((wrapper.get('[data-test="alerts-toggle"]').element as HTMLInputElement).checked).toBe(true)
  })
})
