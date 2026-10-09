import { describe, it, expect, vi } from 'vitest'

/** Barre de navigation unique : quelles pages l'affichent, et selon la session. */

vi.mock('@/services/session.cookies', () => ({ hasSession: () => false, currentUserId: () => null }))
vi.mock('@/services/user.service', () => ({ default: {} }))

import router from '../index'
import { navbarModeFor, shouldShowNavbar } from '../navbar'

const modeOf = (path: string) => navbarModeFor(router.resolve(path))

describe('shouldShowNavbar', () => {
  it('« always » : affichée avec ou sans session', () => {
    expect(shouldShowNavbar('always', false)).toBe(true)
    expect(shouldShowNavbar('always', true)).toBe(true)
  })

  it('« auth » : affichée seulement avec une session', () => {
    expect(shouldShowNavbar('auth', true)).toBe(true)
    expect(shouldShowNavbar('auth', false)).toBe(false)
  })

  it('masquée sinon', () => {
    expect(shouldShowNavbar(false, true)).toBe(false)
  })
})

describe('navbarModeFor', () => {
  it.each([
    '/adherents/dashboard', '/adherents/messages', '/adherents/messages/c1', '/cart',
    '/adherents/settings', '/adherents/profile/me', '/products/p1', '/contact', '/search-',
    '/adherents/admin'
  ])('%s : toujours', (path) => {
    expect(modeOf(path)).toBe('always')
  })

  it.each(['/cgu', '/privacy', '/legal', '/cookies', '/faq', '/beta'])('%s : si connecté', (path) => {
    expect(modeOf(path)).toBe('auth')
  })

  it.each([
    '/', '/login', '/register', '/forgot_psw', '/auth/callback', '/profile-completion',
    '/payment/success', '/negotiate/p1', '/nimporte/quoi'
  ])('%s : jamais', (path) => {
    expect(modeOf(path)).toBe(false)
  })

  it('une route peut imposer son mode par meta.navbar', () => {
    expect(navbarModeFor({ name: 'login', meta: { navbar: 'always' } })).toBe('always')
  })
})
