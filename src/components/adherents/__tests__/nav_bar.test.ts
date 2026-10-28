import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

/** Barre de navigation : menus utilisables au clavier et vrais liens. */

const stores = vi.hoisted(() => ({
  user: {} as Record<string, unknown>,
  notifications: {} as Record<string, unknown>,
  cart: {} as Record<string, unknown>
}))
const auth = vi.hoisted(() => ({ logout: vi.fn() }))

vi.mock('@/store/user.store', () => ({ useUserStore: () => stores.user }))
vi.mock('@/store/notification.store', () => ({ useNotificationStore: () => stores.notifications }))
vi.mock('@/store/cart.store', () => ({ useCartStore: () => stores.cart }))
vi.mock('@/store/realtimeSync', () => ({ startRealtimeSync: vi.fn() }))
vi.mock('@/services/authentification.service', () => ({ default: auth }))

import NavBar from '../nav_bar.vue'

const ROUTE_NAMES = [
  'dashboard', 'searchList', 'contact', 'messages', 'cart', 'profile', 'collection',
  'saved_searches', 'payments', 'disputes', 'settings', 'admin', 'add_post'
]

let wrapper: VueWrapper

async function mountNavBar({ isAdmin = false } = {}) {
  stores.user = { profile: ref({ username: 'alice' }), isAdmin: ref(isAdmin), fetchProfile: vi.fn().mockResolvedValue(undefined) }
  stores.notifications = { notifications: ref([]), unreadCount: ref(0), fetch: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn(), remove: vi.fn() }
  stores.cart = { count: ref(0), refresh: vi.fn() }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: ROUTE_NAMES.map((name) => ({ name, path: `/${name}/:id?`, component: { template: '<div />' } }))
  })
  await router.push('/dashboard')

  wrapper = mount(NavBar, {
    attachTo: document.body,
    global: { plugins: [router], stubs: { UserAvatar: true } }
  })
  await flushPromises()
  return wrapper
}

// Une vraie frappe remonte jusqu'à window, où écoute onKeyStroke.
const pressEscape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

describe('nav_bar', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => wrapper?.unmount())

  it('ouvre le menu du compte et le referme avec Escape en rendant le focus', async () => {
    await mountNavBar()
    const trigger = wrapper.find('.navbar__profile')

    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('#navbar-account-menu').exists()).toBe(true)

    pressEscape()
    await flushPromises()

    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('#navbar-account-menu').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger.element)
  })

  it('referme les notifications avec Escape en rendant le focus à la cloche', async () => {
    await mountNavBar()
    const bell = wrapper.find('[aria-controls="navbar-notifications"]')

    await bell.trigger('click')
    expect(bell.attributes('aria-expanded')).toBe('true')

    pressEscape()
    await flushPromises()

    expect(bell.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(bell.element)
  })

  it('n\'a plus de lien factice et pointe vers de vraies adresses', async () => {
    await mountNavBar()
    await wrapper.find('.navbar__profile').trigger('click')

    expect(wrapper.find('a[href="#"]').exists()).toBe(false)
    expect(wrapper.find('.navbar__brand').attributes('href')).toBe('/dashboard')
    expect(wrapper.findAll('.navbar__dropdown-item').map((item) => item.attributes('href'))).toContain('/payments')
  })

  it('ne montre l\'administration qu\'aux administrateurs', async () => {
    await mountNavBar({ isAdmin: false })
    await wrapper.find('.navbar__profile').trigger('click')
    expect(wrapper.text()).not.toContain('Administration')
    wrapper.unmount()

    await mountNavBar({ isAdmin: true })
    await wrapper.find('.navbar__profile').trigger('click')
    expect(wrapper.text()).toContain('Administration')
  })

  it('déconnecte depuis le bouton du menu', async () => {
    await mountNavBar()
    await wrapper.find('.navbar__profile').trigger('click')

    await wrapper.find('.navbar__dropdown-item--danger').trigger('click')

    expect(auth.logout).toHaveBeenCalledTimes(1)
  })
})
