import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PENDING_PAYPAL_PAYMENTS_KEY,
  cancelPendingPayments,
  pendingApprovalUrl,
  readPendingPayments,
  savePendingPayments,
  takeNextPendingPayment,
  takePendingOrderIds
} from '../pendingPayments'

const payment = (n: number) => ({ approvalUrl: `https://paypal.test/approve/${n}`, paypalOrderId: `ORDER-${n}` })

describe('pendingPayments', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('mémorise le paypalOrderId de chaque paiement restant, sous la clé historique', () => {
    savePendingPayments([payment(2), payment(3)])

    expect(JSON.parse(localStorage.getItem(PENDING_PAYPAL_PAYMENTS_KEY)!)).toEqual([
      { approvalUrl: 'https://paypal.test/approve/2', orderId: 'ORDER-2' },
      { approvalUrl: 'https://paypal.test/approve/3', orderId: 'ORDER-3' }
    ])
  })

  it('efface les restes d\'un checkout abandonné quand il ne reste rien à approuver', () => {
    savePendingPayments([payment(9)])

    savePendingPayments([])

    expect(localStorage.getItem(PENDING_PAYPAL_PAYMENTS_KEY)).toBeNull()
  })

  it('renvoie les ordres à annuler puis vide la liste (page d\'annulation)', () => {
    savePendingPayments([payment(2), payment(3)])

    expect(takePendingOrderIds()).toEqual(['ORDER-2', 'ORDER-3'])
    expect(localStorage.getItem(PENDING_PAYPAL_PAYMENTS_KEY)).toBeNull()
  })

  it('ignore l\'ancien format (URL seule) et les entrées illisibles', () => {
    localStorage.setItem(
      PENDING_PAYPAL_PAYMENTS_KEY,
      JSON.stringify(['https://paypal.test/legacy', { approvalUrl: 'https://paypal.test/2', orderId: 'ORDER-2' }, 42, null])
    )

    expect(readPendingPayments()).toHaveLength(2)
    expect(takePendingOrderIds()).toEqual(['ORDER-2'])
  })

  it('résiste à un JSON corrompu', () => {
    localStorage.setItem(PENDING_PAYPAL_PAYMENTS_KEY, '{oops')

    expect(takePendingOrderIds()).toEqual([])
    expect(takeNextPendingPayment()).toBeUndefined()
    expect(localStorage.getItem(PENDING_PAYPAL_PAYMENTS_KEY)).toBeNull()
  })

  it('enchaîne les approbations une par une (page de succès)', () => {
    savePendingPayments([payment(2), payment(3)])

    const first = takeNextPendingPayment()
    expect(first && pendingApprovalUrl(first)).toBe('https://paypal.test/approve/2')
    expect(takePendingOrderIds()).toEqual(['ORDER-3'])
    expect(takeNextPendingPayment()).toBeUndefined()
  })

  it('accepte encore une URL seule écrite par une ancienne version', () => {
    localStorage.setItem(PENDING_PAYPAL_PAYMENTS_KEY, JSON.stringify(['https://paypal.test/legacy']))

    const next = takeNextPendingPayment()

    expect(next && pendingApprovalUrl(next)).toBe('https://paypal.test/legacy')
    expect(localStorage.getItem(PENDING_PAYPAL_PAYMENTS_KEY)).toBeNull()
  })

  it('annule tous les ordres restants, même quand une annulation échoue (paiement échoué)', async () => {
    savePendingPayments([payment(2), payment(3)])
    const cancelOrder = vi.fn().mockRejectedValueOnce(new Error('déjà annulé')).mockResolvedValue(undefined)

    await cancelPendingPayments(cancelOrder)

    expect(cancelOrder.mock.calls).toEqual([['ORDER-2'], ['ORDER-3']])
    expect(localStorage.getItem(PENDING_PAYPAL_PAYMENTS_KEY)).toBeNull()
  })
})
