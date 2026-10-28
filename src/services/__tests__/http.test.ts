import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'

import { createApiClient } from '../http'
import { ApiError } from '../apiError'
import { onSessionEnded } from '../sessionEvents'

// Les services n'importent plus le routeur : la fin de session est annoncée.
const sessionEnded = vi.fn()
onSessionEnded(sessionEnded)

/** Renouvellement de session : rejeu unique après 401, un seul appel pour des requêtes concurrentes. */

type Handler = (config: InternalAxiosRequestConfig) => { status: number; data?: unknown }

/** Adaptateur axios de test : rend la réponse décidée par `handler`, sans réseau. */
function fakeAdapter(handler: Handler, seen: InternalAxiosRequestConfig[]): AxiosAdapter {
  return async (config) => {
    seen.push(config)
    const { status, data } = handler(config)
    const response = { data, status, statusText: String(status), headers: {}, config }
    if (status >= 400) {
      throw new AxiosError(`HTTP ${status}`, String(status), config, null, response)
    }
    return response
  }
}

const authHeader = (config: InternalAxiosRequestConfig) => String(config.headers?.Authorization ?? '')

describe('http — client partagé et renouvellement de session', () => {
  let seen: InternalAxiosRequestConfig[]

  beforeEach(() => {
    seen = []
    sessionEnded.mockClear()
    Cookies.remove('sessionToken')
    Cookies.remove('id_user')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('attache le jeton d\'accès du cookie à la requête', async () => {
    Cookies.set('sessionToken', 'access-1')
    const client = createApiClient({ adapter: fakeAdapter(() => ({ status: 200 }), seen) })

    await client.get('/products')

    expect(authHeader(seen[0])).toBe('Bearer access-1')
  })

  it('renouvelle le jeton avant la requête quand seule la session reste', async () => {
    Cookies.set('id_user', 'u1')
    const refresh = vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'access-2' } })
    const client = createApiClient({ adapter: fakeAdapter(() => ({ status: 200 }), seen) })

    await client.get('/products')

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(authHeader(seen[0])).toBe('Bearer access-2')
    expect(Cookies.get('sessionToken')).toBe('access-2')
  })

  it('laisse le navigateur envoyer le refresh token HttpOnly, sans jamais le lire', async () => {
    Cookies.set('id_user', 'u1')
    const refresh = vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'access-2' } })
    const client = createApiClient({ adapter: fakeAdapter(() => ({ status: 200 }), seen) })

    await client.get('/products')

    expect(refresh).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/refresh-token'),
      null,
      expect.objectContaining({ withCredentials: true })
    )
  })

  it('rejoue une seule fois la requête après un 401, avec le jeton renouvelé', async () => {
    Cookies.set('sessionToken', 'expired')
    Cookies.set('id_user', 'u1')
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'fresh' } })
    const client = createApiClient({
      adapter: fakeAdapter((config) => ({ status: authHeader(config) === 'Bearer fresh' ? 200 : 401 }), seen)
    })

    const response = await client.get('/me')

    expect(response.status).toBe(200)
    expect(seen).toHaveLength(2)
    expect(authHeader(seen[1])).toBe('Bearer fresh')
  })

  it('ne lance qu\'un renouvellement pour plusieurs requêtes simultanées', async () => {
    Cookies.set('id_user', 'u1')
    let resolveRefresh: (value: unknown) => void = () => undefined
    const refresh = vi.spyOn(axios, 'post').mockReturnValue(
      new Promise((resolve) => { resolveRefresh = resolve }) as never
    )
    const client = createApiClient({ adapter: fakeAdapter(() => ({ status: 200 }), seen) })

    const requests = [client.get('/a'), client.get('/b'), client.get('/c')]
    resolveRefresh({ data: { accessToken: 'shared' } })
    await Promise.all(requests)

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(seen.map(authHeader)).toEqual(['Bearer shared', 'Bearer shared', 'Bearer shared'])
  })

  it('nettoie la session et annonce sa fin si le renouvellement échoue', async () => {
    Cookies.set('sessionToken', 'expired')
    Cookies.set('id_user', 'u1')
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('401'))
    const client = createApiClient({ adapter: fakeAdapter(() => ({ status: 401 }), seen) })

    await expect(client.get('/me')).rejects.toBeInstanceOf(AxiosError)

    expect(Cookies.get('sessionToken')).toBeUndefined()
    expect(Cookies.get('id_user')).toBeUndefined()
    expect(sessionEnded).toHaveBeenCalledWith('expired')
  })

  it('ne renouvelle pas la session sur un refus métier (mot de passe actuel erroné)', async () => {
    Cookies.set('sessionToken', 'access-1')
    Cookies.set('id_user', 'u1')
    const refresh = vi.spyOn(axios, 'post')
    const client = createApiClient({
      adapter: fakeAdapter(() => ({ status: 401, data: { code: 'CURRENT_PASSWORD_INVALID' } }), seen)
    })

    await expect(client.put('/api/auth/profile', {})).rejects.toBeInstanceOf(AxiosError)

    expect(refresh).not.toHaveBeenCalled()
    expect(seen).toHaveLength(1)
    expect(Cookies.get('id_user')).toBe('u1')
  })

  it('ne redirige pas un visiteur anonyme qui reçoit un 401', async () => {
    const refresh = vi.spyOn(axios, 'post')
    const client = createApiClient({ adapter: fakeAdapter(() => ({ status: 401 }), seen) })

    await expect(client.get('/favorites')).rejects.toBeInstanceOf(AxiosError)

    expect(refresh).not.toHaveBeenCalled()
    expect(sessionEnded).not.toHaveBeenCalled()
  })

  it('rejette une ApiError à plat quand les erreurs sont normalisées', async () => {
    Cookies.set('sessionToken', 'access-1')
    const client = createApiClient(
      { adapter: fakeAdapter(() => ({ status: 403, data: { message: 'Compte bloqué', code: 'BLOCKED', userId: 'u2', requestId: 'r-1' } }), seen) },
      { normalizeErrors: true }
    )

    const error = await client.get('/messages').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 403, code: 'BLOCKED', message: 'Compte bloqué', requestId: 'r-1', details: { userId: 'u2' } })
  })

  it('normalise après le rejeu : un 401 renouvelable n\'arrive jamais à l\'appelant', async () => {
    Cookies.set('sessionToken', 'expired')
    Cookies.set('id_user', 'u1')
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'fresh' } })
    const client = createApiClient(
      { adapter: fakeAdapter((config) => ({ status: authHeader(config) === 'Bearer fresh' ? 200 : 401 }), seen) },
      { normalizeErrors: true }
    )

    await expect(client.get('/me')).resolves.toMatchObject({ status: 200 })
    expect(seen).toHaveLength(2)
  })

  it('ne tente aucun renouvellement sur un 401 de /login (mauvais mot de passe)', async () => {
    Cookies.set('id_user', 'u1')
    Cookies.set('sessionToken', 'access-1')
    const refresh = vi.spyOn(axios, 'post')
    const client = createApiClient({ adapter: fakeAdapter(() => ({ status: 401 }), seen) })

    await expect(client.post('/api/auth/login', {})).rejects.toBeInstanceOf(AxiosError)

    expect(refresh).not.toHaveBeenCalled()
    expect(seen).toHaveLength(1)
  })
})
