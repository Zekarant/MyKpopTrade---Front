import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { Cart, CartItem } from '@/services/cart.service'
import { useCartStore } from '@/store/cart.store'
import { formatPrice } from '@/utils/format'

/** Page panier : regroupement par vendeur, totaux exacts et retrait d'un article. */

const cartService = vi.hoisted(() => ({
  getCart: vi.fn(),
  validateCart: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
  checkout: vi.fn()
}))
const toasts = vi.hoisted(() => ({ showToastSuccess: vi.fn(), showToastError: vi.fn() }))

vi.mock('@/services/cart.service', () => ({ default: cartService }))
vi.mock('@/function', () => ({ func: toasts }))

import CartView from '../CartView.vue'

function cartItem(id: string, seller: string, price: number, shipping = 0): CartItem {
  return {
    product: {
      _id: id,
      title: `Photocard ${id}`,
      images: [],
      price,
      currency: 'EUR',
      isAvailable: true,
      isSold: false,
      seller,
      sellerUsername: seller
    },
    addedAt: '2026-10-01T00:00:00.000Z',
    priceSnapshot: price,
    currencySnapshot: 'EUR',
    shippingCosts: { national: shipping, worldwide: null, localPickup: 0 }
  }
}

const cartOf = (items: CartItem[]): Cart => ({ _id: 'c1', user: 'u1', items, updatedAt: '' })

async function mountCart(items: CartItem[]) {
  cartService.getCart.mockResolvedValue(cartOf(items))
  const wrapper = mount(CartView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } }
  })
  await flushPromises()
  return wrapper
}

describe('CartView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    setActivePinia(createPinia())
    cartService.validateCart.mockResolvedValue({ valid: true, issues: [] })
  })

  it('regroupe les articles par vendeur, chacun avec son sous-total', async () => {
    const wrapper = await mountCart([cartItem('a', 'minnie', 10), cartItem('b', 'jojo', 5), cartItem('c', 'minnie', 2.5)])

    const groups = wrapper.findAll('.cart-seller-group')
    expect(groups).toHaveLength(2)
    expect(groups[0].text()).toContain('@minnie')
    expect(groups[0].findAll('.cart-item')).toHaveLength(2)
    expect(groups[0].find('.cart-seller-group__total').text()).toBe(formatPrice(12.5))
    expect(groups[1].text()).toContain('@jojo')
    expect(groups[1].findAll('.cart-item')).toHaveLength(1)
    wrapper.unmount()
  })

  it('affiche des totaux exacts au centime, articles et livraison compris', async () => {
    const wrapper = await mountCart([cartItem('a', 'minnie', 0.1, 0.1), cartItem('b', 'minnie', 0.2, 0.2)])

    expect(wrapper.find('.cart-summary__total').text()).toBe(formatPrice(0.3))

    await wrapper.findAll('button').find((b) => b.text().includes('Passer commande'))!.trigger('click')
    const recap = wrapper.findAll('.cart-shipping__recap-row dd').map((dd) => dd.text())
    expect(recap).toEqual([formatPrice(0.3), formatPrice(0.3), formatPrice(0.6)])
    wrapper.unmount()
  })

  it('retire un article via le service et met à jour le badge du panier', async () => {
    const a = cartItem('a', 'minnie', 10)
    const b = cartItem('b', 'jojo', 5)
    const wrapper = await mountCart([a, b])
    expect(useCartStore().count).toBe(2)
    cartService.removeItem.mockResolvedValue(cartOf([b]))

    await wrapper.find('[aria-label="Retirer « Photocard a » du panier"]').trigger('click')
    await flushPromises()

    expect(cartService.removeItem).toHaveBeenCalledWith('a')
    expect(useCartStore().count).toBe(1)
    expect(wrapper.findAll('.cart-item')).toHaveLength(1)
    wrapper.unmount()
  })

  it('signale l\'échec d\'un retrait sans toucher au panier', async () => {
    const wrapper = await mountCart([cartItem('a', 'minnie', 10)])
    cartService.removeItem.mockRejectedValue(new Error('réseau'))

    await wrapper.find('.cart-item__remove').trigger('click')
    await flushPromises()

    expect(toasts.showToastError).toHaveBeenCalledWith('Erreur lors du retrait de l\'article.')
    expect(useCartStore().count).toBe(1)
    wrapper.unmount()
  })

  it('ferme la modale de livraison avec Échap', async () => {
    const wrapper = await mountCart([cartItem('a', 'minnie', 10)])

    await wrapper.findAll('button').find((b) => b.text().includes('Passer commande'))!.trigger('click')
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(document.activeElement).toBe(dialog.element)

    await wrapper.find('.popup-overlay').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
