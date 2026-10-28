import { describe, expect, it } from 'vitest'
import { fromCents, sumAmounts, toCents } from '../money'

describe('money', () => {
  it('convertit les unités en centimes entiers, et retour', () => {
    expect(toCents(19.99)).toBe(1999)
    expect(toCents(0.29)).toBe(29)
    expect(fromCents(2498)).toBe(24.98)
  })

  it('additionne sans erreur d\'arrondi flottant', () => {
    expect(0.1 + 0.2).not.toBe(0.3)
    expect(sumAmounts([0.1, 0.2])).toBe(0.3)
    expect(sumAmounts([19.99, 4.99])).toBe(24.98)
  })

  it('compte une valeur absente ou illisible pour zéro plutôt que d\'afficher NaN', () => {
    expect(toCents(Number.NaN)).toBe(0)
    expect(toCents(undefined)).toBe(0)
    expect(sumAmounts([10, Number.NaN])).toBe(10)
  })
})
