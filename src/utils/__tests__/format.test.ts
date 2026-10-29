import { describe, it, expect, vi } from 'vitest'

vi.mock('@/config/api', () => ({ API_URL: 'https://api.test' }))

import { currencySymbol, formatDate, formatDateTime, formatPrice, formatRelative, mediaUrl } from '../format'

/** Intl sépare milliers et devise par des espaces insécables : on les normalise. */
const plain = (value: string) => value.replace(/\s/g, ' ')

describe('formatPrice', () => {
  it('formate un montant en euros, à la française', () => {
    expect(plain(formatPrice(1234.5))).toBe('1 234,50 €')
  })

  it('respecte la devise de l\'annonce', () => {
    expect(plain(formatPrice(20, 'USD'))).toBe('20,00 $US')
  })

  it('rend une chaîne vide pour un montant absent ou illisible', () => {
    expect(formatPrice(null)).toBe('')
    expect(formatPrice(undefined)).toBe('')
    expect(formatPrice(Number.NaN)).toBe('')
  })

  it('ne plante pas sur un code devise inconnu', () => {
    expect(formatPrice(12, 'PAS-UNE-DEVISE')).toBe('12.00 PAS-UNE-DEVISE')
  })
})

describe('formatDate', () => {
  // Midi UTC : le jour reste le même quel que soit le fuseau de la machine de test.
  const date = '2026-10-09T12:00:00Z'

  it('format court par défaut', () => {
    expect(formatDate(date)).toBe('09 oct. 2026')
  })

  it('format long pour les phrases', () => {
    expect(formatDate(date, 'long')).toBe('9 octobre 2026')
  })

  it('rend une chaîne vide plutôt que « Invalid Date »', () => {
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('')).toBe('')
    expect(formatDate('pas une date')).toBe('')
  })
})

describe('formatDateTime', () => {
  it('ajoute l\'heure à la date courte', () => {
    const text = formatDateTime(new Date(2026, 9, 9, 14, 5))
    expect(text).toContain('09 oct. 2026')
    expect(text).toContain('14:05')
  })

  it('rend une chaîne vide pour une valeur absente', () => {
    expect(formatDateTime(null)).toBe('')
  })
})

describe('formatRelative', () => {
  const now = new Date('2026-10-09T12:00:00Z').getTime()
  const ago = (ms: number) => new Date(now - ms).toISOString()
  const MIN = 60_000
  const HOUR = 60 * MIN
  const DAY = 24 * HOUR

  it.each([
    [10_000, "À l'instant"],
    [5 * MIN, '5 min'],
    [3 * HOUR, '3h'],
    [2 * DAY, '2j'],
    [15 * DAY, '2 sem.'],
    [90 * DAY, '3 mois']
  ])('il y a %i ms → %s', (elapsed, expected) => {
    expect(formatRelative(ago(elapsed), now)).toBe(expected)
  })

  it('au-delà d\'un an, affiche la date', () => {
    expect(formatRelative('2025-03-01T12:00:00Z', now)).toBe('1 mars')
  })

  it('rend une chaîne vide sans date', () => {
    expect(formatRelative('', now)).toBe('')
  })

  it('en phrase (`ago`) : « il y a … », sauf « À l\'instant » et la date', () => {
    expect(formatRelative(ago(5 * MIN), now, { ago: true })).toBe('il y a 5 min')
    expect(formatRelative(ago(2 * DAY), now, { ago: true })).toBe('il y a 2j')
    expect(formatRelative(ago(10_000), now, { ago: true })).toBe("À l'instant")
    expect(formatRelative('2025-03-01T12:00:00Z', now, { ago: true })).toBe('1 mars')
  })
})

describe('currencySymbol', () => {
  it('donne le symbole d\'une devise connue, le code sinon', () => {
    expect(currencySymbol('EUR')).toBe('€')
    expect(currencySymbol('USD')).toBe('$')
    expect(currencySymbol()).toBe('€')
    expect(currencySymbol('CHF')).toBe('CHF')
  })
})

describe('mediaUrl', () => {
  it('préfixe les chemins de l\'API', () => {
    expect(mediaUrl('/uploads/products/a.jpg')).toBe('https://api.test/uploads/products/a.jpg')
  })

  it('ajoute la barre manquante', () => {
    expect(mediaUrl('uploads/a.jpg')).toBe('https://api.test/uploads/a.jpg')
  })

  it('laisse passer les URL absolues, base64 et blob', () => {
    expect(mediaUrl('https://cdn.discordapp.com/a.png')).toBe('https://cdn.discordapp.com/a.png')
    expect(mediaUrl('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA')
    expect(mediaUrl('blob:https://site/123')).toBe('blob:https://site/123')
  })

  it('rend une chaîne vide sans chemin', () => {
    expect(mediaUrl(undefined)).toBe('')
    expect(mediaUrl('')).toBe('')
  })
})
