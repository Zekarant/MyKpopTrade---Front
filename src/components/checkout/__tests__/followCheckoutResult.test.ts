import { describe, it, expect, beforeEach, vi } from 'vitest'

/** Suite d'un achat : jamais de redirection hors PayPal, et pas d'ordre laissé en attente. */

const paymentService = vi.hoisted(() => ({ cancelPayPal: vi.fn() }))
vi.mock('@/services/payment.service', () => ({ default: paymentService }))

import { followCheckoutResult } from '../followCheckoutResult'
import { redirectToPayPal } from '@/views/payment/paypalUrl'

const ERROR = 'Erreur lors de l\'initialisation du paiement. Veuillez réessayer.'

describe('followCheckoutResult', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    paymentService.cancelPayPal.mockResolvedValue({})
  })

  it('annule l\'ordre et signale l\'erreur quand l\'URL ne mène pas à PayPal', () => {
    const showError = vi.fn()

    followCheckoutResult(
      { success: true, payment: { approvalUrl: 'https://paypal.com.evil.com/checkoutnow', paypalOrderId: 'ORDER-1' } },
      showError
    )

    expect(paymentService.cancelPayPal).toHaveBeenCalledWith('ORDER-1')
    expect(showError).toHaveBeenCalledWith(ERROR)
  })

  it('annule l\'ordre quand le paiement n\'a pas abouti', () => {
    const showError = vi.fn()

    followCheckoutResult({ success: false, payment: { paypalOrderId: 'ORDER-1' } }, showError)

    expect(paymentService.cancelPayPal).toHaveBeenCalledWith('ORDER-1')
    expect(showError).toHaveBeenCalledWith(ERROR)
  })

  it('signale l\'erreur sans rien annuler quand aucun ordre n\'a été créé', () => {
    const showError = vi.fn()

    followCheckoutResult(null, showError)

    expect(paymentService.cancelPayPal).not.toHaveBeenCalled()
    expect(showError).toHaveBeenCalledTimes(1)
  })
})

describe('redirectToPayPal', () => {
  it('refuse sans rediriger une URL absente, en http ou d\'un autre domaine', () => {
    const before = window.location.href

    for (const url of [undefined, 'http://www.paypal.com/x', 'https://evil.com/paypal.com', 'javascript:alert(1)']) {
      expect(redirectToPayPal(url)).toBe(false)
    }
    expect(window.location.href).toBe(before)
  })
})
