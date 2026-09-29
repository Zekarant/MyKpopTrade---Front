import { describe, it, expect } from 'vitest'
import {
  acceptsOffers,
  offerBounds,
  optionalAmount,
  pwywRangeLabel,
  validateOfferAmount,
  validatePwywSettings
} from '../offerRules'
import { sellerIdOf } from '../sellerId'

/** Intl sépare parfois avec une espace insécable : on compare sur des espaces simples. */
const plain = (text: string | null) => text?.replace(/\s/g, ' ') ?? null

describe('offerRules — prix libre', () => {
  const pwyw = { price: 40, allowOffers: false, isPayWhatYouWant: true, pwywMinPrice: 5, pwywMaxPrice: 30 }

  it('ouvre les offres sur une annonce à prix libre même sans allowOffers', () => {
    expect(acceptsOffers(pwyw)).toBe(true)
    expect(acceptsOffers({ price: 40, allowOffers: false })).toBe(false)
    expect(acceptsOffers({ price: 40, allowOffers: true })).toBe(true)
  })

  it('remplace le pourcentage minimal par la fourchette du vendeur', () => {
    expect(offerBounds(pwyw)).toEqual({ mode: 'pwyw', min: 5, max: 30 })
    expect(offerBounds({ ...pwyw, pwywMaxPrice: null })).toEqual({ mode: 'pwyw', min: 5, max: null })
  })

  it('accepte les bornes et refuse ce qui sort de la fourchette', () => {
    expect(validateOfferAmount(5, pwyw)).toBeNull()
    expect(validateOfferAmount(30, pwyw)).toBeNull()
    expect(plain(validateOfferAmount(4.99, pwyw))).toBe('Le prix libre commence à 5 €.')
    expect(plain(validateOfferAmount(30.5, pwyw))).toBe('Le prix libre ne dépasse pas 30 €.')
  })

  it('autorise une offre au-dessus du prix affiché si la fourchette le permet', () => {
    expect(validateOfferAmount(45, { ...pwyw, pwywMaxPrice: null })).toBeNull()
  })

  it('refuse un montant nul ou vide, même avec un minimum à 0', () => {
    expect(validateOfferAmount(0, { ...pwyw, pwywMinPrice: 0 })).toBe('Indiquez un montant supérieur à 0.')
    expect(validateOfferAmount(Number.NaN, pwyw)).toBe('Indiquez un montant supérieur à 0.')
  })

  it('formule la fourchette affichée sur la fiche', () => {
    expect(plain(pwywRangeLabel(5, null))).toBe('à partir de 5 €')
    expect(plain(pwywRangeLabel(5, 12.5))).toBe('entre 5 € et 12,5 €')
    expect(plain(pwywRangeLabel(0, undefined, '$'))).toBe('à partir de 0 $')
  })
})

describe('offerRules — négociation classique', () => {
  const product = { price: 19.99, allowOffers: true, minOfferPercentage: 50 }

  it('arrondit le seuil au centime supérieur pour rester au-dessus du minimum du back', () => {
    expect(offerBounds(product)).toMatchObject({ mode: 'negotiation', min: 10, minPercentage: 50 })
    expect(validateOfferAmount(10, product)).toBeNull()
  })

  it('applique 50 % par défaut, comme le back', () => {
    expect(offerBounds({ price: 100, allowOffers: true })).toMatchObject({ min: 50, minPercentage: 50 })
  })

  it('refuse une offre sous le seuil ou au prix demandé', () => {
    expect(plain(validateOfferAmount(9, product))).toBe('L\'offre minimum est de 10 € (50 % du prix).')
    expect(validateOfferAmount(19.99, product)).toBe('L\'offre doit être inférieure au prix demandé.')
  })
})

describe('offerRules — réglage du prix libre par le vendeur', () => {
  it('exige un minimum positif ou nul', () => {
    expect(validatePwywSettings(0, '')).toBeNull()
    expect(validatePwywSettings('', '')).toBe('Indiquez un prix minimum de 0 € ou plus.')
    expect(validatePwywSettings(-1, null)).toBe('Indiquez un prix minimum de 0 € ou plus.')
  })

  it('accepte un maximum absent et exige sinon qu\'il dépasse le minimum', () => {
    expect(validatePwywSettings(5, undefined)).toBeNull()
    expect(validatePwywSettings(5, 6)).toBeNull()
    expect(validatePwywSettings(5, 5)).toBe('Le prix maximum doit être supérieur au prix minimum.')
    expect(validatePwywSettings(5, 2)).toBe('Le prix maximum doit être supérieur au prix minimum.')
  })

  it('lit un champ numérique effacé comme absent', () => {
    expect(optionalAmount('')).toBeNull()
    expect(optionalAmount(12)).toBe(12)
    expect(optionalAmount(Number.NaN)).toBeNull()
  })
})

describe('sellerIdOf', () => {
  it('lit `_id` sur un vendeur peuplé par l\'annonce', () => {
    expect(sellerIdOf({ _id: 'seller-1' })).toBe('seller-1')
  })

  it('retombe sur `id` pour un profil transmis par la page parente', () => {
    expect(sellerIdOf({ id: 'seller-2' })).toBe('seller-2')
    expect(sellerIdOf({ _id: '', id: 'seller-2' })).toBe('seller-2')
  })

  it('rend undefined sans vendeur', () => {
    expect(sellerIdOf(undefined)).toBeUndefined()
    expect(sellerIdOf({})).toBeUndefined()
  })
})
