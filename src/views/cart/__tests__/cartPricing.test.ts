import { describe, expect, it } from 'vitest'
import { cartItemPrice, isNegotiatedPrice, sumCartItems } from '../cartPricing'

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
})
