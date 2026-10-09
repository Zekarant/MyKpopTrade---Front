import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { UrlSearchCriteria } from '@/utils/savedSearch'

/** Panneau de filtres : valeurs « Tous… » réellement vides, et critères rejoués affichés. */

const groupApi = vi.hoisted(() => ({ getGroupDetail: vi.fn(), searchGroups: vi.fn() }))
vi.mock('@/services/group.service', () => ({ default: groupApi }))

import FilterList from '../filter_list.vue'

type Filters = UrlSearchCriteria['filters']

const noFilters = (overrides: Partial<Filters> = {}): Filters => ({
  min: null, max: null, conditions: null, type: null, group: null, groupId: null,
  member: null, albumId: null, version: null, isOfficial: false, ...overrides
})

const apply = async (wrapper: ReturnType<typeof mount>) => {
  const button = wrapper.findAll('button').find((b) => b.text().includes('Appliquer'))
  await button!.trigger('click')
  const emitted = wrapper.emitted('saveFilter')!
  return emitted[emitted.length - 1][0] as Record<string, unknown>
}

/** Revient sur la première option (« Tous les… »), comme le ferait l'utilisateur. */
async function chooseFirstOption(wrapper: ReturnType<typeof mount>, selector: string) {
  const select = wrapper.get(selector)
  ;(select.element as HTMLSelectElement).selectedIndex = 0
  await select.trigger('change')
}

describe('filter_list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('« Tous les types » et « Tous les états » n\'envoient aucun critère', async () => {
    const wrapper = mount(FilterList)
    await wrapper.get('[data-test="filter-type"]').setValue('album')
    await wrapper.get('[data-test="filter-condition"]').setValue('new')

    await chooseFirstOption(wrapper, '[data-test="filter-type"]')
    await chooseFirstOption(wrapper, '[data-test="filter-condition"]')
    const filters = await apply(wrapper)

    expect(filters.type).toBeNull()
    expect(filters.conditions).toBeNull()
  })

  it('envoie l\'état choisi', async () => {
    const wrapper = mount(FilterList)

    await wrapper.get('[data-test="filter-condition"]').setValue('new')

    expect((await apply(wrapper)).conditions).toBe('new')
  })

  it('affiche les critères rejoués depuis l\'URL, nom du groupe compris', async () => {
    groupApi.getGroupDetail.mockResolvedValue({ group: { _id: 'g1', name: 'Stray Kids', members: ['Felix', 'Han'] }, albums: [] })
    const wrapper = mount(FilterList, {
      props: { initialFilters: noFilters({ groupId: 'g1', member: 'Felix', conditions: ['new'], type: 'album', min: 5, max: 40 }) }
    })
    await flushPromises()

    expect(groupApi.getGroupDetail).toHaveBeenCalledWith('g1')
    expect(wrapper.get('.filter-panel__tag').text()).toContain('Stray Kids')
    expect((wrapper.get('#filter-member').element as HTMLSelectElement).value).toBe('Felix')
    expect((wrapper.get('[data-test="filter-type"]').element as HTMLSelectElement).value).toBe('album')
    expect((wrapper.get('[aria-label="Prix maximum en euros"]').element as HTMLInputElement).value).toBe('40')
    expect(await apply(wrapper)).toMatchObject({ groupId: 'g1', group: 'Stray Kids', member: 'Felix', min: 5, max: 40 })
  })
})
