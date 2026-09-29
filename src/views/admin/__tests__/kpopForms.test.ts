import { describe, it, expect } from 'vitest'
import {
  albumArtistId,
  albumFormFrom,
  buildAlbumPayload,
  buildGroupPayload,
  groupFormFrom
} from '../kpopForms'

/** Correspondance formulaire admin K-pop → contrat back (artistId, albumType, profileImage). */

describe('kpopForms — albums', () => {
  it('envoie artistId et albumType, jamais group ni type', () => {
    const payload = buildAlbumPayload({
      name: '  Get Up ',
      artistId: 'g1',
      albumType: 'ep',
      releaseDate: '2023-07-21',
      coverImage: ' https://example.com/cover.jpg '
    })

    expect(payload).toEqual({
      name: 'Get Up',
      artistId: 'g1',
      albumType: 'ep',
      releaseDate: '2023-07-21',
      coverImage: 'https://example.com/cover.jpg'
    })
  })

  it('omet les champs vides pour conserver les valeurs existantes', () => {
    expect(buildAlbumPayload(albumFormFrom())).toEqual({ name: '' })
  })

  it('préremplit le formulaire depuis un album au groupe peuplé', () => {
    const form = albumFormFrom({
      name: 'Easy',
      artistId: { _id: 'g2', name: 'LE SSERAFIM' },
      albumType: 'single',
      releaseDate: '2024-02-19T00:00:00.000Z',
      coverImage: 'https://example.com/easy.jpg'
    })

    expect(form).toEqual({
      name: 'Easy',
      artistId: 'g2',
      albumType: 'single',
      releaseDate: '2024-02-19',
      coverImage: 'https://example.com/easy.jpg'
    })
  })

  it('lit artistId brut ou peuplé', () => {
    expect(albumArtistId({ artistId: 'g3' })).toBe('g3')
    expect(albumArtistId({ artistId: { _id: 'g4', name: 'IVE' } })).toBe('g4')
    expect(albumArtistId({})).toBe('')
  })
})

describe('kpopForms — groupes', () => {
  it('envoie l\'image sous profileImage', () => {
    const payload = buildGroupPayload({
      name: ' NewJeans ',
      profileImage: 'https://example.com/nj.jpg',
      membersRaw: 'Minji, Hanni,  , Danielle'
    })

    expect(payload).toEqual({
      name: 'NewJeans',
      profileImage: 'https://example.com/nj.jpg',
      members: ['Minji', 'Hanni', 'Danielle']
    })
  })

  it('préremplit l\'image depuis profileImage', () => {
    expect(groupFormFrom({ name: 'IVE', profileImage: 'https://example.com/ive.jpg' })).toEqual({
      name: 'IVE',
      profileImage: 'https://example.com/ive.jpg',
      membersRaw: ''
    })
  })
})
