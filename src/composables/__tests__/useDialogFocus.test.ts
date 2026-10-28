import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { useDialogFocus } from '../useDialogFocus'

/** Focus des boîtes de dialogue : entre à l'ouverture, revient à l'élément d'origine à la fermeture. */

const Dialog = defineComponent({
  props: { preferSecond: Boolean },
  setup(props) {
    const container = ref<HTMLElement | null>(null)
    const second = ref<HTMLElement | null>(null)
    useDialogFocus(container, props.preferSecond ? second : undefined)
    return () => h('div', { ref: container, role: 'dialog' }, [
      h('button', { class: 'first' }, 'Premier'),
      h('button', { class: 'second', ref: second }, 'Second'),
    ])
  },
})

let wrapper: VueWrapper | undefined
let opener: HTMLButtonElement

function openDialog(preferSecond = false) {
  opener = document.createElement('button')
  document.body.appendChild(opener)
  opener.focus()
  wrapper = mount(Dialog, { props: { preferSecond }, attachTo: document.body })
  return flushPromises()
}

describe('useDialogFocus', () => {
  afterEach(() => {
    wrapper?.unmount()
    opener?.remove()
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
