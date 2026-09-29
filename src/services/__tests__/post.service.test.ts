import { describe, it, expect, beforeEach, vi } from 'vitest'

/** Session perdue : verifSession ne masque pas l'erreur d'origine et ne rejette jamais la promesse. */

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

    expect(result).toEqual({ ok: false, error: undefined })
  })
})

describe('post.service — enregistrement d\'une annonce', () => {
  const baseData = {
    title: 't', description: 'd', price: 10, currency: 'EUR', condition: 'new', category: 'c', type: 'photocard',
    kpopGroup: 'g', kpopMember: 'm', albumName: 'a', allowOffers: true,
    shippingOptions: { worldwide: false, nationalOnly: true, localPickup: false, shippingCost: null },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renvoie l\'identifiant de l\'annonce créée et n\'envoie pas de frais de port vides', async () => {
    client.post.mockResolvedValue({ status: 201, data: { product: { _id: 'p1' } } })
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })

    const result = await postService.createPost({ ...baseData, images: [file] })

    expect(result).toEqual({ ok: true, productId: 'p1' })
    const form = client.post.mock.calls[0][1] as FormData
    expect(form.getAll('productImages')).toHaveLength(1)
    expect(JSON.parse(form.get('shippingOptions') as string)).toEqual({ worldwide: false, nationalOnly: true, localPickup: false })
  })

  it('met à jour les champs en JSON, sans les photos, avec le type et l\'acceptation des offres', async () => {
    client.put.mockResolvedValue({ status: 200, data: {} })

    const result = await postService.updatePost('p1', { ...baseData, images: ['/uploads/products/a.jpg'] })

    expect(result).toEqual({ ok: true, productId: 'p1' })
    const [url, body] = client.put.mock.calls[0]
    expect(url).toBe('/products/p1')
    expect(body).toMatchObject({ type: 'photocard', allowOffers: true })
    expect(body).not.toHaveProperty('images')
    expect(body).not.toHaveProperty('productImages')
  })

  it('relaie le message d\'erreur de l\'API', async () => {
    client.put.mockRejectedValue({ response: { status: 400, data: { message: 'Prix invalide' } } })

    const result = await postService.updatePost('p1', { ...baseData, images: [] })

    expect(result).toEqual({ ok: false, error: { message: 'Prix invalide' } })
  })
})

describe('post.service — photos d\'une annonce', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('désigne l\'image à supprimer par sa position, comme l\'attend l\'API', async () => {
    client.delete.mockResolvedValue({ data: { message: 'ok', images: [] } })

    await postService.deleteProductImage('p1', 2)

    expect(client.delete).toHaveBeenCalledWith('/products/p1/images', { data: { imageIndex: 2 } })
  })

  it('envoie le nouvel ordre sous forme de positions (imageOrder)', async () => {
    client.put.mockResolvedValue({ data: { message: 'ok', images: [] } })

    await postService.reorderProductImages('p1', [1, 0])

    expect(client.put).toHaveBeenCalledWith('/products/p1/images/reorder', { imageOrder: [1, 0] })
  })

  /** Simule les routes d'images du back sur un tableau en mémoire. */
  function fakeImageApi(initial: string[]) {
    let images = [...initial]
    let uploads = 0
    client.get.mockImplementation(async () => ({ data: { product: { images: [...images] }, isFavorite: false } }))
    client.delete.mockImplementation(async (_url: string, { data }: { data: { imageIndex: number } }) => {
      if (images.length <= 1) throw new Error('dernière image')
      images.splice(data.imageIndex, 1)
      return { data: { message: 'ok', images: [...images] } }
    })
    client.post.mockImplementation(async () => {
      if (images.length >= 10) throw new Error('limite atteinte')
      uploads += 1
      const path = `/uploads/products/new-${uploads}.jpg`
      images.push(path)
      return { data: { message: 'ok', image: path, images: [...images] } }
    })
    client.put.mockImplementation(async (_url: string, { imageOrder }: { imageOrder: number[] }) => {
      images = imageOrder.map((index) => images[index])
      return { data: { message: 'ok', images: [...images] } }
    })
    return { current: () => images }
  }

  it('garde les images conservées, ajoute les nouvelles et respecte l\'ordre voulu', async () => {
    const api = fakeImageApi(['/a.jpg', '/b.jpg', '/c.jpg'])
    const file = new File(['x'], 'new.jpg', { type: 'image/jpeg' })
    const uploaded = vi.fn()

    const result = await postService.syncProductImages('p1', [file, '/c.jpg', '/a.jpg'], uploaded)

    expect(result).toEqual(['/uploads/products/new-1.jpg', '/c.jpg', '/a.jpg'])
    expect(api.current()).toEqual(result)
    expect(uploaded).toHaveBeenCalledWith(file, '/uploads/products/new-1.jpg')
  })

  it('remplace toutes les photos sans jamais retirer la dernière avant l\'ajout', async () => {
    const api = fakeImageApi(['/a.jpg', '/b.jpg'])
    const file = new File(['x'], 'new.jpg', { type: 'image/jpeg' })

    const result = await postService.syncProductImages('p1', [file])

    expect(result).toEqual(['/uploads/products/new-1.jpg'])
    expect(api.current()).toEqual(result)
  })

  it('libère de la place avant d\'ajouter quand l\'annonce a déjà 10 photos', async () => {
    const initial = Array.from({ length: 10 }, (_, index) => `/img-${index}.jpg`)
    const api = fakeImageApi(initial)
    const file = new File(['x'], 'new.jpg', { type: 'image/jpeg' })

    const result = await postService.syncProductImages('p1', [...initial.slice(1), file])

    expect(result).toEqual([...initial.slice(1), '/uploads/products/new-1.jpg'])
    expect(api.current()).toHaveLength(10)
  })

  it('ne touche à rien quand les photos sont inchangées', async () => {
    fakeImageApi(['/a.jpg', '/b.jpg'])

    await postService.syncProductImages('p1', ['/a.jpg', '/b.jpg'])

    expect(client.delete).not.toHaveBeenCalled()
    expect(client.post).not.toHaveBeenCalled()
    expect(client.put).not.toHaveBeenCalled()
  })
})
