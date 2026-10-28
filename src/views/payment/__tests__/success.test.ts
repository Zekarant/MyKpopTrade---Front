import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { PENDING_PAYPAL_PAYMENTS_KEY } from '../pendingPayments'

/** Retour PayPal : n'enchaîne le paiement suivant du panier que vers un vrai domaine PayPal. */

const route = vi.hoisted(() => ({ query: {} as Record<string, string> }))
const paymentService = vi.hoisted(() => ({ capturePayPal: vi.fn(), cancelPayPal: vi.fn() }))
const cartService = vi.hoisted(() => ({ finalizeCheckout: vi.fn() }))

vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/payment.service', () => ({ default: paymentService }))
vi.mock('@/services/cart.service', () => ({ default: cartService }))
vi.mock('@/services/contact.service', () => ({ sendContactMessage: vi.fn(), contactErrorMessage: vi.fn() }))

import PaymentSuccess from '../success.vue'

function storeNextPayments(...urls: string[]) {
  localStorage.setItem(
    PENDING_PAYPAL_PAYMENTS_KEY,
    JSON.stringify(urls.map((approvalUrl, i) => ({ approvalUrl, orderId: `ORDER-${i + 2}` })))
  )
}

async function mountSuccess() {
  const wrapper = mount(PaymentSuccess, { attachTo: document.body })
  await flushPromises()
  return wrapper
}

describe('success.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // setImmediate reste réel : flushPromises en dépend.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    localStorage.clear()
    document.body.innerHTML = ''
    route.query = { token: 'ORDER-1', PayerID: 'PAYER' }
    paymentService.capturePayPal.mockResolvedValue({})
    paymentService.cancelPayPal.mockResolvedValue({})
    cartService.finalizeCheckout.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('programme la redirection vers le paiement PayPal suivant du panier', async () => {
    storeNextPayments('https://www.sandbox.paypal.com/checkoutnow?token=ORDER-2')

    const wrapper = await mountSuccess()

    expect(vi.getTimerCount()).toBe(1)
    expect(wrapper.text()).toContain('Paiement confirmé !')
    expect(paymentService.cancelPayPal).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('ne redirige pas vers une URL stockée hors PayPal : annule et affiche l\'erreur', async () => {
    storeNextPayments('https://paypal.com.evil.com/checkoutnow', 'https://www.paypal.com/checkoutnow?token=ORDER-3')

    const wrapper = await mountSuccess()

    expect(vi.getTimerCount()).toBe(0)
    expect(wrapper.find('[role="alert"]').text()).toContain('le lien du paiement suivant est invalide')
    expect(wrapper.text()).toContain('ils restent dans votre panier')
    expect(paymentService.cancelPayPal.mock.calls).toEqual([['ORDER-2'], ['ORDER-3']])
    expect(localStorage.getItem(PENDING_PAYPAL_PAYMENTS_KEY)).toBeNull()
    wrapper.unmount()
  })

  it('refuse aussi un lien javascript: ou en http', async () => {
    for (const url of ['javascript:alert(1)', 'http://www.paypal.com/checkoutnow']) {
      storeNextPayments(url)
      const wrapper = await mountSuccess()

      expect(vi.getTimerCount()).toBe(0)
      expect(wrapper.text()).toContain('Erreur de finalisation')
      wrapper.unmount()
    }
  })

  it('ouvre le formulaire de contact depuis un vrai bouton', async () => {
    const wrapper = await mountSuccess()

    await wrapper.find('button.link').trigger('click')

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    await wrapper.find('.modal-overlay').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
