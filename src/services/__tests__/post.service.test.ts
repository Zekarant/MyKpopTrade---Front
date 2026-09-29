import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Session perdue pendant un appel : verifSession déconnecte et renvoie vers
 * /login, mais ne remplace pas l'erreur d'origine et ne sort jamais en
 * promesse rejetée non gérée.
 */

const client = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
const auth = vi.hoisted(() => ({ verifSession: vi.fn() }))

vi.mock('@/services/http', () => ({ createApiClient: () => client }))
vi.mock('@/services/authentification.service', () => ({ default: auth }))

import postService from '../post.service'

const unauthorized = { response: { status: 401, data: { message: 'Token invalide' } } }

describe('post.service — session perdue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    auth.verifSession.mockRejectedValue(new Error('No session token'))
  })

  it('met fin à la session et relaie l\'erreur d\'origine, sans nouvelle tentative', async () => {
    client.get.mockRejectedValue(unauthorized)

    await expect(postService.getFavorites()).rejects.toBe(unauthorized)

    expect(auth.verifSession).toHaveBeenCalledTimes(1)
    expect(client.get).toHaveBeenCalledTimes(1)
  })

  it('rend une liste vide pour les recommandations au lieu de rejeter', async () => {
    client.get.mockRejectedValue(unauthorized)

    await expect(postService.getRecommendations()).resolves.toEqual([])
  })

  it('signale l\'échec d\'un favori par `false`', async () => {
    client.post.mockRejectedValue(unauthorized)

    await expect(postService.addFavorite('p1')).resolves.toBe(false)
  })

  it('ne touche pas à la session pour une autre erreur', async () => {
    client.get.mockRejectedValue({ response: { status: 500 } })

    await expect(postService.getFavorites()).rejects.toBeTruthy()

    expect(auth.verifSession).not.toHaveBeenCalled()
  })

  it('ne plante pas quand l\'envoi d\'une annonce échoue sans réponse (réseau coupé)', async () => {
    client.post.mockRejectedValue(new Error('Network Error'))

    const result = await postService.createPost({
      title: 't', description: 'd', price: 1, currency: 'EUR', condition: 'new', category: 'c', type: 'photocard',
      kpopGroup: 'g', kpopMember: 'm', albumName: 'a', allowOffers: false, images: [], shippingOptions: {}
    } as never)

    expect(result).toBeUndefined()
  })
})
