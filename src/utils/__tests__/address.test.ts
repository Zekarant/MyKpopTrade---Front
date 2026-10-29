import { describe, it, expect } from 'vitest'
import { isPostalAddressComplete, isShippingAddressComplete, toShippingAddressPayload } from '../address'

/** Adresses : mêmes règles au panier, au paiement d'une annonce et dans les paramètres. */

const postal = { streetLine1: '12 rue des Lilas', postalCode: '69001', city: 'Lyon' }

describe('adresses', () => {
  it('adresse postale : rue, code postal et ville, espaces seuls refusés', () => {
    expect(isPostalAddressComplete(postal)).toBe(true)
    expect(isPostalAddressComplete({ ...postal, city: '  ' })).toBe(false)
    expect(isPostalAddressComplete({ ...postal, postalCode: null })).toBe(false)
  })

  it('adresse de livraison : exige en plus le destinataire, pas le pays', () => {
    expect(isShippingAddressComplete({ ...postal, recipientName: 'Camille' })).toBe(true)
    expect(isShippingAddressComplete(postal)).toBe(false)
  })

  it('envoie une adresse nettoyée, pays en majuscules (FR par défaut), facultatifs vides omis', () => {
    expect(toShippingAddressPayload({
      recipientName: ' Camille ',
      streetLine1: ' 12 rue des Lilas ',
      streetLine2: '  ',
      postalCode: ' 69001 ',
      city: ' Lyon ',
      country: ' be ',
      phone: ''
    })).toEqual({
      recipientName: 'Camille',
      streetLine1: '12 rue des Lilas',
      streetLine2: undefined,
      postalCode: '69001',
      city: 'Lyon',
      country: 'BE',
      phone: undefined
    })
    expect(toShippingAddressPayload({ recipientName: 'C', streetLine1: 'r', postalCode: '1', city: 'v' }).country).toBe('FR')
  })
})
