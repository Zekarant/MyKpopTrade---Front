import { describe, it, expect } from 'vitest'
import type { LocationQuery } from 'vue-router'
import {
  criteriaFromPayload,
  criteriaFromRouteQuery,
  defaultSavedSearchName,
  describeCriteria,
  searchRouteForCriteria
} from '../savedSearch'

describe('criteriaFromPayload', () => {
  it('garde les critères de la recherche, sans pagination ni tri', () => {
    const criteria = criteriaFromPayload({
      page: 1, limit: 10, sortBy: 'relevance', query: ' golden ', groups: ['BTS'], priceRange: { min: 0, max: 100 }
    })

    expect(criteria).toEqual({ query: 'golden', groups: ['BTS'], priceRange: { min: 0, max: 100 } })
  })

  it('garde les critères du catalogue', () => {
    expect(criteriaFromPayload({ group: 'g1', member: 'Felix', album: 'a1', isOfficial: true }))
      .toEqual({ group: 'g1', member: 'Felix', album: 'a1', isOfficial: true })
  })
})

describe('describeCriteria', () => {
  it('affiche le nom d\'un groupe du catalogue quand il est connu, un libellé générique sinon', () => {
    expect(describeCriteria({ group: 'g1', album: 'a1' }, { g1: 'Stray Kids' }))
      .toEqual(['Groupe : Stray Kids', 'Album : album du catalogue'])
  })
})

describe('defaultSavedSearchName', () => {
  it('résume ce que l\'on cherche', () => {
    expect(defaultSavedSearchName({ query: 'golden', groups: ['BTS'], type: 'photocard' }))
      .toBe('« golden » · BTS · Photocards')
  })

  it('reste dans la limite de longueur de l\'API', () => {
    expect(defaultSavedSearchName({ query: 'x'.repeat(100) })).toHaveLength(60)
  })
})

describe('aller-retour vers la page de recherche', () => {
  it('rejoue dans les filtres de la page les critères passés par l\'URL', () => {
    const route = searchRouteForCriteria({
      query: 'stray-kids', groups: ['Stray Kids'], members: ['Felix'], type: 'album', condition: ['new'], priceRange: { min: 5, max: 40 }
    }) as { query: LocationQuery }

    expect(criteriaFromRouteQuery(route.query)).toEqual({
      query: 'stray-kids',
      filters: {
        min: 5, max: 40, conditions: ['new'], type: 'album', group: 'Stray Kids', groupId: null,
        member: 'Felix', albumId: null, version: null, isOfficial: false
      }
    })
  })

  it('rejoue les critères du catalogue par identifiant', () => {
    const route = searchRouteForCriteria({
      group: 'g1', member: 'Felix', album: 'a1', version: 'Weverse', isOfficial: true
    }) as { query: LocationQuery }

    expect(criteriaFromRouteQuery(route.query)?.filters).toMatchObject({
      group: null, groupId: 'g1', member: 'Felix', albumId: 'a1', version: 'Weverse', isOfficial: true
    })
  })

  it('ne touche à rien quand l\'URL ne porte aucun critère', () => {
    expect(criteriaFromRouteQuery({ utm_source: 'mail' })).toBeNull()
  })
})
