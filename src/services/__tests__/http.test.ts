import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'

const routerPush = vi.fn()
vi.mock('@/router', () => ({ default: { push: routerPush } }))

import { createApiClient } from '../http'

/**
 * Ces tests verrouillent le renouvellement de session partagé par tous les
 * services : jeton attaché, renouvellement anticipé, rejeu unique après 401,
 * un seul appel de renouvellement pour des requêtes concurrentes.
 */

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
    routerPush.mockClear()
    Cookies.remove('sessionToken')
    Cookies.remove('refreshToken')
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

  it('renouvelle le jeton avant la requête quand seul le refresh token reste', async () => {
    Cookies.set('refreshToken', 'refresh-1')
    const refresh = vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'access-2' } })
    const client = createApiClient({ adapter: fakeAdapter(() => ({ status: 200 }), seen) })

    await client.get('/products')

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(authHeader(seen[0])).toBe('Bearer access-2')
    expect(Cookies.get('sessionToken')).toBe('access-2')
    expect(Cookies.get('refreshToken')).toBe('refresh-1')
  })

  it('rejoue une seule fois la requête après un 401, avec le jeton renouvelé', async () => {
    Cookies.set('sessionToken', 'expired')
    Cookies.set('refreshToken', 'refresh-1')
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
    Cookies.set('refreshToken', 'refresh-1')
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

  it('nettoie la session et renvoie vers /login si le renouvellement échoue', async () => {
    Cookies.set('sessionToken', 'expired')
    Cookies.set('refreshToken', 'revoked')
    Cookies.set('id_user', 'u1')
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('401'))
    const client = createApiClient({ adapter: fakeAdapter(() => ({ status: 401 }), seen) })

    await expect(client.get('/me')).rejects.toBeInstanceOf(AxiosError)

    expect(Cookies.get('refreshToken')).toBeUndefined()
    expect(Cookies.get('id_user')).toBeUndefined()
    await vi.waitFor(() => expect(routerPush).toHaveBeenCalledWith('/login'))
  })

  it('ne redirige pas un visiteur anonyme qui reçoit un 401', async () => {
    const refresh = vi.spyOn(axios, 'post')
    const client = createApiClient({ adapter: fakeAdapter(() => ({ status: 401 }), seen) })

    await expect(client.get('/favorites')).rejects.toBeInstanceOf(AxiosError)

    expect(refresh).not.toHaveBeenCalled()
    expect(routerPush).not.toHaveBeenCalled()
  })

  it('ne tente aucun renouvellement sur un 401 de /login (mauvais mot de passe)', async () => {
    Cookies.set('refreshToken', 'refresh-1')
    Cookies.set('sessionToken', 'access-1')
    const refresh = vi.spyOn(axios, 'post')
    const client = createApiClient({ adapter: fakeAdapter(() => ({ status: 401 }), seen) })

    await expect(client.post('/api/auth/login', {})).rejects.toBeInstanceOf(AxiosError)

    expect(refresh).not.toHaveBeenCalled()
    expect(seen).toHaveLength(1)
  })
})
