import { describe, expect, it } from 'vitest'
import { isPayPalUrl } from '../paypalUrl'

describe('isPayPalUrl', () => {
  it.each([
    'https://paypal.com/checkoutnow?token=ABC',
    'https://www.paypal.com/checkoutnow?token=ABC',
    'https://sandbox.paypal.com/checkoutnow?token=ABC',
    'https://www.sandbox.paypal.com/checkoutnow?token=ABC',
    'https://WWW.PayPal.com/checkoutnow'
  ])('accepte une URL PayPal en https : %s', (url) => {
    expect(isPayPalUrl(url)).toBe(true)
  })

  it.each([
    'https://paypal.com.evil.com/checkoutnow',
    'https://evilpaypal.com/checkoutnow',
    'https://paypal.co/checkoutnow',
    'https://evil.com/?next=https://www.paypal.com',
    'https://www.paypal.com@evil.com/',
    'https://user:pass@www.paypal.com/',
    'https://www.paypal.com:8443/checkoutnow'
  ])('refuse un domaine ou une forme trompeuse : %s', (url) => {
    expect(isPayPalUrl(url)).toBe(false)
  })

  it.each([
    'http://www.paypal.com/checkoutnow',
    'javascript:alert(1)',
    '//www.paypal.com/checkoutnow',
    '/payment/success',
    'pas une url',
    ''
  ])('refuse un protocole non https ou une URL illisible : %s', (url) => {
    expect(isPayPalUrl(url)).toBe(false)
  })
})
