import { describe, it, expect, afterEach, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { DISCARD_TEXT_QUESTION, useDialogFocus } from '../useDialogFocus'

/** Focus des boîtes de dialogue : entre à l'ouverture, reste dedans, revient à l'élément d'origine à la fermeture. */

const Dialog = defineComponent({
  props: {
    preferSecond: Boolean,
    onEscape: { type: Function, default: undefined },
    // Champ texte et sa valeur à l'ouverture (absent si `undefined`).
    text: { type: String, default: undefined },
  },
  setup(props) {
    const container = ref<HTMLElement | null>(null)
    const second = ref<HTMLElement | null>(null)
    useDialogFocus(container, props.preferSecond ? second : undefined, props.onEscape as (() => void) | undefined)
    return () => h('div', { ref: container, role: 'dialog' }, [
      h('button', { class: 'first' }, 'Premier'),
      h('button', { class: 'second', ref: second }, 'Second'),
      ...(props.text === undefined
        ? []
        : [h('textarea', { value: props.text }), h('input', { type: 'text', class: 'search', 'data-no-draft': '' })]),
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

/** Saisie au clavier : la valeur change et le champ émet `input`, contrairement à un pré-remplissage. */
const typeInto = (field: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  field.value = value
  field.dispatchEvent(new Event('input', { bubbles: true }))
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

  describe('Escape avec un texte non envoyé', () => {
    const openWithText = async (text: string, onEscape: () => void) => {
      wrapper = mount(Dialog, { props: { onEscape, text }, attachTo: document.body })
      await flushPromises()
      return wrapper.find('textarea').element as HTMLTextAreaElement
    }

    afterEach(() => vi.restoreAllMocks())

    it('demande confirmation et garde la boîte ouverte si on refuse', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
      const onEscape = vi.fn()
      const field = await openWithText('', onEscape)

      typeInto(field, 'Annonce frauduleuse')
      press('Escape')

      expect(confirmSpy).toHaveBeenCalledWith(DISCARD_TEXT_QUESTION)
      expect(onEscape).not.toHaveBeenCalled()
    })

    it('ferme la boîte si on confirme l\'abandon', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const onEscape = vi.fn()
      const field = await openWithText('', onEscape)

      typeInto(field, 'Merci pour votre avis')
      press('Escape')

      expect(onEscape).toHaveBeenCalledOnce()
    })

    it('ne demande rien pour un champ pré-rempli, ni pour un champ vidé', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const onEscape = vi.fn()
      const field = await openWithText('25', onEscape)

      press('Escape')
      typeInto(field, '   ')
      press('Escape')

      expect(confirmSpy).not.toHaveBeenCalled()
      expect(onEscape).toHaveBeenCalledTimes(2)
    })

    it('ignore les champs marqués data-no-draft (recherche)', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')
      const onEscape = vi.fn()
      await openWithText('', onEscape)

      typeInto(wrapper!.find('.search').element as HTMLInputElement, 'min')
      press('Escape')

      expect(confirmSpy).not.toHaveBeenCalled()
      expect(onEscape).toHaveBeenCalledOnce()
    })
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
