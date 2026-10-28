import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/** Étape K-pop du formulaire de vente : membres et albums proposés depuis le catalogue du groupe. */

const route = vi.hoisted(() => ({ query: {} as Record<string, string> }))
const postService = vi.hoisted(() => ({ createPost: vi.fn(), updatePost: vi.fn(), syncProductImages: vi.fn() }))
const groupService = vi.hoisted(() => ({ getGroupDetail: vi.fn(), getGroups: vi.fn(), searchGroups: vi.fn() }))
const func = vi.hoisted(() => ({ showToastError: vi.fn(), showToastSuccess: vi.fn() }))

vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/post.service', () => ({ default: postService }))
vi.mock('@/services/group.service', () => ({ default: groupService }))
vi.mock('@/services/messaging.service', () => ({ default: {} }))
vi.mock('@/services/authentification.service', () => ({ default: { verifSession: vi.fn(async () => undefined) } }))
vi.mock('@/services/payment.service', () => ({
  default: { getPayPalAccountStatus: vi.fn(async () => ({ connected: true })) },
}))
vi.mock('@/function', () => ({ func }))
vi.mock('swiper/vue', () => ({ Swiper: { template: '<div><slot /></div>' }, SwiperSlide: { template: '<div><slot /></div>' } }))
vi.mock('swiper/css', () => ({}))
vi.mock('swiper/css/navigation', () => ({}))

import AddPost from '../add_post.vue'

const groupDetail = {
  group: { _id: 'g1', name: 'BTS', members: ['Jimin', 'Jungkook'] },
  albums: [{ _id: 'a1', name: 'BE' }],
}

async function mountForm() {
  const wrapper = mount(AddPost, { global: { mocks: { $func: func, $router: { back: vi.fn() } } } })
  await flushPromises()
  return wrapper
}

/** État exposé par setup() : le formulaire tel qu'il partira à l'API. */
const formOf = (wrapper: Awaited<ReturnType<typeof mountForm>>) =>
  (wrapper.vm as unknown as { formData: Record<string, unknown> }).formData

describe('add_post — métadonnées K-pop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.query = {}
    groupService.getGroups.mockResolvedValue([{ _id: 'g1', name: 'BTS' }])
    groupService.searchGroups.mockResolvedValue([{ _id: 'g1', name: 'BTS' }])
    groupService.getGroupDetail.mockResolvedValue(groupDetail)
    postService.createPost.mockResolvedValue({ ok: false, error: { message: 'arrêt du test' } })
  })

  it('propose les membres et les albums du groupe choisi, et renseigne champs structurés et anciens champs', async () => {
    const wrapper = await mountForm()

    await wrapper.find('#kpopGroup').trigger('focus')
    await wrapper.findAll('.dropdown-item').find((item) => item.text() === 'BTS')!.trigger('mousedown')
    await flushPromises()

    expect(groupService.getGroupDetail).toHaveBeenCalledWith('g1')
    const memberSelect = wrapper.find('select#kpopMember')
    expect(memberSelect.findAll('option').map((option) => option.text())).toEqual(['Choisir un membre', 'Jimin', 'Jungkook'])
    await memberSelect.setValue('Jimin')

    await wrapper.find('#albumName').trigger('focus')
    await wrapper.findAll('.dropdown-item').find((item) => item.text() === 'BE')!.trigger('mousedown')
    await wrapper.find('#version').setValue('Ver. A')
    await wrapper.find('#isOfficial').setValue(true)

    expect(formOf(wrapper)).toMatchObject({
      group: 'g1', kpopGroup: 'g1',
      member: 'Jimin', kpopMember: 'Jimin',
      album: 'a1', albumName: 'a1',
      version: 'Ver. A', isOfficial: true,
    })
  })

  it('vide membre et album quand le groupe change', async () => {
    const wrapper = await mountForm()
    await wrapper.find('#kpopGroup').trigger('focus')
    await wrapper.findAll('.dropdown-item')[0].trigger('mousedown')
    await flushPromises()
    await wrapper.find('select#kpopMember').setValue('Jimin')

    await wrapper.find('#kpopGroup').trigger('focus')
    await wrapper.findAll('.dropdown-item')[0].trigger('mousedown')
    await flushPromises()

    expect(formOf(wrapper)).toMatchObject({ kpopMember: '', member: null, album: null, albumName: '' })
  })

  it('reste en saisie libre quand le groupe n\'a pas de membres au catalogue', async () => {
    groupService.getGroupDetail.mockResolvedValue({ group: { _id: 'g1', name: 'BTS', members: [] }, albums: [] })
    const wrapper = await mountForm()
    await wrapper.find('#kpopGroup').trigger('focus')
    await wrapper.findAll('.dropdown-item')[0].trigger('mousedown')
    await flushPromises()

    await wrapper.find('input#kpopMember').setValue('RM')

    expect(formOf(wrapper)).toMatchObject({ kpopMember: 'RM', member: 'RM' })
  })

  it('préremplit la modification et recharge les membres du groupe de l\'annonce', async () => {
    route.query = {
      postData: JSON.stringify({
        _id: 'p1', title: 'Photocard Jimin', images: ['/uploads/products/a.jpg'],
        shippingOptions: { worldwide: false, nationalOnly: true, localPickup: false, nationalCost: 2 },
        kpopGroup: 'g1', kpopGroupName: 'BTS', kpopMember: 'Jimin', albumName: 'a1', albumNameStr: 'BE',
        group: 'g1', member: 'Jimin', album: 'a1', version: 'Ver. B', isOfficial: false,
      }),
    }
    const wrapper = await mountForm()

    expect(groupService.getGroupDetail).toHaveBeenCalledWith('g1')
    expect((wrapper.find('select#kpopMember').element as HTMLSelectElement).value).toBe('Jimin')
    expect((wrapper.find('#version').element as HTMLInputElement).value).toBe('Ver. B')
    expect((wrapper.find('#albumName').element as HTMLInputElement).value).toBe('BE')
    expect(formOf(wrapper)).toMatchObject({ group: 'g1', member: 'Jimin', album: 'a1', isOfficial: false })
  })

  it('rend filtrable une ancienne annonce à partir des identifiants résolus par l\'API', async () => {
    route.query = {
      postData: JSON.stringify({
        _id: 'p1', title: 'Photocard', images: [],
        shippingOptions: { worldwide: false, nationalOnly: true, localPickup: false },
        kpopGroup: 'BTS', kpopGroupName: 'BTS', kpopGroupId: 'g1', kpopMember: 'Suga',
        albumName: 'BE', albumNameStr: 'BE', albumId: 'a1',
      }),
    }
    const wrapper = await mountForm()

    // « Suga » ne figure pas dans la liste du catalogue : seul le champ libre le garde.
    expect(formOf(wrapper)).toMatchObject({ group: 'g1', album: 'a1', kpopMember: 'Suga', member: null })
  })
})
