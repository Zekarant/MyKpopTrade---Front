import { describe, it, expect, beforeEach, vi } from 'vitest'

/** Routes appelées par les services du compte que les tests de vues ne couvrent pas. */

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))

vi.mock('@/services/http', async () => ({
  createApiClient: (await import('@/test-utils/routedApiClient')).routedApiClient(http)
}))

import accountService from '../account.service'
import userService from '../user.service'
import postService from '../post.service'

describe('services du compte — routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    http.get.mockResolvedValue({ data: {} })
    http.post.mockResolvedValue({ data: {} })
    http.put.mockResolvedValue({ data: {} })
    http.delete.mockResolvedValue({ data: {} })
  })

  it('change le mot de passe avec le cookie de session, pour garder celle-ci ouverte', async () => {
    http.put.mockResolvedValueOnce({ data: { message: 'Mot de passe modifié' } })
    const payload = { currentPassword: 'a', newPassword: 'b', confirmPassword: 'b' }

    await expect(accountService.updatePassword(payload)).resolves.toBe('Mot de passe modifié')

    expect(http.put).toHaveBeenCalledWith('/api/auth/update-password', payload, { withCredentials: true })
  })

  it('demande un ticket de liaison au fournisseur choisi', async () => {
    http.post.mockResolvedValueOnce({ data: { ticket: 'ticket-1' } })

    await expect(accountService.requestLinkTicket('discord')).resolves.toBe('ticket-1')

    expect(http.post).toHaveBeenCalledWith('/api/auth/link/discord')
  })

  it('dépose, lit et annule une demande de vérification d\'identité', async () => {
    const document = new File(['x'], 'cni.png', { type: 'image/png' })

    await accountService.submitIdentityVerification('passport', document)
    await accountService.getIdentityVerification()
    await accountService.cancelIdentityVerification()

    const body = http.post.mock.calls[0][1] as FormData
    expect(http.post.mock.calls[0][0]).toBe('/api/verification/identity')
    expect([body.get('documentType'), body.get('consentGiven'), body.get('document')]).toEqual(['passport', 'true', document])
    expect(http.get).toHaveBeenCalledWith('/api/verification/identity/status/')
    expect(http.delete).toHaveBeenCalledWith('/api/verification/identity/cancel')
  })

  it('envoie la bannière sous son champ et rend le chemin enregistré', async () => {
    http.post.mockResolvedValueOnce({ data: { profileBanner: '/uploads/banners/b.png' } })
    const file = new File(['x'], 'b.png', { type: 'image/png' })

    await expect(userService.uploadProfileMedia('banner', file)).resolves.toBe('/uploads/banners/b.png')

    const [url, body] = http.post.mock.calls[0] as [string, FormData]
    expect(url).toBe('/api/profiles/me/banner')
    expect(body.get('profileBanner')).toBe(file)
  })

  it('lit les annonces disponibles d\'un autre membre', async () => {
    await postService.getUserInventory('alice id')

    expect(http.get).toHaveBeenCalledWith('/api/products/inventory/user/alice%20id', {
      params: { status: 'available', limit: 20, page: 1 }
    })
  })
})
