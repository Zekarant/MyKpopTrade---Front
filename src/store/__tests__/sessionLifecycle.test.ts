import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/** Fin de session annoncée par les services : stores vidés puis retour à la connexion, sans import du routeur. */

const reset = vi.hoisted(() => ({ resetSessionStores: vi.fn() }))
vi.mock('@/store/resetSessionStores', () => reset)

import { bindSessionEnd } from '../sessionLifecycle'
import { notifySessionEnded } from '@/services/sessionEvents'

describe('bindSessionEnd', () => {
  const router = { push: vi.fn(async () => undefined) }
  let unbind: () => void

  beforeEach(() => {
    vi.clearAllMocks()
    unbind = bindSessionEnd(router)
  })

  afterEach(() => {
    unbind()
  })

  it.each(['expired', 'logout'] as const)('vide les stores et renvoie vers /login (%s)', (reason) => {
    notifySessionEnded(reason)

    expect(reset.resetSessionStores).toHaveBeenCalledTimes(1)
    expect(router.push).toHaveBeenCalledWith('/login')
  })

  it('ne réagit plus une fois désabonné', () => {
    unbind()

    notifySessionEnded('expired')

    expect(router.push).not.toHaveBeenCalled()
  })
})
