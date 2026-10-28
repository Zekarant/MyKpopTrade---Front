import { describe, expect, it } from 'vitest'
import { cartItemPrice, cartShipping, groupCartItemsBySeller, isNegotiatedPrice, sumCartItems } from '../cartPricing'

const item = (price: number, buyerPrice?: number, priceSnapshot = price) => ({
  priceSnapshot,
  buyerPrice,
  product: { price }
})

describe('cartPricing', () => {
  it('affiche le prix négocié renvoyé par le back', () => {
    expect(cartItemPrice(item(20, 15))).toBe(15)
    expect(isNegotiatedPrice(item(20, 15))).toBe(true)
  })

  it('retombe sur le snapshot sans buyerPrice', () => {
    expect(cartItemPrice(item(20, undefined, 18))).toBe(18)
    expect(isNegotiatedPrice(item(20))).toBe(false)
  })

  it('ne signale pas de négociation quand seul le prix catalogue a changé', () => {
    expect(isNegotiatedPrice(item(25, 25, 20))).toBe(false)
  })

  it('totalise ce que PayPal facturera', () => {
    expect(sumCartItems([item(20, 15), item(8, 8), item(5)])).toBe(28)
  })

  it('totalise au centime près, sans erreur d\'arrondi flottant', () => {
    expect(sumCartItems([item(0.1), item(0.2)])).toBe(0.3)
    expect(sumCartItems([item(19.99), item(0.01), item(4.7)])).toBe(24.7)
  })
})

describe('groupCartItemsBySeller', () => {
  const sold = (id: string, seller: string) => ({ id, product: { seller } })

  it('regroupe les articles par vendeur, dans l\'ordre du panier', () => {
    expect(groupCartItemsBySeller([sold('a', 's1'), sold('b', 's2'), sold('c', 's1')])).toEqual([
      { sellerId: 's1', items: [sold('a', 's1'), sold('c', 's1')] },
      { sellerId: 's2', items: [sold('b', 's2')] }
    ])
  })

  it('range ensemble les articles dont le vendeur est inconnu', () => {
    expect(groupCartItemsBySeller([sold('a', ''), sold('b', '')])).toEqual([
      { sellerId: 'unknown', items: [sold('a', ''), sold('b', '')] }
    ])
  })
})

describe('cartShipping', () => {
  const shipped = (title: string, national: number | null, localPickup: number | null = null) => ({
    product: { title },
    shippingCosts: { national, worldwide: null, localPickup }
  })

  it('additionne les frais de port de chaque article, comme PayPal', () => {
    expect(cartShipping([shipped('A', 3.5), shipped('B', 2)], 'national')).toEqual({ amount: 5.5, undeliverable: [] })
  })

  it('cumule les frais au centime près', () => {
    expect(cartShipping([shipped('A', 0.1), shipped('B', 0.2)], 'national').amount).toBe(0.3)
  })

  it('signale les articles non livrables par la méthode choisie', () => {
    expect(cartShipping([shipped('A', 3.5), shipped('B', null, 0)], 'localPickup')).toEqual({
      amount: 0,
      undeliverable: ['A']
    })
  })
})
