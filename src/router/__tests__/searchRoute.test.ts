import { describe, it, expect, vi } from 'vitest'

/** Page de recherche en query params, et redirection des anciens liens `/search-…`. */

vi.mock('@/services/session.cookies', () => ({ hasSession: () => false, currentUserId: () => null }))
vi.mock('@/services/user.service', () => ({ default: {} }))
// La vue n'est pas montée : seule l'URL d'arrivée compte.
vi.mock('@/views/adherents/searchList.vue', () => ({ default: {} }))

import router from '../index'
import { parseLegacySearchSlug, searchPageProps, searchRoute } from '../searchRoute'

describe('parseLegacySearchSlug', () => {
  it.each([
    ['', { q: '', event: '' }],
    ['golden', { q: 'golden', event: '' }],
    ['morePage', { q: '', event: 'morePage' }],
    ['golden-search', { q: 'golden', event: 'search' }],
    // Ancien découpage conservé : seules la première et la dernière partie comptaient.
    ['stray-kids-search', { q: 'stray', event: 'search' }],
  ])('« %s »', (combined, expected) => {
    expect(parseLegacySearchSlug(combined)).toEqual(expected)
  })
})

describe('searchRoute', () => {
  it('n\'ajoute à l\'URL ni texte ni événement vides', () => {
    expect(searchRoute({ q: '' })).toEqual({ name: 'searchList', query: {} })
    expect(searchRoute({ q: 'golden', event: 'morePage' })).toEqual({ name: 'searchList', query: { q: 'golden', event: 'morePage' } })
  })

  it('lit le texte et l\'événement dans la query', () => {
    expect(searchPageProps({ query: { q: 'golden', event: 'search' } })).toEqual({ query: 'golden', event: 'search' })
    expect(searchPageProps({ query: {} })).toEqual({ query: '', event: '' })
  })
})

describe('router — page de recherche', () => {
  it('sert la recherche sur /search avec ses query params', async () => {
    await router.push('/search?q=golden&group=BTS')

    expect(router.currentRoute.value.name).toBe('searchList')
    expect(router.currentRoute.value.query).toEqual({ q: 'golden', group: 'BTS' })
  })

  it('redirige un ancien lien /search-<texte>-<événement> vers la nouvelle forme', async () => {
    await router.push('/search-golden-search')

    expect(router.currentRoute.value.path).toBe('/search')
    expect(router.currentRoute.value.query).toEqual({ q: 'golden', event: 'search' })
  })

  it('redirige un ancien lien sans texte en gardant sa query', async () => {
    await router.push('/search-morePage?group=BTS')

    expect(router.currentRoute.value.path).toBe('/search')
    expect(router.currentRoute.value.query).toEqual({ group: 'BTS', event: 'morePage' })
  })

  it('redirige /search- (ancien lien vide) vers /search', async () => {
    await router.push('/search-')

    expect(router.currentRoute.value.fullPath).toBe('/search')
  })
})
