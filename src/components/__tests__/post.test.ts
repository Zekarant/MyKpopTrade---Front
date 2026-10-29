import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { PostResponse } from '@/types/post.types'
import { useCartStore } from '@/store/cart.store'

/** Fiche d'une annonce : lien partageable et actions réservées aux membres connectés. */

const router = vi.hoisted(() => ({ push: vi.fn() }))
const cookies = vi.hoisted(() => ({ get: vi.fn() }))
const postService = vi.hoisted(() => ({ getPost: vi.fn(), addFavorite: vi.fn(), sold: vi.fn() }))
const cartService = vi.hoisted(() => ({ addItem: vi.fn(), getCart: vi.fn() }))
const func = vi.hoisted(() => ({ showToastSuccess: vi.fn(), showToastError: vi.fn() }))

vi.mock('vue-router', () => ({ useRoute: () => ({ params: {} }), useRouter: () => router }))
vi.mock('js-cookie', () => ({ default: cookies }))
vi.mock('@/function', () => ({ func }))
vi.mock('@/services/post.service', () => ({ default: postService }))
vi.mock('@/services/cart.service', () => ({ default: cartService }))
vi.mock('@/services/session.cookies', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/session.cookies')>()),
  hasSession: () => Boolean(cookies.get('id_user'))
}))
vi.mock('@/services/payment.service', () => ({ default: {} }))
vi.mock('@/services/messaging.service', () => ({ default: {} }))
vi.mock('@/components/ImageCarousel.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/report_card.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/adherents/send_message.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/send_offer.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/checkout/CheckoutDialog.vue', () => ({ default: { name: 'CheckoutDialog', template: '<div />' } }))
vi.mock('@/components/VerifiedBadge.vue', () => ({ default: { template: '<span />' } }))

import Post from '../post.vue'

const productResponse: PostResponse = {
  product: {
    _id: 'p1',
    title: 'Photocard Jimin',
    description: 'Neuve',
    price: 20,
    currency: 'EUR',
    condition: 'new',
    category: 'photocard',
    type: 'photocard',
    kpopGroup: 'BTS',
    images: [],
    isAvailable: true,
    allowOffers: false,
    shippingOptions: { worldwide: false, nationalOnly: true, localPickup: false },
    seller: { _id: 's1', username: 'minnie' },
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
  isFavorite: false,
}

async function mountPost(product: PostResponse = productResponse) {
  const wrapper = mount(Post, {
    props: { idPost: 'p1', product },
    global: { stubs: { 'router-link': RouterLinkStub } },
  })
  await flushPromises()
  return wrapper
}

const button = (wrapper: Awaited<ReturnType<typeof mountPost>>, label: string) =>
  wrapper.findAll('button').find((b) => b.text().includes(label))!

describe('post (fiche annonce)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    cookies.get.mockReturnValue(undefined)
  })

  it('affiche l\'annonce transmise par le parent sans la recharger', async () => {
    const wrapper = await mountPost()

    expect(wrapper.text()).toContain('Photocard Jimin')
    expect(postService.getPost).not.toHaveBeenCalled()
  })

  it('envoie un visiteur anonyme vers la connexion, retour sur l\'annonce, au lieu d\'ouvrir le paiement', async () => {
    const wrapper = await mountPost()

    await button(wrapper, 'Acheter').trigger('click')

    expect(router.push).toHaveBeenCalledWith({ name: 'login', query: { redirect: '/products/p1' } })
    expect(wrapper.findComponent({ name: 'CheckoutDialog' }).exists()).toBe(false)
  })

  it('n\'appelle pas l\'API des favoris pour un visiteur anonyme', async () => {
    const wrapper = await mountPost()

    await wrapper.find('.post-modal__fav-btn').trigger('click')

    expect(postService.addFavorite).not.toHaveBeenCalled()
    expect(router.push).toHaveBeenCalledWith({ name: 'login', query: { redirect: '/products/p1' } })
  })

  it('laisse un membre connecté ajouter l\'article au panier', async () => {
    cookies.get.mockReturnValue('u1')
    cartService.addItem.mockResolvedValue(undefined)
    const wrapper = await mountPost()

    await button(wrapper, 'Panier').trigger('click')
    await flushPromises()

    expect(cartService.addItem).toHaveBeenCalledWith('p1')
    expect(router.push).not.toHaveBeenCalled()
  })

  it('met à jour le badge du panier après un ajout', async () => {
    cookies.get.mockReturnValue('u1')
    cartService.addItem.mockResolvedValue(undefined)
    cartService.getCart.mockResolvedValue({ items: [{}, {}] })
    const wrapper = await mountPost()

    await button(wrapper, 'Panier').trigger('click')
    await flushPromises()

    expect(useCartStore().count).toBe(2)
  })

  it('relie le groupe et l\'album aux pages catalogue, et affiche version et authenticité', async () => {
    const wrapper = await mountPost({
      ...productResponse,
      product: {
        ...productResponse.product,
        kpopGroupName: 'BTS', kpopGroupId: 'g1', albumNameStr: 'BE', albumId: 'a1',
        version: 'Ver. A', isOfficial: true,
      },
    })

    const links = wrapper.findAllComponents(RouterLinkStub)
    expect(links.map((link) => [link.text(), link.props('to')])).toEqual([
      ['BTS', { name: 'group', params: { id: 'g1' } }],
      ['BE', { name: 'album', params: { id: 'a1' } }],
    ])
    expect(wrapper.text()).toContain('Ver. A')
    expect(wrapper.text()).toContain('Officiel')
  })

  it('copie le lien partageable de l\'annonce', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const wrapper = await mountPost()

    await wrapper.find('.post-modal__actions-menu').trigger('click')
    await button(wrapper, 'Copier le lien').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/products/p1`)
    expect(func.showToastSuccess).toHaveBeenCalledWith('Lien copié')
  })

  describe('confirmations du vendeur', () => {
    async function openSoldDialog() {
      cookies.get.mockReturnValue('s1')
      const wrapper = await mountPost()
      await wrapper.find('.post-modal__actions-menu').trigger('click')
      await button(wrapper, 'Vendu').trigger('click')
      return wrapper
    }

    it('marque l\'article vendu une seule fois et prévient le parent', async () => {
      postService.sold.mockResolvedValue(true)
      const wrapper = await openSoldDialog()

      await button(wrapper, 'Confirmer').trigger('click')
      await flushPromises()

      expect(postService.sold).toHaveBeenCalledTimes(1)
      // Vente hors plateforme : aucun acheteur, et surtout pas le vendeur lui-même.
      expect(postService.sold).toHaveBeenCalledWith('p1')
      expect(wrapper.emitted('sold')).toHaveLength(1)
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('garde la confirmation ouverte et explique l\'échec si la vente n\'est pas enregistrée', async () => {
      postService.sold.mockRejectedValue(new Error('Network Error'))
      const wrapper = await openSoldDialog()

      await button(wrapper, 'Confirmer').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('sold')).toBeUndefined()
      expect(func.showToastError).toHaveBeenCalledWith('Impossible de marquer cet article comme vendu.')
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    })

    it('ferme la confirmation avec Échap, sans rien changer', async () => {
      const wrapper = await openSoldDialog()
      const dialog = wrapper.get('[role="dialog"]')
      expect(dialog.attributes('aria-modal')).toBe('true')
      expect(wrapper.get(`#${dialog.attributes('aria-labelledby')}`).text()).toBe('Marquer cet article comme vendu ?')

      await dialog.trigger('keydown', { key: 'Escape' })

      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
      expect(postService.sold).not.toHaveBeenCalled()
    })
  })
})
