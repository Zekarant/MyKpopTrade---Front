import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

/** Bouton de blocage : état affiché, confirmation accessible et appel à l'API. */

const blockApi = vi.hoisted(() => ({
  getStatus: vi.fn(),
  block: vi.fn(),
  unblock: vi.fn()
}))
const toasts = vi.hoisted(() => ({ showToastSuccess: vi.fn(), showToastError: vi.fn() }))

vi.mock('@/services/block.service', () => ({ default: blockApi }))
vi.mock('@/function', () => ({ func: toasts }))

import BlockUserButton from '../adherents/BlockUserButton.vue'

async function mountButton(props: Record<string, unknown> = {}) {
  const wrapper = mount(BlockUserButton, {
    props: { userId: 'alice-id', username: 'AliceK', ...props },
    attachTo: document.body,
    global: { stubs: { teleport: true } }
  })
  await flushPromises()
  return wrapper
}

const trigger = (wrapper: Awaited<ReturnType<typeof mountButton>>) => wrapper.find('.block-user-btn')

describe('BlockUserButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    blockApi.getStatus.mockResolvedValue({ isBlocked: false, blockedByMe: false })
    blockApi.block.mockResolvedValue(undefined)
    blockApi.unblock.mockResolvedValue(undefined)
  })

  it('propose « Bloquer » pour un membre non bloqué', async () => {
    const wrapper = await mountButton()

    expect(blockApi.getStatus).toHaveBeenCalledWith('alice-id')
    expect(trigger(wrapper).text()).toBe('Bloquer')
    wrapper.unmount()
  })

  it('ouvre une boîte de dialogue accessible, focus sur « Annuler », avant tout blocage', async () => {
    const wrapper = await mountButton()

    await trigger(wrapper).trigger('click')
    await flushPromises()

    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.text()).toContain('Bloquer AliceK ?')
    expect(document.activeElement?.textContent?.trim()).toBe('Annuler')
    expect(blockApi.block).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('bloque après confirmation, puis propose « Débloquer »', async () => {
    const wrapper = await mountButton()

    await trigger(wrapper).trigger('click')
    await wrapper.find('.block-confirm__btn--confirm').trigger('click')
    await flushPromises()

    expect(blockApi.block).toHaveBeenCalledWith('alice-id')
    expect(wrapper.emitted('change')).toEqual([[{ isBlocked: true, blockedByMe: true }]])
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(trigger(wrapper).text()).toBe('Débloquer')
    wrapper.unmount()
  })

  it('ferme la boîte de dialogue avec Échap sans rien bloquer', async () => {
    const wrapper = await mountButton()

    await trigger(wrapper).trigger('click')
    await wrapper.find('.block-confirm-overlay').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(blockApi.block).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('débloque et relit la situation, sans appel initial quand elle est fournie', async () => {
    blockApi.getStatus.mockResolvedValue({ isBlocked: false, blockedByMe: false })
    const wrapper = await mountButton({ initialStatus: { isBlocked: true, blockedByMe: true } })
    expect(blockApi.getStatus).not.toHaveBeenCalled()
    expect(trigger(wrapper).text()).toBe('Débloquer')

    await trigger(wrapper).trigger('click')
    await wrapper.find('.block-confirm__btn--confirm').trigger('click')
    await flushPromises()

    expect(blockApi.unblock).toHaveBeenCalledWith('alice-id')
    expect(wrapper.emitted('change')).toEqual([[{ isBlocked: false, blockedByMe: false }]])
    wrapper.unmount()
  })

  it('affiche l\'erreur de l\'API et garde l\'état si le blocage échoue', async () => {
    blockApi.block.mockRejectedValue(new Error('réseau'))
    const wrapper = await mountButton()

    await trigger(wrapper).trigger('click')
    await wrapper.find('.block-confirm__btn--confirm').trigger('click')
    await flushPromises()

    expect(toasts.showToastError).toHaveBeenCalledWith('Impossible de bloquer ce membre.')
    expect(trigger(wrapper).text()).toBe('Bloquer')
    wrapper.unmount()
  })
})
