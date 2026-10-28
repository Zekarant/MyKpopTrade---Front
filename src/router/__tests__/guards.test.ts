import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

/** Gardes du routeur : pages protégées, administration et URL inconnues. */

const session = vi.hoisted(() => ({ hasSession: vi.fn(() => false), currentUserId: vi.fn(() => 'u1') }))
const users = vi.hoisted(() => ({ getMyInformation: vi.fn() }))

vi.mock('@/services/session.cookies', () => session)
vi.mock('@/services/user.service', () => ({ default: users }))
// Les vues ne sont pas montées : on ne vérifie que la route d'arrivée.
vi.mock('@p_v/dashboard.vue', () => ({ default: {} }))
vi.mock('@/views/cart/CartView.vue', () => ({ default: {} }))
vi.mock('@/views/admin/admin.vue', () => ({ default: {} }))
vi.mock('@/views/NotFound.vue', () => ({ default: {} }))
vi.mock('@p_v/payments.vue', () => ({ default: {} }))

import router from '../index'

describe('router — gardes', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Le profil est mis en cache par session : une Pinia neuve par test.
    setActivePinia(createPinia())
    session.hasSession.mockReturnValue(false)
    await router.push('/login')
  })

  it('renvoie un visiteur anonyme vers la connexion, en gardant la page demandée', async () => {
    await router.push('/cart')

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/cart')
  })

  it('laisse passer un utilisateur connecté sur une page protégée', async () => {
    session.hasSession.mockReturnValue(true)

    await router.push('/cart')

    expect(router.currentRoute.value.name).toBe('cart')
  })

  it('refuse l\'administration à un utilisateur qui n\'est pas admin', async () => {
    session.hasSession.mockReturnValue(true)
    users.getMyInformation.mockResolvedValue({ profile: { role: 'user' } })

    await router.push('/adherents/admin')

    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('ouvre l\'administration à un admin', async () => {
    session.hasSession.mockReturnValue(true)
    users.getMyInformation.mockResolvedValue({ profile: { role: 'admin' } })

    await router.push('/adherents/admin')

    expect(router.currentRoute.value.name).toBe('admin')
  })

  it('ne recharge pas le profil à chaque passage par l\'administration', async () => {
    session.hasSession.mockReturnValue(true)
    users.getMyInformation.mockResolvedValue({ profile: { role: 'admin' } })

    await router.push('/adherents/admin')
    await router.push('/cart')
    await router.push('/adherents/admin')

    expect(users.getMyInformation).toHaveBeenCalledTimes(1)
  })

  it('affiche la page 404 pour une URL inconnue', async () => {
    await router.push('/nimporte/quoi')

    expect(router.currentRoute.value.name).toBe('not_found')
  })

  it('redirige les liens de vente des notifications vers les paiements', async () => {
    session.hasSession.mockReturnValue(true)

    await router.push('/account/sales/p42')

    expect(router.currentRoute.value.path).toBe('/adherents/payments')
    expect(router.currentRoute.value.query).toEqual({ role: 'seller', payment: 'p42' })
  })
})
