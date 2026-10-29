import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { CartItem } from '@/services/cart.service'

/** Adresse de livraison du panier : le pays part en code ISO à deux lettres, comme au paiement d'une annonce. */

vi.mock('@/function', () => ({ func: { showToastError: vi.fn() } }))

import CartShippingDialog from '../CartShippingDialog.vue'

const item: CartItem = {
  product: {
    _id: 'p1',
    title: 'Photocard',
    images: [],
    price: 10,
    currency: 'EUR',
    isAvailable: true,
    isSold: false,
    seller: 's1',
    sellerUsername: 'vendeur'
  },
  addedAt: '2026-10-01T00:00:00.000Z',
  priceSnapshot: 10,
  currencySnapshot: 'EUR',
  shippingCosts: { national: 2, worldwide: null, localPickup: 0 }
}

async function confirmWith(country?: string) {
  const wrapper = mount(CartShippingDialog, {
    props: { items: [item], currency: 'EUR', submitting: false },
    attachTo: document.body
  })
  await wrapper.find('[aria-label="Nom du destinataire"]').setValue('Camille')
  await wrapper.find('[aria-label="Adresse ligne 1"]').setValue('12 rue des Lilas')
  await wrapper.find('[aria-label="Code postal"]').setValue('69001')
  await wrapper.find('[aria-label="Ville"]').setValue('Lyon')
  if (country !== undefined) await wrapper.find('[aria-label="Pays (code à deux lettres)"]').setValue(country)
  await wrapper.find('.cart-btn--primary').trigger('click')
  const country$ = (wrapper.emitted('confirm')?.[0][0] as { shippingAddress?: { country: string } }).shippingAddress?.country
  wrapper.unmount()
  return country$
}

describe('CartShippingDialog — pays', () => {
  it('propose la France par défaut', async () => {
    expect(await confirmWith()).toBe('FR')
  })

  it('envoie le code en majuscules, espaces retirés', async () => {
    expect(await confirmWith(' be ')).toBe('BE')
  })

  it('retombe sur FR si le champ est vidé', async () => {
    expect(await confirmWith('')).toBe('FR')
  })

  it('limite la saisie à deux caractères', () => {
    const wrapper = mount(CartShippingDialog, { props: { items: [item], currency: 'EUR', submitting: false } })
    expect(wrapper.find('[aria-label="Pays (code à deux lettres)"]').attributes('maxlength')).toBe('2')
  })
})
