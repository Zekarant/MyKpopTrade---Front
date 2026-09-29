import { describe, it, expect, beforeEach, vi } from 'vitest'

/** Prix libre : contrat de POST /api/messaging/pwyw et /:id/pwyw-offer. */

const client = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))

vi.mock('@/services/http', () => ({ createApiClient: () => client }))
vi.mock('@/services/authentification.service', () => ({ default: { verifSession: vi.fn() } }))

import messagingService from '../messaging.service'

describe('messaging.service — prix libre', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('active le prix libre avec une fourchette complète', async () => {
    const payWhatYouWant = { productId: 'p1', enabled: true, minimumPrice: 5, maximumPrice: 30 }
    client.post.mockResolvedValue({ data: { message: 'ok', payWhatYouWant } })

    const response = await messagingService.initiatePayWhatYouWant({ productId: 'p1', minimumPrice: 5, maximumPrice: 30 })

    expect(client.post).toHaveBeenCalledWith('/pwyw', { productId: 'p1', minimumPrice: 5, maximumPrice: 30 })
    expect(response.payWhatYouWant).toEqual(payWhatYouWant)
  })

  it('n\'envoie pas de maximum quand il est absent', async () => {
    client.post.mockResolvedValue({ data: { message: 'ok', payWhatYouWant: {} } })

    await messagingService.initiatePayWhatYouWant({ productId: 'p1', minimumPrice: 0, maximumPrice: null })

    expect(client.post).toHaveBeenCalledWith('/pwyw', { productId: 'p1', minimumPrice: 0 })
  })

  it('refuse une fourchette incohérente avant tout appel', async () => {
    await expect(messagingService.initiatePayWhatYouWant({ productId: 'p1', minimumPrice: 10, maximumPrice: 10 }))
      .rejects.toThrow('Prix maximum invalide')
    await expect(messagingService.initiatePayWhatYouWant({ productId: 'p1', minimumPrice: -1 }))
      .rejects.toThrow('Prix minimum invalide')
    expect(client.post).not.toHaveBeenCalled()
  })

  it('désactive le prix libre avec enabled: false', async () => {
    client.post.mockResolvedValue({ data: { message: 'ok', payWhatYouWant: { enabled: false } } })

    await messagingService.disablePayWhatYouWant('p1')

    expect(client.post).toHaveBeenCalledWith('/pwyw', { productId: 'p1', enabled: false })
  })

  it('relaie le message de l\'API quand une proposition est refusée', async () => {
    client.post.mockRejectedValue(Object.assign(new Error('400'), {
      isAxiosError: true,
      response: { status: 400, data: { message: 'Le prix proposé doit être au moins 5 EUR' } }
    }))

    await expect(messagingService.makePayWhatYouWantOffer('c1', { proposedPrice: 2 }))
      .rejects.toMatchObject({ message: 'Le prix proposé doit être au moins 5 EUR', status: 400 })
  })
})
