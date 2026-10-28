import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/** Page /negotiate/:productId : charge l'annonce depuis `{ product }` et applique ses règles d'offre. */

const router = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }))
const postService = vi.hoisted(() => ({ getPost: vi.fn() }))
const store = vi.hoisted(() => ({ initiateNegotiation: vi.fn() }))

vi.mock('vue-router', () => ({ useRouter: () => router }))
vi.mock('@/services/post.service', () => ({ default: postService }))
vi.mock('@/store/messaging.store', () => ({ useMessagingStore: () => store }))

import NegotiateView from '../NegotiateView.vue'

/** La route passe `:productId` en prop (`props: true`). */
function mountPage() {
  return mount(NegotiateView, { props: { productId: 'p1' } })
}

const baseProduct = {
  _id: 'p1',
  title: 'Photocard Jimin',
  description: 'Neuve',
  price: 40,
  currency: 'EUR',
  images: ['/uploads/products/a.jpg'],
  seller: { _id: 's1', username: 'minnie' },
  allowOffers: true,
  minOfferPercentage: 50,
}

describe('NegotiateView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche l\'annonce renvoyée sous `product` et propose le seuil minimal', async () => {
    postService.getPost.mockResolvedValue({ product: baseProduct, isFavorite: false })

    const wrapper = mountPage()
    await flushPromises()

    expect(postService.getPost).toHaveBeenCalledWith('p1')
    expect(wrapper.text()).toContain('Photocard Jimin')
    expect(wrapper.text()).toContain('Vendu par minnie')
    expect(wrapper.find('img.main-image').attributes('src')).toContain('/uploads/products/a.jpg')
    expect((wrapper.find('input.price-input').element as HTMLInputElement).value).toBe('20')
    expect(wrapper.text()).not.toContain('Produit non trouvé')
  })

  it('affiche la fourchette d\'un prix libre à la place des pourcentages', async () => {
    postService.getPost.mockResolvedValue({
      product: { ...baseProduct, allowOffers: false, isPayWhatYouWant: true, pwywMinPrice: 8, pwywMaxPrice: 30 },
      isFavorite: false,
    })

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text().replace(/\s/g, ' ')).toContain('entre 8 € et 30 €')
    expect(wrapper.find('.price-helpers').exists()).toBe(false)
    expect((wrapper.find('input.price-input').element as HTMLInputElement).value).toBe('8')
  })

  it('bloque l\'envoi d\'une offre hors fourchette', async () => {
    postService.getPost.mockResolvedValue({
      product: { ...baseProduct, allowOffers: false, isPayWhatYouWant: true, pwywMinPrice: 8, pwywMaxPrice: 30 },
      isFavorite: false,
    })

    const wrapper = mountPage()
    await flushPromises()
    await wrapper.find('input.price-input').setValue('35')

    expect(wrapper.text().replace(/\s/g, ' ')).toContain('Le prix libre ne dépasse pas 30 €.')
    expect(wrapper.find('.form-actions .btn-primary').attributes('disabled')).toBeDefined()
  })

  it('envoie l\'offre et le message puis ouvre la conversation', async () => {
    postService.getPost.mockResolvedValue({ product: baseProduct, isFavorite: false })
    store.initiateNegotiation.mockResolvedValue({ conversation: { _id: 'c1' } })

    const wrapper = mountPage()
    await flushPromises()
    await wrapper.find('.price-helpers .percentage-btn:nth-child(3)').trigger('click')
    expect(wrapper.find('.offer-summary .savings').text()).toBe('12 € (30%)')
    await wrapper.find('textarea').setValue('Possible à 28 € ?')
    await wrapper.find('.form-actions .btn-primary').trigger('click')
    await flushPromises()

    expect(store.initiateNegotiation).toHaveBeenCalledWith('p1', 28, 'Possible à 28 € ?')
    expect(router.push).toHaveBeenCalledWith({ name: 'conversation', params: { id: 'c1' } })
  })

  it('affiche l\'état d\'erreur si l\'annonce est introuvable', async () => {
    postService.getPost.mockRejectedValue(new Error('404'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Produit non trouvé')
  })
})
