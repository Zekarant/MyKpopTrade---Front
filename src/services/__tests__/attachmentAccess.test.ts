import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

/** Les URL des pièces jointes portent un jeton de lecture dédié, pas le jeton d'accès. */

const http = vi.hoisted(() => ({ post: vi.fn(), getAccessToken: vi.fn(() => 'jeton-acces') }))

vi.mock('@/services/http', () => ({
  createApiClient: () => ({ post: http.post }),
  getAccessToken: http.getAccessToken
}))

async function freshModule() {
  vi.resetModules()
  return import('../attachmentAccess')
}

describe('attachmentAccess', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    http.post.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('demande le jeton de lecture puis l\'ajoute aux URL', async () => {
    http.post.mockResolvedValue({ data: { token: 'jeton-lecture', expiresIn: 3600 } })
    const { attachmentTokenParam } = await freshModule()

    expect(attachmentTokenParam()).toBe('')
    await flushPromises()

    expect(http.post).toHaveBeenCalledWith('/api/messaging/attachment-token')
    expect(attachmentTokenParam()).toBe('?token=jeton-lecture')
  })

  it('ne lance qu\'une demande pour plusieurs images affichées en même temps', async () => {
    http.post.mockResolvedValue({ data: { token: 'jeton-lecture', expiresIn: 3600 } })
    const { attachmentTokenParam } = await freshModule()

    attachmentTokenParam()
    attachmentTokenParam()
    attachmentTokenParam()
    await flushPromises()

    expect(http.post).toHaveBeenCalledTimes(1)
  })

  it('renouvelle le jeton avant son expiration', async () => {
    http.post
      .mockResolvedValueOnce({ data: { token: 'premier', expiresIn: 3600 } })
      .mockResolvedValueOnce({ data: { token: 'second', expiresIn: 3600 } })
    const { ensureAttachmentToken, attachmentTokenParam } = await freshModule()
    await ensureAttachmentToken()

    await vi.advanceTimersByTimeAsync(55 * 60 * 1000)
    await flushPromises()

    expect(attachmentTokenParam()).toBe('?token=second')
  })

  it('ne met jamais le jeton d\'accès dans l\'URL si la demande échoue', async () => {
    http.post.mockRejectedValue({ response: { status: 500 } })
    const { attachmentTokenParam } = await freshModule()

    attachmentTokenParam()
    await flushPromises()

    expect(attachmentTokenParam()).toBe('')
  })

  it('retombe sur le jeton d\'accès face à une API qui ignore le jeton de lecture', async () => {
    http.post.mockRejectedValue({ response: { status: 404 } })
    const { ensureAttachmentToken, attachmentTokenParam } = await freshModule()

    await ensureAttachmentToken()

    expect(attachmentTokenParam()).toBe('?token=jeton-acces')
  })
})
