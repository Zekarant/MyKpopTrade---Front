import { describe, it, expect } from 'vitest'
import { canRefund, netCents, refundableCents, refundedCents } from '../paymentRules'
import type { Payment, Refund } from '../types'

/** Montants remboursés et restants, calculés en centimes entiers. */

const SELLER = 'seller1'

const refund = (amount: number, status: Refund['status'] = 'completed'): Refund => ({
  refundId: `r-${amount}-${status}`,
  amount,
  currency: 'EUR',
  status,
  initiatedAt: '2026-10-01T00:00:00Z',
})

const payment = (overrides: Partial<Payment> = {}): Payment => ({
  _id: 'p1',
  amount: 0.3,
  currency: 'EUR',
  status: 'partially_refunded',
  createdAt: '2026-10-01T00:00:00Z',
  product: null,
  buyer: 'buyer1',
  seller: SELLER,
  ...overrides,
})

describe('paymentRules', () => {
  it('additionne les remboursements sans dérive flottante', () => {
    const p = payment({ refunds: [refund(0.1), refund(0.2)] })

    expect(refundedCents(p)).toBe(30)
    expect(refundableCents(p)).toBe(0)
    expect(canRefund(p, SELLER)).toBe(false)
  })

  it('ignore les remboursements en attente ou échoués', () => {
    const p = payment({ amount: 20, refunds: [refund(5), refund(3, 'pending'), refund(2, 'failed')] })

    expect(refundedCents(p)).toBe(500)
    expect(refundableCents(p)).toBe(1500)
  })

  it('retient le total le plus prudent entre l\'historique et totalRefunded', () => {
    const p = payment({ amount: 20, totalRefunded: 8, refunds: [refund(5)] })

    expect(refundedCents(p)).toBe(800)
    expect(netCents(p)).toBe(1200)
  })

  it('ne rend jamais un restant remboursable négatif', () => {
    expect(refundableCents(payment({ amount: 10, totalRefunded: 12 }))).toBe(0)
  })
})
