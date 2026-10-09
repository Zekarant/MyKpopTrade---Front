import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'

/** Bouton « Sauvegarder cette recherche » de la page de résultats. */

const savedSearchApi = vi.hoisted(() => ({ create: vi.fn() }))
const searchApi = vi.hoisted(() => ({ advancedSearch: vi.fn() }))
const session = vi.hoisted(() => ({ loggedIn: true }))
const route = vi.hoisted(() => ({ current: { query: {} as Record<string, string | string[]> } }))
const toast = vi.hoisted(() => ({
  showToastSuccess: vi.fn(),
  showToastError: vi.fn(),
  showToastInfo: vi.fn(),
  buildCombinedSlug: (query: string, event: string) => [query, event].filter(Boolean).join('-')
}))

vi.mock('@/services/savedSearch.service', () => ({ default: savedSearchApi }))
vi.mock('@/services/search.service', () => ({ default: searchApi }))
vi.mock('@/services/post.service', () => ({ default: {} }))
vi.mock('@/services/session.cookies', () => ({ hasSession: () => session.loggedIn }))
vi.mock('@vueuse/core', () => ({ useInfiniteScroll: vi.fn() }))
vi.mock('vue-router', () => ({ useRoute: () => route.current, useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/components/search_bar_2.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/filter_list.vue', () => ({
  default: { name: 'FilterListStub', props: ['initialFilters'], emits: ['saveFilter'], template: '<div />' }
}))
vi.mock('@/components/grid.vue', () => ({ default: { template: '<div />' } }))

import SearchList from '../searchList.vue'

async function mountPage(query: Record<string, string | string[]> = {}) {
  route.current = reactive({ query })
  const wrapper = mount(SearchList, { global: { mocks: { $func: toast } } })
  await flushPromises()
  return wrapper
}

const saveButton = (wrapper: Awaited<ReturnType<typeof mountPage>>) => wrapper.find('.save-search-btn')

describe('searchList — sauvegarde de la recherche', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session.loggedIn = true
    searchApi.advancedSearch.mockResolvedValue({ products: [], pagination: { page: 1, limit: 10, pages: 1, total: 0 } })
    savedSearchApi.create.mockResolvedValue({ _id: 's1' })
  })

  it('applique les critères portés par l\'URL à la recherche', async () => {
    await mountPage({ q: 'golden', group: 'BTS', type: 'photocard', max: '30' })

    expect(searchApi.advancedSearch).toHaveBeenCalledWith(expect.objectContaining({
      query: 'golden', groups: ['BTS'], type: 'photocard', priceRange: { max: 30 }
    }))
  })

  it('sauvegarde les critères en cours avec un nom par défaut', async () => {
    const wrapper = await mountPage({ q: 'golden', group: 'BTS', max: '30' })

    await saveButton(wrapper).trigger('click')
    await flushPromises()

    expect(savedSearchApi.create).toHaveBeenCalledWith({
      name: '« golden » · BTS',
      criteria: { query: 'golden', groups: ['BTS'], priceRange: { max: 30 } }
    })
    expect(toast.showToastSuccess).toHaveBeenCalled()
  })

  it('affiche le refus de l\'API (limite atteinte…)', async () => {
    savedSearchApi.create.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: 'Vous avez atteint la limite de 20 recherches sauvegardées.' } }
    })
    const wrapper = await mountPage({ q: 'golden' })

    await saveButton(wrapper).trigger('click')
    await flushPromises()

    expect(toast.showToastError).toHaveBeenCalledWith('Vous avez atteint la limite de 20 recherches sauvegardées.')
  })

  it('applique l\'état choisi dans le sélecteur, qui n\'en renvoie qu\'un', async () => {
    const wrapper = await mountPage()
    searchApi.advancedSearch.mockClear()

    wrapper.findComponent({ name: 'FilterListStub' }).vm.$emit('saveFilter', {
      min: 0, max: 100, conditions: 'new', type: null, group: null, member: null
    })
    await flushPromises()

    const payload = searchApi.advancedSearch.mock.calls[0][0]
    expect(payload.condition).toEqual(['new'])
    expect(payload).not.toHaveProperty('type')
  })

  it('rejoue les critères du catalogue et les sauvegarde par identifiant', async () => {
    const wrapper = await mountPage({ groupId: '64b000000000000000000001', member: 'Felix', official: 'true' })

    expect(searchApi.advancedSearch).toHaveBeenCalledWith(expect.objectContaining({
      group: '64b000000000000000000001', member: 'Felix', isOfficial: true
    }))
    expect(wrapper.findComponent({ name: 'FilterListStub' }).props('initialFilters')).toMatchObject({
      groupId: '64b000000000000000000001', member: 'Felix', isOfficial: true
    })

    await saveButton(wrapper).trigger('click')
    await flushPromises()

    expect(savedSearchApi.create).toHaveBeenCalledWith({
      name: 'Felix',
      criteria: { group: '64b000000000000000000001', member: 'Felix', isOfficial: true }
    })
  })

  it('n\'enregistre rien sans critère', async () => {
    const wrapper = await mountPage()

    await saveButton(wrapper).trigger('click')

    expect(savedSearchApi.create).not.toHaveBeenCalled()
    expect(toast.showToastInfo).toHaveBeenCalled()
  })

  it('ne propose pas la sauvegarde à un visiteur non connecté', async () => {
    session.loggedIn = false
    const wrapper = await mountPage({ q: 'golden' })

    expect(saveButton(wrapper).exists()).toBe(false)
  })
})
