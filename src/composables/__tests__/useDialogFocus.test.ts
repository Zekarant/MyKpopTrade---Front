import { describe, it, expect, afterEach, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { useDialogFocus } from '../useDialogFocus'

/** Focus des boîtes de dialogue : entre à l'ouverture, reste dedans, revient à l'élément d'origine à la fermeture. */

const Dialog = defineComponent({
  props: { preferSecond: Boolean, onEscape: { type: Function, default: undefined } },
  setup(props) {
    const container = ref<HTMLElement | null>(null)
    const second = ref<HTMLElement | null>(null)
    useDialogFocus(container, props.preferSecond ? second : undefined, props.onEscape as (() => void) | undefined)
    return () => h('div', { ref: container, role: 'dialog' }, [
      h('button', { class: 'first' }, 'Premier'),
      h('button', { class: 'second', ref: second }, 'Second'),
    ])
  },
})

let wrapper: VueWrapper | undefined
let opener: HTMLButtonElement

function openDialog(preferSecond = false, onEscape?: () => void) {
  opener = document.createElement('button')
  document.body.appendChild(opener)
  opener.focus()
  wrapper = mount(Dialog, { props: { preferSecond, onEscape }, attachTo: document.body })
  return flushPromises()
}

const press = (key: string, shiftKey = false) =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }))

describe('useDialogFocus', () => {
  afterEach(() => {
    wrapper?.unmount()
    opener?.remove()
  })

  it('garde Tab et Maj+Tab dans la boîte', async () => {
    await openDialog(true)

    press('Tab')
    expect(document.activeElement?.className).toBe('first')
    press('Tab', true)
    expect(document.activeElement?.className).toBe('second')
  })

  it('ferme la boîte avec Escape', async () => {
    const onEscape = vi.fn()
    await openDialog(false, onEscape)

    press('Escape')

    expect(onEscape).toHaveBeenCalledOnce()
  })

  it('laisse la boîte du dessous ignorer Escape quand une autre est ouverte par-dessus', async () => {
    const below = vi.fn()
    const above = vi.fn()
    await openDialog(false, below)
    const top = mount(Dialog, { props: { onEscape: above }, attachTo: document.body })
    await flushPromises()

    press('Escape')
    top.unmount()

    expect(above).toHaveBeenCalledOnce()
    expect(below).not.toHaveBeenCalled()
  })

  it('place le focus sur le premier élément focusable de la boîte', async () => {
    await openDialog()

    expect(document.activeElement?.className).toBe('first')
  })

  it('privilégie l\'élément désigné', async () => {
    await openDialog(true)

    expect(document.activeElement?.className).toBe('second')
  })

  it('rend le focus à l\'élément qui a ouvert la boîte quand elle se ferme', async () => {
    await openDialog()

    wrapper!.unmount()
    wrapper = undefined

    expect(document.activeElement).toBe(opener)
  })
})
