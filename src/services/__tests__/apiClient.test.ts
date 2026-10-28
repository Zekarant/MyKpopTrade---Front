import { describe, it, expect, vi, beforeEach } from 'vitest'

/** Fabrique partagée des services : base de l'API, erreurs normalisées, aucun Content-Type imposé. */

const http = vi.hoisted(() => ({ createApiClient: vi.fn(() => ({})) }))
vi.mock('@/services/http', () => http)
vi.mock('@/config/api', () => ({ API_URL: 'https://api.test' }))

import { apiClient } from '../apiClient'

describe('apiClient', () => {
  beforeEach(() => {
    http.createApiClient.mockClear()
  })

  it('préfixe le chemin par l\'URL de l\'API et normalise les erreurs', () => {
    apiClient('/api/cart')

    expect(http.createApiClient).toHaveBeenCalledWith(
      { baseURL: 'https://api.test/api/cart' },
      { normalizeErrors: true }
    )
  })

  it('transmet les options propres au service sans en-tête JSON imposé', () => {
    apiClient('/api/auth', { withCredentials: true })

    const [config] = http.createApiClient.mock.calls[0] as unknown as [Record<string, unknown>]
    expect(config).toEqual({ withCredentials: true, baseURL: 'https://api.test/api/auth' })
    expect(config).not.toHaveProperty('headers')
  })

  it('vise la racine de l\'API sans chemin', () => {
    apiClient()

    expect(http.createApiClient).toHaveBeenCalledWith({ baseURL: 'https://api.test' }, { normalizeErrors: true })
  })
})
